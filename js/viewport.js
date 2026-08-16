// Zone de travail SVG : affichage du plan, zoom et pan via manipulation du viewBox.
const Viewport = {

  NS: "http://www.w3.org/2000/svg",

  svg: null,
  imageFond: null,
  calques: null, // { fond, habillage, meubles } -> <g> SVG, dans l'ordre d'empilement
  largeurPlan: 0,
  hauteurPlan: 0,
  viewBox: { x: 0, y: 0, largeur: 0, hauteur: 0 },
  zoomMin: 0.1,
  zoomMax: 8,
  panEnCours: null, // { xDepart, yDepart, viewBoxDepart, dragging }
  panDesactive: false, // true pendant un outil qui a besoin du drag pour lui-même (voir Mesure)
  SEUIL_DRAG: 4, // px écran à dépasser avant de considérer que c'est un drag (pas juste un clic)
  ecouteurs: [], // callbacks appelés à chaque changement de viewBox (zoom/pan)
  ecouteursClicSimple: [], // callbacks appelés sur un clic (pointerdown+up sans déplacement)

  init(svgEl) {
    this.svg = svgEl;
    this._creerCalques();
    this._ecouterZoom();
    this._ecouterPan();
  },

  // Crée les 3 groupes de calques fixes, dans l'ordre d'empilement
  // (fond en bas, meubles en haut) — voir documentation/12-calques.md.
  _creerCalques() {
    this.calques = {
      fond: document.createElementNS(this.NS, "g"),
      habillage: document.createElementNS(this.NS, "g"),
      meubles: document.createElementNS(this.NS, "g")
    };
    this.calques.fond.setAttribute("id", "calque-fond");
    this.calques.habillage.setAttribute("id", "calque-habillage");
    this.calques.meubles.setAttribute("id", "calque-meubles");
    this.svg.appendChild(this.calques.fond);
    this.svg.appendChild(this.calques.habillage);
    this.svg.appendChild(this.calques.meubles);
  },

  // Enregistre un callback appelé à chaque changement de viewBox (zoom/pan/plan chargé).
  alChangement(callback) {
    this.ecouteurs.push(callback);
  },

  // Enregistre un callback appelé quand l'utilisateur clique sans faire glisser
  // (utile pour placer un point sans déclencher le pan). Reçoit les coordonnées
  // du clic converties dans le référentiel du plan.
  alClicSimple(callback) {
    this.ecouteursClicSimple.push(callback);
  },

  // Niveau de zoom actuel (1 = 100%, plan affiché à sa taille naturelle).
  zoomActuel() {
    if (!this.largeurPlan) return 1;
    return this.largeurPlan / this.viewBox.largeur;
  },

  // Charge le plan : crée/replace l'image de fond et cadre le viewBox dessus.
  definirPlan(dataUrl, largeurPx, hauteurPx) {
    this.largeurPlan = largeurPx;
    this.hauteurPlan = hauteurPx;

    if (!this.imageFond) {
      this.imageFond = document.createElementNS(this.NS, "image");
      this.imageFond.setAttribute("x", "0");
      this.imageFond.setAttribute("y", "0");
      this.imageFond.style.pointerEvents = "none";
      this.calques.fond.appendChild(this.imageFond);
    }
    this.imageFond.setAttribute("width", largeurPx);
    this.imageFond.setAttribute("height", hauteurPx);
    this.imageFond.setAttribute("href", dataUrl);

    this.reinitialiserZoom();
  },

  // Cadre le viewBox exactement sur les dimensions naturelles du plan (zoom
  // 100%), origine remise à (0,0) : réinitialise aussi le pan. Utilisé au
  // chargement du plan et par le bouton "Cadrer".
  reinitialiserZoom() {
    if (!this.largeurPlan) return;
    this.viewBox = { x: 0, y: 0, largeur: this.largeurPlan, hauteur: this.hauteurPlan };
    this._appliquerViewBox();
  },

  // Cadre le viewBox sur un rectangle donné (ex. le cadre d'export PNG),
  // centré, avec un petit padding autour pour bien voir ses bords. Utilisé
  // par le bouton "Cadrer" des contrôles de zoom.
  //
  // Le SVG garde son ratio (preserveAspectRatio "xMidYMid meet" par défaut,
  // voir zoneAffichage) : si on se contente de viewBox = rect + padding sans
  // tenir compte du ratio du conteneur, l'axe qui n'est pas "contraignant"
  // (celui où le ratio du rectangle laisse le plus de marge par rapport au
  // conteneur) ne détermine pas le zoom réel — il se contente d'un
  // letterboxing invisible, sans dézoomer visuellement. Pour cadrer
  // correctement sur les deux axes, on étend le rectangle+padding pour
  // matcher le ratio du conteneur avant de l'appliquer comme viewBox.
  cadrerSurRectangle(rect) {
    if (!this.largeurPlan || !rect) return;
    const PADDING_RATIO = 0.2;
    let largeur = rect.largeur * (1 + PADDING_RATIO * 2);
    let hauteur = rect.hauteur * (1 + PADDING_RATIO * 2);

    const conteneur = this.svg.getBoundingClientRect();
    const centreX = rect.x + rect.largeur / 2;
    let centreY = rect.y + rect.hauteur / 2;

    if (conteneur.width && conteneur.height) {
      const ratioConteneur = conteneur.width / conteneur.height;
      const ratioCible = largeur / hauteur;
      if (ratioCible > ratioConteneur) hauteur = largeur / ratioConteneur;
      else largeur = hauteur * ratioConteneur;

      // Le SVG (preserveAspectRatio "meet") centre toujours son viewBox
      // sur le centre géométrique exact de sa propre boîte — mais cette
      // boîte n'est pas entièrement dégagée à l'écran : les contrôles de
      // zoom (haut) et les boutons ronds (bas) empiètent dessus, et pas de
      // façon symétrique. On décale donc le centre du viewBox pour que le
      // rendu paraisse centré sur la zone réellement visible, pas sur la
      // boîte SVG complète (sinon padding visuellement inégal en haut/bas).
      const echelle = conteneur.height / hauteur;
      const zone = this._zoneVerticaleDegagee(conteneur);
      const centreZoneY = (zone.haut + zone.bas) / 2;
      const centreConteneurY = conteneur.top + conteneur.height / 2;
      centreY -= (centreZoneY - centreConteneurY) / echelle;
    }

    this.viewBox = {
      x: centreX - largeur / 2,
      y: centreY - hauteur / 2,
      largeur,
      hauteur
    };
    this._appliquerViewBox();
  },

  // Bornes verticales (coordonnées écran) de la zone du viewport non
  // couverte par le chrome flottant (#controles-zoom en haut, boutons ronds
  // en bas) — utilisé par cadrerSurRectangle pour centrer sur l'espace
  // réellement visible. Repli sur la boîte SVG complète si un élément est
  // absent/caché (getBoundingClientRect renvoie alors une largeur nulle).
  _zoneVerticaleDegagee(conteneur) {
    const MARGE = 12;
    const controles = document.getElementById("controles-zoom");
    const boutonBas = document.getElementById("btn-mode");
    const rectControles = controles && controles.getBoundingClientRect().width ? controles.getBoundingClientRect() : null;
    const rectBoutonBas = boutonBas && boutonBas.getBoundingClientRect().width ? boutonBas.getBoundingClientRect() : null;

    let haut = rectControles ? rectControles.bottom + MARGE : conteneur.top;
    let bas = rectBoutonBas ? rectBoutonBas.top - MARGE : conteneur.bottom;
    haut = Math.min(Math.max(haut, conteneur.top), conteneur.bottom);
    bas = Math.max(Math.min(bas, conteneur.bottom), conteneur.top);

    return haut < bas ? { haut, bas } : { haut: conteneur.top, bas: conteneur.bottom };
  },

  // Applique un viewBox exact (calculé ailleurs, ex. pour reproduire le
  // cadrage d'une session précédente au changement de session — voir
  // app.js, capturerCadrage/appliquerCadrage).
  definirViewBox(vb) {
    if (!this.largeurPlan) return;
    this.viewBox = { ...vb };
    this._appliquerViewBox();
  },

  // Revient à 100% de zoom en gardant le centre de la vue actuelle fixe
  // (pas de reset du pan) — utilisé par le bouton "%age" des contrôles de
  // zoom, à la différence de reinitialiserZoom() (bouton "Cadrer").
  zoomA100() {
    if (!this.largeurPlan) return;
    const vb = this.viewBox;
    const centreX = vb.x + vb.largeur / 2;
    const centreY = vb.y + vb.hauteur / 2;
    this.viewBox = {
      x: centreX - this.largeurPlan / 2,
      y: centreY - this.hauteurPlan / 2,
      largeur: this.largeurPlan,
      hauteur: this.hauteurPlan
    };
    this._appliquerViewBox();
  },

  _appliquerViewBox() {
    const vb = this.viewBox;
    this.svg.setAttribute("viewBox", `${vb.x} ${vb.y} ${vb.largeur} ${vb.hauteur}`);
    this.ecouteurs.forEach((callback) => callback());
  },

  // Le SVG garde le ratio du plan (preserveAspectRatio par défaut "xMidYMid
  // meet") : si la zone de travail n'a pas exactement le même ratio que le
  // plan, il y a des bandes vides (letterboxing) de part et d'autre. Ce
  // calcul donne l'échelle réelle et le décalage de ces bandes, pour que la
  // conversion écran <-> viewBox reste juste.
  zoneAffichage() {
    const rect = this.svg.getBoundingClientRect();
    const vb = this.viewBox;
    const echelle = Math.min(rect.width / vb.largeur, rect.height / vb.hauteur);
    const largeurAffichee = vb.largeur * echelle;
    const hauteurAffichee = vb.hauteur * echelle;
    return {
      rect,
      echelle,
      decalageX: (rect.width - largeurAffichee) / 2,
      decalageY: (rect.height - hauteurAffichee) / 2
    };
  },

  // Convertit des coordonnées écran (pixels du navigateur) en coordonnées du viewBox.
  versCoordonneesViewBox(xEcran, yEcran) {
    const { rect, echelle, decalageX, decalageY } = this.zoneAffichage();
    const vb = this.viewBox;
    return {
      x: vb.x + (xEcran - rect.left - decalageX) / echelle,
      y: vb.y + (yEcran - rect.top - decalageY) / echelle
    };
  },

  zoomVers(facteur, xEcran, yEcran) {
    const vb = this.viewBox;
    const largeurActuelle = vb.largeur;
    const nouvelleLargeur = this._clamperZoom(largeurActuelle, facteur);
    const facteurReel = nouvelleLargeur / largeurActuelle;

    const centre = this.versCoordonneesViewBox(xEcran, yEcran);

    vb.x = centre.x - (centre.x - vb.x) * facteurReel;
    vb.y = centre.y - (centre.y - vb.y) * facteurReel;
    vb.largeur *= facteurReel;
    vb.hauteur *= facteurReel;

    this._appliquerViewBox();
  },

  _clamperZoom(largeurActuelle, facteur) {
    const largeurPleinZoom = this.largeurPlan / this.zoomMax;
    const largeurZoomMin = this.largeurPlan / this.zoomMin;
    const nouvelleLargeur = largeurActuelle * facteur;
    return Math.min(Math.max(nouvelleLargeur, largeurPleinZoom), largeurZoomMin);
  },

  // Zoom d'un delta absolu (ex. 0.1 = +10 points de zoom, 120% -> 130%),
  // pas relatif au niveau actuel. `delta` négatif pour dézoomer.
  zoomAbsolu(delta, xEcran, yEcran) {
    const zoomActuel = this.zoomActuel();
    const zoomCible = Math.max(0.01, zoomActuel + delta);
    this.zoomVers(zoomActuel / zoomCible, xEcran, yEcran);
  },

  _ecouterZoom() {
    this.svg.addEventListener("wheel", (evenement) => {
      if (!this.largeurPlan) return;
      evenement.preventDefault();
      const facteur = evenement.deltaY < 0 ? 0.9 : 1.1;
      this.zoomVers(facteur, evenement.clientX, evenement.clientY);
    }, { passive: false });

    // Double-clic : +25 points de zoom en valeur absolue, centré sur le point cliqué.
    // Ignoré si le double-clic touche un objet posé (meuble/masque) — sinon
    // il entre en conflit avec la sélection/interaction sur cet objet.
    this.svg.addEventListener("dblclick", (evenement) => {
      if (!this.largeurPlan) return;
      if (evenement.target.closest(".objet-plan")) return;
      evenement.preventDefault();
      this.zoomAbsolu(0.25, evenement.clientX, evenement.clientY);
    });
  },

  // Boutons +/- de la barre d'outils : +/-10 points de zoom en valeur absolue.
  zoomBouton(delta) {
    if (!this.largeurPlan) return;
    const rect = this.svg.getBoundingClientRect();
    this.zoomAbsolu(delta, rect.left + rect.width / 2, rect.top + rect.height / 2);
  },

  // Pan au clic simple : on clique, on reste appuyé, on bouge la souris. Le
  // pan ne démarre réellement qu'après avoir dépassé SEUIL_DRAG, pour
  // pouvoir distinguer un clic (sélection/calibration) d'un glisser (pan).
  _ecouterPan() {
    // Empêche les comportements natifs du navigateur sur mousedown (sélection
    // de texte au clic gauche, auto-scroll au clic-molette) : sans ça, ils
    // entrent en concurrence avec notre pan et la vue dérive toute seule
    // (notamment vers le haut, l'auto-scroll de sélection near-edge).
    this.svg.addEventListener("mousedown", (evenement) => {
      if (evenement.button === 0 || evenement.button === 1) evenement.preventDefault();
    });
    this.svg.addEventListener("auxclick", (evenement) => {
      if (evenement.button === 1) evenement.preventDefault();
    });

    this.svg.addEventListener("pointerdown", (evenement) => {
      if (evenement.button !== 0 && evenement.button !== 1) return;
      if (this.panDesactive) return;

      evenement.preventDefault();
      this.svg.setPointerCapture(evenement.pointerId);
      this.panEnCours = {
        xDepart: evenement.clientX,
        yDepart: evenement.clientY,
        viewBoxDepart: { ...this.viewBox },
        dragging: false
      };
    });

    this.svg.addEventListener("pointermove", (evenement) => {
      if (!this.panEnCours) return;
      const pan = this.panEnCours;
      const dxEcran = evenement.clientX - pan.xDepart;
      const dyEcran = evenement.clientY - pan.yDepart;

      if (!pan.dragging) {
        if (Math.hypot(dxEcran, dyEcran) < this.SEUIL_DRAG) return;
        pan.dragging = true;
        this.svg.classList.add("pan-actif");
      }

      const { echelle } = this.zoneAffichage();
      this.viewBox.x = pan.viewBoxDepart.x - dxEcran / echelle;
      this.viewBox.y = pan.viewBoxDepart.y - dyEcran / echelle;
      this._appliquerViewBox();
    });

    const finDuPan = (evenement) => {
      if (!this.panEnCours) return;
      this.svg.releasePointerCapture(evenement.pointerId);

      if (this.panEnCours.dragging) {
        this.svg.classList.remove("pan-actif");
      } else {
        const point = this.versCoordonneesViewBox(evenement.clientX, evenement.clientY);
        this.ecouteursClicSimple.forEach((callback) => callback(point));
      }
      this.panEnCours = null;
    };
    this.svg.addEventListener("pointerup", finDuPan);
    this.svg.addEventListener("pointercancel", finDuPan);
  }
};
