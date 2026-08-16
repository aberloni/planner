# Modes édition / nettoyage

Un bouton rond (bas droite, comme le "+" en bas gauche) bascule entre deux
modes **exclusifs**. Il remplace l'ancien panneau de calques à cases à
cocher (voir historique dans [12-calques.md](12-calques.md)) — les 3
calques (fond / habillage / meubles) existent toujours en interne, mais
leur pilotage se fait maintenant via ce mode plutôt qu'un affichage
manuel calque par calque.

## Mode édition (par défaut)

- Le calque "meubles" est visible et sélectionnable.
- Le calque "habillage" reste **visible** (les masques posés restent
  appliqués visuellement) mais devient **non sélectionnable**.
- Le bouton "+" ajoute un meuble typé (voir
  [14-types-objets.md](14-types-objets.md)).

## Mode nettoyage ("clean")

- Le calque "meubles" est **masqué** (`display:none` — on ne voit plus les
  meubles du tout, pour se concentrer sur le plan).
- Le calque "habillage" est visible et sélectionnable.
- Le bouton "+" ajoute un masque blanc (`Habillage.ajouter()`), rectangle
  plein sans type ni couleur configurable, destiné à cacher des détails
  gênants du plan d'origine (qui n'est pas nécessairement vierge).
- **Double-clic sur un masque = suppression immédiate** (pas de
  confirmation). Spécifique à `Habillage` (option `supprimerAuDoubleClic`
  de la fabrique, voir [js/objets.js](../js/objets.js)) — les meubles, eux,
  se suppriment via le bouton "Supprimer" de l'inspecteur (voir
  [13-inspecteur.md](13-inspecteur.md)), pas par double-clic.

## Bascule

- Un clic sur le bouton rond appelle `Mode.basculer()`.
- Changer de mode désélectionne automatiquement l'objet en cours d'édition
  s'il appartient à l'autre calque (`Meubles.deselectionner()` /
  `Habillage.deselectionner()`), ce qui masque l'inspecteur.
- L'icône du bouton reflète le mode courant (🛋️ édition, 🧹 nettoyage).

## Implémentation

- `Meubles` et `Habillage` (voir [js/objets.js](../js/objets.js)) sont deux
  instances de la même fabrique `creerModuleObjets(options)` — même
  logique de sélection/déplacement/redimensionnement/rotation, seule
  différence : `Meubles` a un `type` (couleur dérivée de
  `planner.conf.js`), `Habillage` a une couleur blanche fixe et pas de type.
- Chaque module expose un flag `actif` (mis à jour par `Mode`) : le
  hit-testing de sélection (`Viewport.alClicSimple`) ignore les clics tant
  que `actif` est faux — voir
  [07-interactions-techniques.md](07-interactions-techniques.md) pour le
  détail de l'arbitrage clic/pan, qui s'applique identiquement aux objets
  "verrouillés" par le mode courant (ils se comportent comme le fond : un
  clic-glisser dessus pan la vue).
