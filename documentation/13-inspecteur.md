# Inspecteur

Panneau flottant en **haut à droite** de la zone de travail, visible
uniquement quand un meuble est sélectionné (voir
[07-interactions-techniques.md](07-interactions-techniques.md) pour la
règle de sélection).

## Champs éditables

- **Nom** (`libelle`) : champ texte.
- **Forme** : Rectangle / Cercle / Capsule — voir
  [04-modele-de-donnees.md](04-modele-de-donnees.md) pour le détail du
  rendu. Toujours affiché (meubles **et** masques d'habillage), à
  l'inverse de Type/Hauteur réelle.
- **Largeur** (cm) : convertie en pixels via `Echelle.pxParCm` à la saisie.
- **Profondeur** (cm) : idem, correspond à `hauteur` dans le modèle de
  données (voir [04-modele-de-donnees.md](04-modele-de-donnees.md)).
- **Hauteur réelle** (cm) : correspond à `Meuble.hauteurCm` — sans effet
  sur le rendu ni la taille au sol, juste une donnée stockée en
  anticipation d'une évolution future. Vide = `null` (non définie).
  N'apparaît que pour les objets typés (meubles), pas pour les masques
  d'habillage — comme le champ Type, la ligne est masquée si l'objet n'a
  pas ce champ.

Modifier largeur/profondeur ne change pas la position ni la rotation du
meuble — seule sa taille est recalculée autour de son centre.

## Champs en lecture seule

- **Type** : nom du type (`planner.conf.js`, voir
  [14-types-objets.md](14-types-objets.md)), qui détermine la couleur de
  l'objet. Non modifiable ici — le type est lié au modèle du catalogue
  (`modeleId`) dont l'objet a été posé ; le changer se fait depuis la vue
  d'édition du catalogue (voir [17-catalogue.md](17-catalogue.md)), pour
  éviter qu'une instance posée diverge silencieusement de son prefab.
  N'apparaît que pour les objets typés (meubles), pas pour les masques
  d'habillage.
- **Position** : `x`/`y` du centre du meuble, affichés en cm (conversion
  via l'échelle courante). Se met à jour en direct pendant un déplacement.
- **Rotation** : en degrés. Se modifie via la poignée dédiée sur le plan
  (pas directement dans l'inspecteur), voir
  [07-interactions-techniques.md](07-interactions-techniques.md).

## Ordre d'affichage (repli)

Section repliable "Ordre d'affichage" (`<details>`), avec un menu
déroulant : **Arrière-plan** / **Normal** / **Premier plan**
(`zOrdre` — voir [04-modele-de-donnees.md](04-modele-de-donnees.md)).
Permet par exemple de faire passer une chaise sous une table. Toujours
affiché (meubles et masques), comme Forme.

## Suppression

Bouton "Supprimer" en bas du panneau — supprime immédiatement l'objet
sélectionné (meuble **ou** masque d'habillage, la méthode `supprimer()`
est générique, voir [js/objets.js](../js/objets.js)), sans confirmation.
Pour les masques uniquement, il existe aussi un raccourci double-clic
direct sur le plan (voir [15-modes.md](15-modes.md)).

## Duplication

Bouton rond ⧉ flottant, **bas gauche, à côté du "+"** — visible
uniquement quand un objet est sélectionné (piloté par
`Inspecteur.afficher()`/`masquer()`, comme le panneau lui-même). Crée une
copie de l'objet sélectionné (mêmes propriétés) avec :

- un léger décalage de position (20cm en x et y) pour rester visible
  séparément de l'original,
- un nom suffixé `" (N)"`, `N` reprenant le plus grand suffixe déjà
  utilisé pour ce nom de base +1 (donc `"Chaise"` → `"Chaise (2)"` →
  `"Chaise (3)"`, y compris si on duplique une copie) — voir
  `_nomDuplique()` dans [js/objets.js](../js/objets.js).

La copie devient immédiatement la sélection active.

## Notes

- Un seul objet inspecté à la fois (pas de multi-sélection).
- Les champs éditables ne sont pas rafraîchis en direct pendant un
  déplacement (seuls Position/Rotation le sont) — pas besoin, ils ne
  changent pas pendant un déplacement.
