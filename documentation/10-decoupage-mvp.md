# Découpage du MVP en étapes de travail

> Document de planification **historique** (rédigé avant implémentation).
> Plusieurs détails ont changé en cours de route (import du plan sans
> glisser-déposer, palette remplacée par le catalogue, rotation sans
> `Shift`, etc.) — voir [README.md](README.md) pour l'état actuel. Gardé
> pour la trace de l'ordre de développement suivi.

Le MVP (voir [02-perimetre-mvp.md](02-perimetre-mvp.md)) est découpé en 4
étapes, pensées pour être développées et testées dans l'ordre. Principe
directeur : construire d'abord le **socle du viewport** (zone de travail +
navigation) avant d'ajouter les meubles, puisque tout le reste s'affiche et
s'interagit à l'intérieur de ce viewport.

## Étape 1 — Socle du viewport & import du plan

Construire la zone de travail avant tout le reste : c'est la brique sur
laquelle tout s'appuie ensuite (import, meubles, sélection...).

- Mise en place du `<svg>` racine (viewport), structure de fichiers de
  base (voir [01-architecture-technique.md](01-architecture-technique.md)).
- **Import du plan** : sélection d'un fichier JPG/PNG (bouton + glisser-
  déposer), affiché comme image de fond, `viewBox` dimensionné sur la
  taille naturelle de l'image.
- **Zoom** : molette de la souris, centré sur le curseur ; boutons +/-/100%.
- **Pan** : clic sur le fond du plan, maintenir, glisser.
- **Échelle et règles** : calibration à l'import (+ bouton pour recalibrer)
  et règles graduées X/Y — voir [11-echelle-et-regles.md](11-echelle-et-regles.md).
- Message d'accueil quand aucun plan n'est encore importé.

**Critère de fin d'étape** : on importe une image, on peut zoomer/dézoomer
et se déplacer librement dans le plan, calibrer son échelle et voir les
règles graduées, sans aucun meuble.

## Étape 1bis — Système de calques

Avant d'ajouter les meubles, mise en place des 3 calques fixes (fond,
habillage, meubles) et de leur panneau d'affichage/masquage — voir
[12-calques.md](12-calques.md). Le calque "meubles" reste vide jusqu'à
l'étape 2, le calque "habillage" reste sans outil d'édition pour l'instant.

**Critère de fin d'étape** : les 3 calques existent. *(Le panneau à cases
à cocher envisagé ici a été abandonné avant implémentation, remplacé par
le bouton de mode édition/nettoyage — voir
[12-calques.md](12-calques.md).)*

## Étape 2 — Ajout et manipulation des meubles

- Les meubles sont ajoutés dans le calque "meubles" (voir
  [12-calques.md](12-calques.md)).
- Palette de meubles (voir [05-palette-de-meubles.md](05-palette-de-meubles.md)),
  clic pour ajouter un meuble au centre de la zone visible.
- Sélection d'un meuble (clic), désélection (clic dans le vide).
- **Déplacement** par glisser-déposer (le clic-glisser sur un meuble doit
  déplacer le meuble, pas déclencher le pan du fond — distinction à faire
  au niveau du hit-testing, voir [07-interactions-techniques.md](07-interactions-techniques.md)).
- **Rotation** via poignée dédiée (+ accroche 15° avec `Shift`).
- Détail technique complet : [07-interactions-techniques.md](07-interactions-techniques.md).

**Critère de fin d'étape** : on ajoute plusieurs meubles, on les déplace et
on les pivote librement sur le plan importé à l'étape 1.

## Étape 3 — Édition des propriétés des meubles

- Panneau propriétés (libellé, couleur, rotation en saisie directe).
- Suppression (`Suppr` + bouton).

**Critère de fin d'étape** : chaque meuble posé peut être renommé,
recoloré, supprimé, en plus de la manipulation directe à la souris de
l'étape 2.

## Étape 4 — Sauvegarde et historique

- **Sauvegarde/chargement** : export/import de fichier `.json` (voir
  [03-stockage-et-persistance.md](03-stockage-et-persistance.md)).
- **Auto-sauvegarde** `localStorage` avec indicateur discret.
- **Undo/redo** (`Ctrl+Z` / `Ctrl+Y`), pile d'historique sur toutes les
  actions des étapes 2 et 3.

**Critère de fin d'étape** : correspond au critère de "fait" global du MVP
défini dans [02-perimetre-mvp.md](02-perimetre-mvp.md) — fermer l'app,
la rouvrir, recharger un projet sauvegardé, retrouver l'agencement exact.

## Pourquoi cet ordre

- Le viewport (étape 1) est une dépendance de tout le reste : impossible de
  tester sérieusement l'ajout de meubles sans pouvoir déjà zoomer/naviguer
  sur le plan.
- Manipulation directe (étape 2) avant édition fine (étape 3) : on valide
  d'abord l'interaction principale (souris) avant d'ajouter la couche
  formulaire/panneau.
- Undo/redo est placé en étape 4 plutôt qu'en étape 2, car l'historique doit
  couvrir *toutes* les actions (y compris celles du panneau propriétés de
  l'étape 3) — le construire trop tôt aurait demandé de le retoucher à
  chaque étape suivante.
