// Gizmo d'échelle visuelle façon carte : barre noir/blanc alternée, ancrée
// bas-centre de la fenêtre (position: fixed — comme les boutons ronds, voir
// style.css) donc immobile au pan/zoom. Seule la taille des rectangles change
// avec le zoom : chaque rectangle représente toujours 1m réel, répartis
// symétriquement de part et d'autre de l'ancre centrale, avec une graduation
// (0, 1, 2...) au-dessus de chaque limite de rectangle.
const EchelleVisuelle = {

  SEGMENTS: 5, // nombre de rectangles d'1m alternés noir/blanc

  conteneur: null,
  barre: null,
  labels: null,

  init(conteneurEl, barreEl) {
    this.conteneur = conteneurEl;
    this.barre = barreEl;
    this.labels = conteneurEl.querySelector("#echelle-visuelle-labels");

    for (let i = 0; i < this.SEGMENTS; i++) {
      this.barre.appendChild(document.createElement("span"));
    }
    for (let i = 0; i <= this.SEGMENTS; i++) {
      const label = document.createElement("span");
      label.textContent = i;
      this.labels.appendChild(label);
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
  }
};
