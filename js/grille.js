// Grille graduée sur le plan : alignée sur le pas des règles (voir regles.js).
// Cycle au clic sur le bouton : désactivée -> 2 cellules par unité de mesure
// -> 4 cellules -> désactivée.
const Grille = {

  SUBDIVISIONS: [0, 2, 4], // 0 = désactivée

  canvas: null,
  ctx: null,
  niveau: 0,

  init(canvasEl) {
    this.canvas = canvasEl;
    this.ctx = canvasEl.getContext("2d");
    this.redimensionner();
    window.addEventListener("resize", () => this.redimensionner());
  },

  // Re-mesure le canvas puis redessine — à appeler explicitement quand la
  // zone de travail passe de caché à visible (ex. fermeture de l'écran de
  // choix de plan) : clientWidth/Height valaient 0 tant qu'elle était en
  // `display:none`, donc le redimensionnement fait à l'init() était inutile
  // et restait faux jusqu'au prochain resize fenêtre.
  redimensionner() {
    this._redimensionner();
    this.redessiner();
  },

  _redimensionner() {
    this.canvas.width = this.canvas.clientWidth;
    this.canvas.height = this.canvas.clientHeight;
  },

  // Fait avancer le cycle désactivée -> 2 cellules -> 4 cellules -> désactivée.
  // Retourne { actif, subdivisions } pour mettre à jour le bouton.
  basculer() {
    this.niveau = (this.niveau + 1) % this.SUBDIVISIONS.length;
    this.redessiner();
    return { actif: this.niveau > 0, subdivisions: this.SUBDIVISIONS[this.niveau] };
  },

  // Redessine sans re-mesurer/redimensionner le canvas : voir le même
  // commentaire dans regles.js — appelé à chaque pan/zoom, un resize à
  // chaque fois forçait un reflow synchrone et faisait ramer le pan.
  redessiner() {
    const subdivisions = this.SUBDIVISIONS[this.niveau];
    if (!subdivisions || !Viewport.largeurPlan || !Echelle.pxParCm) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      return;
    }

    const { pas } = Regles._pasGradue();
    this._dessiner(pas, subdivisions);
  },

  // Croisement de grille le plus proche d'un point (coordonnées plan, px) —
  // utilisé pour aimanter un meuble pendant son déplacement (voir objets.js).
  // Retourne null si la grille est désactivée ou l'échelle non définie.
  pointAccroche(xPx, yPx) {
    const subdivisions = this.SUBDIVISIONS[this.niveau];
    if (!subdivisions || !Echelle.pxParCm) return null;
    const { pas } = Regles._pasGradue();
    const pasCellulePx = (pas / subdivisions) * Echelle.pxParCm;
    return {
      x: Origine.decalageX + Math.round((xPx - Origine.decalageX) / pasCellulePx) * pasCellulePx,
      y: Origine.decalageY + Math.round((yPx - Origine.decalageY) / pasCellulePx) * pasCellulePx
    };
  },

  // Couleur d'une ligne d'indice i (pas de cellule = pas/subdivisions) :
  // plus foncée sur une graduation de règle (multiple de `subdivisions`),
  // teinte intermédiaire à la moitié de l'unité, sinon la plus claire.
  _couleur(i, subdivisions) {
    if (i % subdivisions === 0) return "rgba(33, 37, 41, 0.22)";
    if (subdivisions >= 4 && i % 2 === 0) return "rgba(33, 37, 41, 0.15)";
    return "rgba(33, 37, 41, 0.08)";
  },

  _dessiner(pas, subdivisions) {
    const ctx = this.ctx;
    const canvas = this.canvas;
    const vb = Viewport.viewBox;
    const pxParCm = Echelle.pxParCm;
    const { echelle, decalageX, decalageY } = Viewport.zoneAffichage();
    const pasCellule = pas / subdivisions;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const iDebutX = Math.floor(((vb.x - Origine.decalageX) / pxParCm) / pasCellule);
    const iFinX = Math.ceil((((vb.x + vb.largeur) - Origine.decalageX) / pxParCm) / pasCellule);
    for (let i = iDebutX; i <= iFinX; i++) {
      const xPlanPx = Origine.decalageX + i * pasCellule * pxParCm;
      const xEcran = decalageX + (xPlanPx - vb.x) * echelle;
      ctx.strokeStyle = this._couleur(i, subdivisions);
      ctx.beginPath();
      ctx.moveTo(xEcran, 0);
      ctx.lineTo(xEcran, canvas.height);
      ctx.stroke();
    }

    const iDebutY = Math.floor(((vb.y - Origine.decalageY) / pxParCm) / pasCellule);
    const iFinY = Math.ceil((((vb.y + vb.hauteur) - Origine.decalageY) / pxParCm) / pasCellule);
    for (let i = iDebutY; i <= iFinY; i++) {
      const yPlanPx = Origine.decalageY + i * pasCellule * pxParCm;
      const yEcran = decalageY + (yPlanPx - vb.y) * echelle;
      ctx.strokeStyle = this._couleur(i, subdivisions);
      ctx.beginPath();
      ctx.moveTo(0, yEcran);
      ctx.lineTo(canvas.width, yEcran);
      ctx.stroke();
    }
  }
};
