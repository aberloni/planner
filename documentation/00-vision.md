# Vision du projet

## Résumé

Application web **locale** permettant de placer, déplacer et faire pivoter des
meubles (rectangles) sur un plan de maison en 2D. L'utilisateur importe une
image de son plan (JPG/PNG) comme fond, puis dispose des meubles par-dessus
pour visualiser un aménagement possible.

## Objectif du MVP

> Placer / déplacer / faire pivoter des meubles rectangulaires sur un plan
> importé.

C'est la portée minimale retenue pour la v1. Tout le reste (dimensions
réelles, collisions, multi-pièces, 3D...) est repoussé à des versions
ultérieures — voir [09-roadmap.md](09-roadmap.md).

## Contraintes fortes (imposées par l'utilisateur)

- **Doit tourner en local**, sur la machine de l'utilisateur.
- **Pas de Docker.**
- **Pas de "vrai" webserver** à installer/administrer (pas de nginx, pas de
  process serveur permanent à maintenir).
- Pas de Python.
- Les murs du plan ne sont **pas modélisés** : le plan est une simple image de
  fond (JPG/PNG), non éditable, sur laquelle on pose des meubles.

Ces contraintes orientent fortement l'architecture technique — voir
[01-architecture-technique.md](01-architecture-technique.md).

## Non-objectifs (pour l'instant)

- Pas de compte utilisateur, pas de synchronisation cloud.
- Pas de collaboration multi-utilisateur.
- Pas d'édition des murs/portes/fenêtres.
- Pas de catalogue de meubles avec vraies dimensions au démarrage (viendra en
  v2).
- Pas de moteur de collision au démarrage.

## Utilisateur cible

Une seule personne (l'utilisateur lui-même), sur son propre poste, sans
notion préalable de développement web attendue pour *utiliser* l'app (juste
double-cliquer pour lancer).
