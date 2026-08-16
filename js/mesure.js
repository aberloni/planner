// Outil "Mesurer" (bouton rond bas droite) : mesure une distance sur le plan
// en utilisant l'échelle actuelle (Echelle.pxParCm), sans rien poser sur le
// plan. Deux façons de l'utiliser, au choix, tant que l'outil est actif :
// - deux clics simples (premier point, puis second point) ;
// - un cliquer-glisser (le segment se dessine en direct, résultat au relâchement).
// Le résultat s'affiche dans Statut, comme les autres outils (Échelle, Origine).
const Mesure = {

  NS: "http://www.w3.org/2000/svg",

  svg: null,
  bouton: null,
  overlay: null,
  actif: false,
  points: [], // points cliqués (mode "deux clics"), vidé après chaque mesure
  glisse: null, // { depart, dragging } pendant un cliquer-glisser en cours

  init(svgEl, boutonEl) {
    this.svg = svgEl;
    this.bouton = boutonEl;
    this.bouton.addEventListener("click", () => this.basculer());
    this.svg.addEventListener("pointerdown", (evenement) => this._surPointerDown(evenement));
    this.svg.addEventListener("pointermove", (evenement) => this._surPointerMove(evenement));
    this.svg.addEventListener("pointerup", (evenement) => this._surPointerUp(evenement));

    // Espace ou Échap : quitte le mode mesure (ignoré si on tape dans un champ).
    document.addEventListener("keydown", (evenement) => {
      if (!this.actif) return;
      const cible = evenement.target;
      if (cible instanceof HTMLInputElement || cible instanceof HTMLTextAreaElement || cible instanceof HTMLSelectElement) return;
      if (evenement.key !== "Escape" && evenement.key !== " ") return;
      evenement.preventDefault();
      this.arreter();
    });
  },

  basculer() {
    if (this.actif) this.arreter();
    else this.demarrer();
  },

  demarrer() {
    if (!Viewport.largeurPlan) return;
    this.actif = true;
    this.points = [];
    this.glisse = null;
    Viewport.panDesactive = true;
    this.svg.classList.add("mesure-active");
    this.bouton.classList.add("actif");
    // Verrouille le reste de l'UI (barre d'outils, boutons flottants,
    // panneaux) tant que la mesure n'est pas terminée ou annulée — évite de
    // se retrouver avec un autre outil démarré par-dessus une mesure en cours.
    document.body.classList.add("mesure-exclusive");
    Statut.definir(I18n.t("mesure.clique_plan"));
  },

  arreter() {
    this.actif = false;
    this.points = [];
    this.glisse = null;
    Viewport.panDesactive = false;
    this.svg.classList.remove("mesure-active");
    this.bouton.classList.remove("actif");
    document.body.classList.remove("mesure-exclusive");
    this._effacerOverlay();
  },

  _effacerOverlay() {
    if (this.overlay) this.overlay.remove();
    this.overlay = null;
  },

  _creerOverlay() {
    this._effacerOverlay();
    this.overlay = document.createElementNS(this.NS, "g");
    this.overlay.setAttribute("id", "mesure-overlay");
    this.svg.appendChild(this.overlay);
  },

  _dessinerPoint(point) {
    const cercle = document.createElementNS(this.NS, "circle");
    cercle.setAttribute("cx", point.x);
    cercle.setAttribute("cy", point.y);
    cercle.setAttribute("r", 5);
    cercle.setAttribute("class", "point-mesure");
    this.overlay.appendChild(cercle);
  },

  _dessinerSegment(a, b) {
    const ligne = document.createElementNS(this.NS, "line");
    ligne.setAttribute("x1", a.x);
    ligne.setAttribute("y1", a.y);
    ligne.setAttribute("x2", b.x);
    ligne.setAttribute("y2", b.y);
    ligne.setAttribute("class", "segment-mesure");
    this.overlay.appendChild(ligne);
    return ligne;
  },

  _surPointerDown(evenement) {
    if (!this.actif) return;
    if (evenement.button !== 0 && evenement.button !== 1) return;
    evenement.preventDefault();
    this.svg.setPointerCapture(evenement.pointerId);
    this.glisse = {
      depart: Viewport.versCoordonneesViewBox(evenement.clientX, evenement.clientY),
      dragging: false
    };
  },

  _surPointerMove(evenement) {
    if (!this.actif || !this.glisse) return;
    const point = Viewport.versCoordonneesViewBox(evenement.clientX, evenement.clientY);

    if (!this.glisse.dragging) {
      const { echelle } = Viewport.zoneAffichage();
      const distanceEcran = Math.hypot(point.x - this.glisse.depart.x, point.y - this.glisse.depart.y) * echelle;
      if (distanceEcran < Viewport.SEUIL_DRAG) return;
      this.glisse.dragging = true;
      this._creerOverlay();
      this._dessinerPoint(this.glisse.depart);
      this.glisse.ligne = this._dessinerSegment(this.glisse.depart, point);
    }

    this.glisse.ligne.setAttribute("x2", point.x);
    this.glisse.ligne.setAttribute("y2", point.y);
    Statut.definir(I18n.t("mesure.distance", { texte: this._texteDistance(this.glisse.depart, point) }));
  },

  _surPointerUp(evenement) {
    if (!this.actif || !this.glisse) return;
    this.svg.releasePointerCapture(evenement.pointerId);
    const point = Viewport.versCoordonneesViewBox(evenement.clientX, evenement.clientY);
    const glisse = this.glisse;
    this.glisse = null;

    if (glisse.dragging) {
      this._afficherResultat(glisse.depart, point);
      return;
    }

    this._surClicSimple(point);
  },

  _surClicSimple(point) {
    this.points.push(point);

    if (this.points.length === 1) {
      this._creerOverlay();
      this._dessinerPoint(point);
      Statut.definir(I18n.t("mesure.clique_second_point"));
      return;
    }

    this._afficherResultat(this.points[0], this.points[1]);
  },

  _afficherResultat(a, b) {
    this.points = [];
    this._effacerOverlay();
    if (!Echelle.pxParCm) {
      Statut.definir(I18n.t("mesure.echelle_non_definie"));
      return;
    }
    Statut.definir(I18n.t("mesure.resultat", { texte: this._texteDistance(a, b) }));
  },

  // Formate la distance entre deux points (coordonnées viewBox) en cm/m selon
  // l'échelle actuelle — utilisé pour l'affichage en direct pendant le
  // cliquer-glisser et pour le résultat final.
  _texteDistance(a, b) {
    const distancePx = Math.hypot(b.x - a.x, b.y - a.y);
    if (!Echelle.pxParCm) return I18n.t("mesure.echelle_non_definie_texte");
    const cm = distancePx / Echelle.pxParCm;
    return cm >= 100 ? `${(cm / 100).toFixed(2)} m` : `${Math.round(cm)} cm`;
  }
};
