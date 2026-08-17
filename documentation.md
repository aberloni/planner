# Documentation — Concepts

Un fichier, une ligne par concept (≤300 caractères). Contraintes permanentes : app 100% front-end, sans backend, sans build, lançable en `file://`.

## Vision du projet
App web locale (sans backend) pour placer/déplacer/pivoter des meubles rectangulaires sur un plan importé (JPG/PNG), avec contraintes fortes : pas de Docker, pas de serveur, pas de Python.

## Architecture technique
SPA 100% front-end (HTML/CSS/JS vanilla sans build), rendu SVG, lancée en `file://` ; scripts PHP optionnels seulement en mode hébergé.

## Stockage et persistance
Deux mécanismes complémentaires : auto-sauvegarde `localStorage` (filet de sécurité) et export/import de fichier `.json` pour la sauvegarde durable. Les blueprints ne sont jamais embarqués en base64 : chemin relatif vers `imports/<nom-original>` (dossier plat, noms uniques attendus ; copié à la main en local, téléversé automatiquement en mode servi) — l'export d'un projet n'est donc plus autoportant pour les images.

## Modèle de données
Structures JSON sérialisées : `Projet`, `Plan`, `Meuble`, `Habillage`, `ModeleObjet`, `CatalogueGlobal`, `Proposition` et leurs relations.

## Interface utilisateur
Layout (barre d'outils, zone de travail SVG, panneaux flottants) et interactions clés (sélection, déplacement, rotation, zoom, pan).

## Détail technique des interactions
Implémentation SVG des interactions : rendu, sélection, rotation, redimensionnement, arbitrage clic/pan, import d'image. Pas d'undo/redo.

## Lancement en local
Deux modes : ouverture directe `file://` sans installation, ou dépôt sur hébergement web avec PHP optionnel pour la gestion des plans.

## Roadmap
Évolutions futures classées v2/v3 (dimensions réelles, collisions, snapping, multi-sélection, multi-plans, 3D...) sans engagement de calendrier.

## Échelle et règles graduées
Calibration de l'échelle du plan (segment + longueur réelle), règles graduées X/Y, outil de mesure, origine réglable, grille d'accroche.

## Système de calques
3 calques fixes empilés (fond/habillage/meubles), non créables par l'utilisateur, pilotés par un mode plutôt qu'un panneau à cases à cocher.

## Inspecteur
Panneau flottant en haut à droite affichant/éditant les propriétés de l'objet sélectionné (nom, forme, dimensions, type, position, ordre, suppression, duplication).

## Types d'objets
`planner.conf.js` : config statique des types de meubles (id, libellé, couleur, icône SVG obligatoire) déterminant l'apparence des objets posés.

## Modes édition / nettoyage
Bouton bascule exclusif entre mode édition (meubles) et mode nettoyage (masques d'habillage blancs cachant des détails du plan).

## Propositions
Agencements de meubles définis au niveau du projet, partagés par ses plans (même proposition retrouvée sur chaque plan), avec des meubles propres à chaque couple proposition/plan.

## Catalogue d'objets
Catalogue d'objets nommés, partagé par tous les plans d'un projet, vide au départ et grandissant au fil de la création d'objets, réutilisable sans recréation.

## Export PNG
Export du plan en image via un cadre redimensionnable en pointillé délimitant la zone exportée, rendu à ×3 la résolution pour un PNG net.

## Plans
Écran de choix de plan à l'intérieur d'un projet (un étage), stockage détecté automatiquement (localStorage en local, fichiers JSON + PHP en mode servi), scopé au projet. Import de plans déjà exportés ailleurs dans le projet en cours.

## Projets
Écran de choix au tout premier démarrage, niveau le plus haut (un lieu) regroupant plusieurs plans partageant un même catalogue, stockage local ou fichiers selon le mode.

## Structure de données

**Projet** — `id`, `nom` : un lieu, regroupe plusieurs plans et un catalogue partagé.

**Plan** — `id`, `nom`, `cheminImage` (blueprint), `echellePxParCm`, `origineX/Y` : un étage, avec son image de fond et son échelle.

**Meuble** — `id`, `libelle`, `type`, `forme`, `x`, `y`, `largeur`, `hauteur`, `rotation` : un objet posé sur un plan, positionné et dimensionné en pixels.
