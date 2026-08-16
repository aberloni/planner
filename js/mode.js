// Bascule entre deux modes exclusifs (bouton rond en bas à droite) :
// - "edition" : place des objets typés (meubles). Le calque meubles est
//   visible et sélectionnable ; le calque habillage reste visible (les
//   masques restent appliqués) mais n'est plus sélectionnable.
// - "clean" : place des masques blancs pour cacher des éléments du plan
//   d'origine. Le calque meubles est masqué (display:none) ; seul le
//   calque habillage est sélectionnable.
const Mode = {

  EDITION: "edition",
  CLEAN: "clean",

  actuel: "edition",
  bouton: null,
  ecouteurs: [],

  init(boutonEl) {
    this.bouton = boutonEl;
    this.bouton.addEventListener("click", () => this.basculer());
    this._actualiserBouton();
  },

  alChangement(callback) {
    this.ecouteurs.push(callback);
  },

  basculer() {
    this.definir(this.actuel === this.EDITION ? this.CLEAN : this.EDITION);
  },

  definir(mode) {
    if (this.actuel === mode) return;
    this.actuel = mode;
    this._actualiserBouton();
    this.ecouteurs.forEach((callback) => callback(mode));
  },

  _actualiserBouton() {
    if (this.actuel === this.CLEAN) {
      this.bouton.innerHTML = '<img class="barre-icone" src="icones/ui/mode-nettoyage.svg" alt="">';
      this.bouton.title = I18n.t("mode.nettoyage_title");
    } else {
      this.bouton.innerHTML = '<img class="barre-icone" src="icones/ui/mode-edition.svg" alt="">';
      this.bouton.title = I18n.t("mode.edition_title");
    }
  }
};
