// Configuration statique de l'application — liste des types d'objets disponibles.
// Fichier JS (pas JSON) pour rester chargeable via <script src> en ouverture
// directe (file://), sans backend ni fetch() — voir documentation/01-architecture-technique.md.
//
// Modifiable à la main : chaque entrée = { id, libelle, couleur }.
// - id : identifiant stable, ne pas changer une fois des objets sauvegardés avec.
//   Lien FORT avec son icône : le fichier `icones/${id}.svg` doit exister
//   (voir icone(id) plus bas) — pas de champ `icone` à renseigner à part, pas
//   de repli emoji. Ajouter un type = ajouter une entrée ICI + le SVG
//   correspondant dans icones/ (ex. via https://api.iconify.design, voir
//   documentation/14-types-objets.md).
// - libelle : affiché dans l'inspecteur.
// - couleur : couleur de remplissage appliquée à tout objet de ce type.
const PlannerConf = {

  typeParDefaut: "generique",

  typesObjets: [
    { id: "generique", libelle: "Générique", couleur: "#adb5bd" },
    { id: "lit", libelle: "Lit", couleur: "#a8dadc" },
    { id: "table", libelle: "Table", couleur: "#e9c46a" },
    { id: "chaise", libelle: "Chaise", couleur: "#f4a261" },
    { id: "canape", libelle: "Canapé", couleur: "#8ecae6" },
    { id: "armoire", libelle: "Armoire", couleur: "#b5838d" },
    { id: "bureau", libelle: "Bureau", couleur: "#e9c46a" },
    { id: "vitrine", libelle: "Vitrine", couleur: "#94d2bd" },
    { id: "buffet", libelle: "Buffet", couleur: "#bc8a5f" },
    { id: "electromenager", libelle: "Électroménager", couleur: "#6c757d" },
    { id: "loisir", libelle: "Loisir", couleur: "#457b9d" },
    { id: "a_acheter", libelle: "À acheter", couleur: "#52b788" },
    { id: "volume", libelle: "Volume fixe", couleur: "#495057" }
  ],

  trouverType(id) {
    return this.typesObjets.find((t) => t.id === id) || this.typesObjets.find((t) => t.id === this.typeParDefaut);
  },

  // Chemin de l'icône SVG d'un type — convention stricte : icones/<id>.svg.
  icone(id) {
    return `icones/${id}.svg`;
  },

  // Remplit un <select> avec une <option> par type (même liste, même ordre
  // partout) — utilisé par l'inspecteur et la vue d'édition du catalogue.
  remplirSelectTypes(select) {
    this.typesObjets.forEach((type) => {
      const option = document.createElement("option");
      option.value = type.id;
      option.textContent = type.libelle;
      select.appendChild(option);
    });
  },

  // Élément DOM <img> représentant l'icône SVG d'un type — pour un rendu
  // HTML cohérent hors du plan (catalogue, vue d'édition...).
  iconeElement(id, classe) {
    const type = this.trouverType(id);
    const img = document.createElement("img");
    img.className = classe;
    img.src = this.icone(type.id);
    img.alt = "";
    return img;
  },

  // Variante HTML (chaîne) de iconeElement, pour les contextes construits par
  // concaténation de chaînes (ex. impression du catalogue).
  iconeHtml(id, classe) {
    const type = this.trouverType(id);
    return `<img class="${classe}" src="${this.icone(type.id)}" alt="">`;
  }
};
