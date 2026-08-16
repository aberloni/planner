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
  // Basé sur l'échelle optique réelle (zoneAffichage().echelle), pas
  // seulement sur viewBox.largeur : sinon ce chiffre diverge de ce
  // qu'affichent les règles/la grille/le gizmo d'échelle dès qu'il y a du
  // letterboxing (ratio du plan différent de celui de la zone de travail).
  zoomActuel() {
    if (!this.largeurPlan) return 1;
    return this.zoneAffichage().echelle;
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
    const rectLargeur = rect.largeur * (1 + PADDING_RATIO * 2);
    const rectHauteur = rect.hauteur * (1 + PADDING_RATIO * 2);

    const conteneur = this.svg.getBoundingClientRect();
    const centreX = rect.x + rect.largeur / 2;
    let centreY = rect.y + rect.hauteur / 2;
    let largeur = rectLargeur;
    let hauteur = rectHauteur;

    if (conteneur.width && conteneur.height) {
      // Le SVG (preserveAspectRatio "meet") rend toujours à l'échelle
      // min(largeurConteneur/viewBoxLargeur, hauteurConteneur/viewBoxHauteur)
      // calculée sur sa boîte complète — mais seule la zone dégagée
      // verticalement (hors contrôles de zoom en haut, boutons ronds en bas)
      // est réellement visible à l'écran. Si on calcule l'échelle sur la
      // hauteur complète du conteneur, le rectangle+padding déborde donc
      // sous les contrôles flottants sans que ça dézoome pour compenser. On
      // calcule ici l'échelle qui fait tenir le rectangle+padding dans
      // largeurConteneur x hauteurDégagée, puis on en déduit le viewBox
      // (sur la boîte complète) correspondant à cette échelle.
      const zone = this._zoneVerticaleDegagee(conteneur);
      const hauteurDegagee = zone.bas - zone.haut;
      const echelle = Math.min(conteneur.width / rectLargeur, hauteurDegagee / rectHauteur);
      largeur = conteneur.width / echelle;
      hauteur = conteneur.height / echelle;

      // Le SVG centre toujours son viewBox sur le centre géométrique exact
      // de sa boîte complète : on décale donc le centre du viewBox pour que
      // le rendu paraisse centré sur la zone dégagée, pas sur la boîte
      // entière (sinon padding visuellement inégal en haut/bas).
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
  // ".bouton-rond" en bas) — utilisé par cadrerSurRectangle pour centrer sur
  // l'espace réellement visible. Repli sur la boîte SVG complète si un
  // élément est absent/caché (getBoundingClientRect renvoie alors une
  // largeur nulle) — ex. les boutons ronds masqués tant qu'aucun blueprint
  // n'est chargé.
  _zoneVerticaleDegagee(conteneur) {
    const MARGE = 12;
    const controles = document.getElementById("controles-zoom");
    const rectControles = controles && controles.getBoundingClientRect().width ? controles.getBoundingClientRect() : null;

    // Le haut des boutons ronds du bas (le plus proche du plan parmi ceux
    // visibles) : pas d'id unique fiable, leur composition change (ex.
    // "Mode édition" déplacé vers la barre d'outils en 08-16 — voir
    // CHANGELOG), d'où une classe partagée plutôt qu'un id en dur.
    const rectsBoutonsBas = [...document.querySelectorAll(".bouton-rond")]
      .map((el) => el.getBoundingClientRect())
      .filter((r) => r.width);
    const topBoutonsBas = rectsBoutonsBas.length ? Math.min(...rectsBoutonsBas.map((r) => r.top)) : null;

    let haut = rectControles ? rectControles.bottom + MARGE : conteneur.top;
    let bas = topBoutonsBas !== null ? topBoutonsBas - MARGE : conteneur.bottom;
    haut = Math.min(Math.max(haut, conteneur.top), conteneur.bottom);
    bas = Math.max(Math.min(bas, conteneur.bottom), conteneur.top);

    return haut < bas ? { haut, bas } : { haut: conteneur.top, bas: conteneur.bottom };
  },

  // Revient à 100% de zoom (1 px du plan = 1 px écran) en gardant le centre
  // de la vue actuelle fixe (pas de reset du pan) — utilisé par le bouton
  // "%age" des contrôles de zoom, à la différence de reinitialiserZoom()
  // (bouton "Cadrer"). Le viewBox doit reprendre exactement les dimensions
  // (en px CSS) de la zone de travail, pas celles du plan : sinon, dès que
  // le ratio du plan diffère de celui du conteneur (letterboxing), on
  // obtient un zoom <100% malgré le label — voir zoneAffichage().
  zoomA100() {
    if (!this.largeurPlan) return;
    const vb = this.viewBox;
    const centreX = vb.x + vb.largeur / 2;
    const centreY = vb.y + vb.hauteur / 2;
    const rect = this.svg.getBoundingClientRect();
    this.viewBox = {
      x: centreX - rect.width / 2,
      y: centreY - rect.height / 2,
      largeur: rect.width,
      hauteur: rect.height
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
