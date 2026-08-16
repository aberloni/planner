// Gizmo d'échelle visuelle façon carte : barre noir/blanc alternée en bas du
// viewport, toujours affichée à l'écran (ne bouge pas avec le pan/zoom),
// dont la largeur reflète le zoom courant. Chaque segment = 1m réel.
const EchelleVisuelle = {

  SEGMENTS: 5, // nombre de segments de 1m alternés noir/blanc

  conteneur: null,
  barre: null,
  labelFin: null,

  init(conteneurEl, barreEl) {
    this.conteneur = conteneurEl;
    this.barre = barreEl;
    this.labelFin = conteneurEl.querySelector("#echelle-visuelle-labels span:last-child");

    for (let i = 0; i < this.SEGMENTS; i++) {
      this.barre.appendChild(document.createElement("span"));
    }

    Viewport.alChangement(() => this.redessiner());
    Echelle.alDefinie(() => this.redessiner());
    window.addEventListener("resize", () => this.redessiner());
  },

  redessiner() {
    if (!Viewport.largeurPlan || !Echelle.pxParCm) {
      this.conteneur.style.display = "none";
      return;
    }

    const { echelle } = Viewport.zoneAffichage();
    const pxParMetre = Echelle.pxParCm * 100 * echelle;

    this.conteneur.style.display = "flex";
    Array.from(this.barre.children).forEach((span) => {
      span.style.width = `${pxParMetre}px`;
    });
    this.labelFin.textContent = `${this.SEGMENTS} m`;
  }
};
