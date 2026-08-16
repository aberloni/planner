// Règles graduées (cm/m) sur les axes X/Y, synchronisées avec le viewport.
const Regles = {

  EPAISSEUR: 24, // doit correspondre à la taille CSS des règles

  canvasH: null,
  canvasV: null,
  ctxH: null,
  ctxV: null,

  init(canvasHorizontale, canvasVerticale) {
    this.canvasH = canvasHorizontale;
    this.canvasV = canvasVerticale;
    this.ctxH = canvasHorizontale.getContext("2d");
    this.ctxV = canvasVerticale.getContext("2d");
    window.addEventListener("resize", () => this.redessiner());
  },

  redessiner() {
    this._redimensionnerCanvas(this.canvasH);
    this._redimensionnerCanvas(this.canvasV);

    if (!Viewport.largeurPlan || !Echelle.pxParCm) {
      this.ctxH.clearRect(0, 0, this.canvasH.width, this.canvasH.height);
      this.ctxV.clearRect(0, 0, this.canvasV.width, this.canvasV.height);
      return;
    }

    const { pas, unite } = this._pasGradue();
    this._dessinerHorizontale(pas, unite);
    this._dessinerVerticale(pas, unite);
  },

  _redimensionnerCanvas(canvas) {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  },

  // Choisit un pas de graduation (en cm) lisible à l'écran (~60px entre graduations).
  _pasGradue() {
    const pxParCm = Echelle.pxParCm;
    const pxEcranParCm = pxParCm * Viewport.zoneAffichage().echelle;

    const paliers = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000];
    const pas = paliers.find((p) => p * pxEcranParCm >= 60) || paliers[paliers.length - 1];
    const unite = pas >= 100 ? "m" : "cm";
    return { pas, unite };
  },

  _formater(cm, unite) {
    return unite === "m" ? `${cm / 100}m` : `${cm}cm`;
  },

  _dessinerHorizontale(pas, unite) {
    const ctx = this.ctxH;
    const canvas = this.canvasH;
    const vb = Viewport.viewBox;
    const pxParCm = Echelle.pxParCm;
    const { echelle, decalageX } = Viewport.zoneAffichage();

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#adb5bd";
    ctx.fillStyle = "#495057";
    ctx.font = "10px system-ui";
    ctx.textBaseline = "top";

    const cmDebut = Math.floor(((vb.x - Origine.decalageX) / pxParCm) / pas) * pas;
    const cmFin = ((vb.x + vb.largeur) - Origine.decalageX) / pxParCm;

    for (let cm = cmDebut; cm <= cmFin; cm += pas) {
      const xPlanPx = Origine.decalageX + cm * pxParCm;
      const xEcran = decalageX + (xPlanPx - vb.x) * echelle;
      ctx.beginPath();
      ctx.moveTo(xEcran, canvas.height);
      ctx.lineTo(xEcran, canvas.height - 8);
      ctx.stroke();
      ctx.fillText(this._formater(cm, unite), xEcran + 2, 2);
    }
  },

  _dessinerVerticale(pas, unite) {
    const ctx = this.ctxV;
    const canvas = this.canvasV;
    const vb = Viewport.viewBox;
    const pxParCm = Echelle.pxParCm;
    const { echelle, decalageY } = Viewport.zoneAffichage();

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#adb5bd";
    ctx.fillStyle = "#495057";
    ctx.font = "10px system-ui";

    const cmDebut = Math.floor(((vb.y - Origine.decalageY) / pxParCm) / pas) * pas;
    const cmFin = ((vb.y + vb.hauteur) - Origine.decalageY) / pxParCm;

    for (let cm = cmDebut; cm <= cmFin; cm += pas) {
      const yPlanPx = Origine.decalageY + cm * pxParCm;
      const yEcran = decalageY + (yPlanPx - vb.y) * echelle;
      ctx.beginPath();
      ctx.moveTo(canvas.width, yEcran);
      ctx.lineTo(canvas.width - 8, yEcran);
      ctx.stroke();

      ctx.save();
      ctx.translate(2, yEcran + 2);
      ctx.rotate(Math.PI / 2);
      ctx.textBaseline = "bottom";
      ctx.fillText(this._formater(cm, unite), 0, 0);
      ctx.restore();
    }
  }
};
