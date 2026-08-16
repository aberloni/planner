// Meubles : objets typés (voir js/planner.conf.js), posés dans le calque
// "meubles", actifs (sélectionnables) uniquement en mode édition.
const Meubles = creerModuleObjets({
  avecType: true,
  libelleDefaut: I18n.t("objets.libelle_meuble")
});
