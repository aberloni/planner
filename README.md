# Planner de meubles 2D

App web locale pour placer, déplacer et faire pivoter des meubles sur un plan de maison 2D — sans installation, sans backend, directement dans le navigateur.

## Auteur

Réalisé par Andres Berlonus.

## Contexte

Projet personnel créé pour un besoin concret : tester des agencements de meubles sur un plan de maison avant un déménagement/aménagement réel, sans avoir à ouvrir un logiciel de CAO lourd. 

**Claude-d** (entièrement réalisé avec Claude Code) — l'essentiel de la réflexion (contraintes, périmètre, modèle de données) est documenté au fil de l'eau dans [`documentation/`](documentation/) avant chaque étape de code.

## But

- Importer une image de plan (JPG/PNG) comme fond, figé (pas d'édition des murs).
- Calibrer une échelle réelle (cm) sur ce plan pour disposer des meubles à la bonne taille.
- Poser, déplacer, pivoter, redimensionner des meubles rectangulaires (ou autres formes) par-dessus.
- Sauvegarder/charger un projet en local (fichier `.json` ou `localStorage`), sans compte ni cloud.
- Tourner tel quel en ouvrant `index.html` dans un navigateur — aucun serveur, Docker ou build à lancer.

## Outils à disposition

- **Import de plan** — image de fond JPG/PNG, échelle calibrée par un segment tracé + longueur réelle.
- **Règles graduées** — repères X/Y en cm sur la zone de travail.
- **Meubles** — ajout, déplacement, rotation (par 45°), redimensionnement, duplication, suppression.
- **Types d'objets** — catalogue de types avec couleur/forme dédiée (`planner.conf.js`).
- **Catalogue d'objets réutilisables** — objets nommés partagés, ajoutables sans les recréer.
- **Calques** — fond / habillage / meubles, avec modes édition et nettoyage séparés.
- **Inspecteur** — propriétés de l'objet sélectionné (nom, type, dimensions...).
- **Utilisateurs / propositions** — plusieurs propositions d'aménagement sur un même plan partagé.
- **Sessions** — écran de choix au démarrage, sauvegarde locale (`localStorage`) ou fichiers si servi via PHP.
- **Export PNG** — cadre de sélection redimensionnable, export de la zone choisie en image.

Documentation complète et historique de conception : [`documentation/README.md`](documentation/README.md).

## Icônes

Icônes fournies par [Iconify](https://iconify.design/).

## Lancer l'app

Double-cliquer sur `index.html` (ou le glisser dans un onglet de navigateur). Voir [`documentation/08-lancement-local.md`](documentation/08-lancement-local.md) pour le mode "servi" (hébergement web + PHP, optionnel).

## Statut

Projet personnel, sans garantie, développé pour un usage perso. Contributions/suggestions bienvenues via issues.

## Licence

[MIT](LICENSE).
