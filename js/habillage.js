// Habillage : masques blancs (sans type), posés dans le calque "habillage",
// utilisés pour cacher des éléments gênants du plan d'origine. Actifs
// (sélectionnables) uniquement en mode nettoyage — voir documentation/15-modes.md.
const Habillage = creerModuleObjets({
  avecType: false,
  libelleDefaut: "Masque",
  couleurFixe: "#ffffff",
  supprimerAuDoubleClic: true
});
