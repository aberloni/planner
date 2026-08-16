# Système de calques

3 calques fixes, empilés dans cet ordre (du bas vers le haut) :

1. **Fond** — le plan importé (image JPG/PNG), non éditable.
2. **Habillage** — masques blancs posés pour cacher des éléments gênants
   du plan d'origine. Voir [15-modes.md](15-modes.md) et
   [js/habillage.js](../js/habillage.js).
3. **Meubles** — les meubles posés (voir
   [14-types-objets.md](14-types-objets.md)) et [js/meubles.js](../js/meubles.js)).

Pas de création/suppression de calque par l'utilisateur — ce sont ces 3
calques fixes, toujours présents. Des calques personnalisés (ex.
"annotations") restent une piste v3, voir [09-roadmap.md](09-roadmap.md).

## Pilotage : modes, pas un panneau à cases à cocher

⚠️ Ancienne conception (abandonnée) : un panneau listant les 3 calques
avec une case à cocher chacun. **Remplacé** par un bouton unique à deux
états ("mode édition" / "mode nettoyage") — voir [15-modes.md](15-modes.md)
pour le comportement actuel. Le calque "fond" reste toujours visible (pas
de bascule le concernant).

## Notes techniques

- Chaque calque est un groupe `<g>` dédié dans le SVG racine (créés dans
  `Viewport._creerCalques()`), dans l'ordre fond → habillage → meubles
  (l'ordre des éléments dans le SVG détermine l'empilement visuel).
- Les éléments transitoires (poignée de calibration, poignées de
  sélection/rotation/redimension) restent hors de ces 3 calques.
