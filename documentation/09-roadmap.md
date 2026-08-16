# Roadmap après le MVP

Idées classées par proximité avec le MVP, sans engagement de calendrier —
ce document sert à ne pas perdre les pistes évoquées et à cadrer les
évolutions futures du [modèle de données](04-modele-de-donnees.md) et de
l'[architecture](01-architecture-technique.md).

## v2 — Mesures et cohérence physique

- **Dimensions réelles des meubles** — *partiellement fait* : `hauteurCm`
  (hauteur réelle verticale) est implémenté et éditable dans l'inspecteur,
  voir [04-modele-de-donnees.md](04-modele-de-donnees.md). Reste en v2 :
  `largeurCm`/`profondeurCm` dérivées de `Plan.echellePxParCm` (déjà dans
  le MVP — voir [11-echelle-et-regles.md](11-echelle-et-regles.md)) et
  affichées à l'utilisateur en plus des pixels.
- **Détection de chevauchement** entre meubles (alerte visuelle, pas
  forcément un blocage strict).
- **Accrochage (snapping)** : aux bords d'autres meubles, à une grille
  configurable, éventuellement aux bords du plan.

## v3 — Plus riche

- **Multi-sélection** et actions groupées (déplacer/pivoter/supprimer
  plusieurs meubles à la fois).
- **Calques personnalisés** créés par l'utilisateur (ex. "annotations"),
  avec verrouillage — au-delà des 3 calques fixes déjà dans le MVP (fond /
  habillage / meubles, voir [12-calques.md](12-calques.md)).
- **Multi-pièces / multi-plans** dans un même projet (ex. onglets par
  étage ou par pièce).
- **Formes non rectangulaires plus détaillées** — *partiellement fait* :
  `forme` (rectangle/cercle/capsule) est implémenté, voir
  [04-modele-de-donnees.md](04-modele-de-donnees.md). Reste en v3 : formes
  en L pour canapés d'angle, silhouettes SVG plus détaillées.

## Idées plus lointaines / à évaluer

- **Sauvegarde automatique sur disque** via la File System Access API
  (Chrome/Edge uniquement) pour éviter le cycle manuel
  export/import — nécessiterait de vérifier l'impact sur la contrainte
  "pas de webserver" (aucun impact attendu, c'est une API navigateur, pas
  un serveur) et sur la portabilité (fallback nécessaire sur Firefox).
- **Vue 3D basique** (ex. rendu isométrique simple) — hors de portée à
  court terme, à ne considérer que si le besoin se confirme.
- **Mode tactile / tablette.**
- **Service tiers pour les icônes des types** (au lieu des emojis actuels
  dans `planner.conf.js`, voir [14-types-objets.md](14-types-objets.md))
  — évoqué mais pas prioritaire. À évaluer contre la contrainte "pas de
  webserver / pas de fetch" du projet (voir
  [01-architecture-technique.md](01-architecture-technique.md)) : un
  service tiers impliquerait soit un appel réseau externe, soit des
  fichiers d'icônes à héberger et charger localement.

## Ce qui ne change pas quel que soit le niveau atteint

Les contraintes fondatrices restent : pas de Docker, pas de backend
applicatif obligatoire, exécution locale sans installation lourde (voir
[00-vision.md](00-vision.md)). Toute évolution de la roadmap doit rester
compatible avec ces contraintes, ou faire l'objet d'une décision explicite
de les revoir.
