// Zone de statut dans la barre d'outils : indique à l'utilisateur l'action en cours.
const Statut = {

  element: null,
  minuteur: null,

  init(element) {
    this.element = element;
  },

  definir(texte) {
    clearTimeout(this.minuteur);
    this.element.textContent = texte;
    this.element.classList.add("visible");
    this.minuteur = setTimeout(() => {
      this.element.classList.remove("visible");
    }, 2000);
  },

  effacer() {
    clearTimeout(this.minuteur);
    this.element.textContent = "";
    this.element.classList.remove("visible");
  }
};
