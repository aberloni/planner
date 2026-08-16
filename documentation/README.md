# Documentation — Planner de meubles 2D

App web locale pour placer des meubles sur un plan de maison 2D. Ce dossier
contient toute la réflexion et la conception avant tout code.

## Sommaire

1. [Vision du projet](00-vision.md) — objectif, contraintes, non-objectifs
2. [Architecture technique](01-architecture-technique.md) — pas de backend,
   SVG, structure de fichiers
3. [Périmètre du MVP](02-perimetre-mvp.md) — ce qui est dans/hors du MVP
4. [Stockage et persistance](03-stockage-et-persistance.md) — localStorage
   + export/import JSON
5. [Modèle de données](04-modele-de-donnees.md) — structures `Projet`,
   `Plan`, `Meuble`
6. [Palette de meubles](05-palette-de-meubles.md) — mécanisme abandonné,
   remplacé par le [Catalogue](17-catalogue.md)
7. [Interface utilisateur](06-interface-utilisateur.md) — layout, écrans,
   interactions
8. [Détail technique des interactions](07-interactions-techniques.md) —
   rendu SVG, drag/rotation/redimension, undo/redo
9. [Lancement en local](08-lancement-local.md) — comment démarrer l'app
   sans Docker ni webserver
10. [Roadmap](09-roadmap.md) — pistes v2/v3 après le MVP
11. [Découpage du MVP en étapes](10-decoupage-mvp.md) — ordre de
    développement : socle du viewport → meubles → propriétés → sauvegarde
12. [Échelle et règles graduées](11-echelle-et-regles.md) — calibration du
    plan, règles X/Y
13. [Système de calques](12-calques.md) — fond / habillage / meubles
14. [Inspecteur](13-inspecteur.md) — propriétés de l'objet sélectionné, en
    haut à droite
15. [Types d'objets](14-types-objets.md) — `planner.conf.js`, couleur par
    type
16. [Modes édition / nettoyage](15-modes.md) — bouton bas droite, meubles
    vs masques d'habillage
17. [Utilisateurs](16-utilisateurs.md) — propositions multiples, plan et
    habillage partagés, meubles propres à chacun
18. [Catalogue d'objets](17-catalogue.md) — objets nommés partagés,
    réutilisables sans recréation, grandit au fil de l'eau
19. [Export PNG](19-export-png.md) — cadre redimensionnable en pointillé,
    export de la zone délimitée
20. [Sessions](20-sessions.md) — écran de choix au démarrage, localStorage
    en local ou `sessions/*.json` (via PHP) en mode servi

## Contraintes à retenir en toute circonstance

- Tourne en local, pas de Docker, pas de webserver à administrer, pas de
  Python.
- Le plan est une image (JPG/PNG) figée — pas d'édition des murs.
- MVP = placer / déplacer / pivoter des meubles rectangulaires sur le plan
  importé (+ redimensionner, sauvegarder/charger, undo/redo — voir
  [02-perimetre-mvp.md](02-perimetre-mvp.md) pour le détail exact).
