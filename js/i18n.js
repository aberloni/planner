// Moteur de traduction : lit TRADUCTIONS (js/traductions.js, généré depuis
// traductions/i18n.csv), applique la langue choisie aux éléments marqués
// data-i18n / data-i18n-title / data-i18n-placeholder, et fournit I18n.t()
// pour les chaînes construites dynamiquement en JS.
const I18n = {

  CLE_STOCKAGE: "planner-langue",
  langue: "fr",

  init() {
    const sauvegardee = localStorage.getItem(this.CLE_STOCKAGE);
    this.langue = sauvegardee === "en" ? "en" : "fr";
    this.appliquer();
  },

  basculer() {
    this.langue = this.langue === "fr" ? "en" : "fr";
    localStorage.setItem(this.CLE_STOCKAGE, this.langue);
    this.appliquer();
  },

  // Traduit `flag` dans la langue courante, en remplaçant les {variable}
  // par les valeurs fournies dans `vars`. Repli sur le français, puis sur
  // le flag lui-même si absent de TRADUCTIONS (erreur de frappe à corriger).
  t(flag, vars) {
    const entree = TRADUCTIONS[flag];
    let texte = entree ? (entree[this.langue] || entree.fr) : flag;
    if (vars) {
      for (const cle in vars) texte = texte.split(`{${cle}}`).join(vars[cle]);
    }
    return texte;
  },

  // Applique la langue courante à tous les éléments statiques du DOM
  // (index.html) marqués avec les attributs data-i18n*.
  appliquer() {
    document.documentElement.lang = this.langue;
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      el.textContent = this.t(el.getAttribute("data-i18n"));
    });
    document.querySelectorAll("[data-i18n-title]").forEach((el) => {
      el.title = this.t(el.getAttribute("data-i18n-title"));
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      el.placeholder = this.t(el.getAttribute("data-i18n-placeholder"));
    });
  }
};

// Initialisé immédiatement (script placé avant tous les autres) : les
// modules définis à l'évaluation de leur fichier (ex. Meubles/Habillage,
// libelleDefaut) doivent voir la bonne langue dès leur création, pas
// seulement après l'init de app.js.
I18n.init();
