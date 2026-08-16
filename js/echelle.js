// Calibration de l'échelle du plan : l'utilisateur trace un segment et indique sa longueur réelle.
const Echelle = {

  NS: "http://www.w3.org/2000/svg",

  PX_PAR_CM_DEFAUT: 1, // échelle par défaut à l'import : 100px = 1m

  svg: null,
  pxParCm: null,
  overlay: null,
  points: [],
  actif: false,
  ecouteurs: [], // callbacks appelés quand pxParCm vient d'être (re)défini

  init(svgEl) {
    this.svg = svgEl;
    Viewport.alClicSimple((point) => this._surClic(point));
  },

  alDefinie(callback) {
    this.ecouteurs.push(callback);
  },

  demarrer() {
    if (!Viewport.largeurPlan) return;

    this.points = [];
    this.actif = true;
    this.overlay = document.createElementNS(this.NS, "g");
    this.overlay.setAttribute("id", "calibration-overlay");
    this.svg.appendChild(this.overlay);
    this.svg.classList.add("calibration-active");

    Statut.definir(I18n.t("echelle.clic_premier_point"));
  },

  _surClic(point) {
    if (!this.actif) return;
    this.points.push(point);
    this._dessinerPoint(point);

    if (this.points.length === 1) {
      Statut.definir(I18n.t("echelle.clic_second_point"));
    }

    if (this.points.length === 2) {
      this._dessinerSegment();
      this._finDeSaisie();
    }
  },

  _dessinerPoint(point) {
    const cercle = document.createElementNS(this.NS, "circle");
    cercle.setAttribute("cx", point.x);
    cercle.setAttribute("cy", point.y);
    cercle.setAttribute("r", 5);
    cercle.setAttribute("class", "point-calibration");
    this.overlay.appendChild(cercle);
  },

  _dessinerSegment() {
    const [a, b] = this.points;
    const ligne = document.createElementNS(this.NS, "line");
    ligne.setAttribute("x1", a.x);
    ligne.setAttribute("y1", a.y);
    ligne.setAttribute("x2", b.x);
    ligne.setAttribute("y2", b.y);
    ligne.setAttribute("class", "segment-calibration");
    this.overlay.appendChild(ligne);
  },

  _finDeSaisie() {
    this.actif = false;
    this.svg.classList.remove("calibration-active");

    const [a, b] = this.points;
    const distancePx = Math.hypot(b.x - a.x, b.y - a.y);

    Statut.definir(I18n.t("echelle.indiquez_longueur"));

    // setTimeout : laisse le segment s'afficher avant le prompt() bloquant.
    window.setTimeout(() => {
      const saisie = prompt(I18n.t("echelle.longueur_prompt"), "100");
      this.overlay.remove();
      this.overlay = null;

      const longueurCm = parseFloat(saisie);
      if (!saisie || isNaN(longueurCm) || longueurCm <= 0) {
        Statut.definir(I18n.t("echelle.calibration_annulee"));
        return;
      }

      this.pxParCm = distancePx / longueurCm;
      if (typeof Regles !== "undefined") Regles.redessiner();
      if (typeof Grille !== "undefined") Grille.redessiner();
      Statut.definir(I18n.t("echelle.definie", { valeur: this.pxParCm.toFixed(2) }));
      this.ecouteurs.forEach((callback) => callback());
    }, 0);
  }
};
