# Palette de meubles — remplacée par le Catalogue

Ce document décrivait une palette fixe de gabarits codés en dur. Ce
mécanisme a été **abandonné avant implémentation** et remplacé par le
**Catalogue d'objets**, partagé entre utilisateurs et vide au départ (rien
de prédéfini) : voir [17-catalogue.md](17-catalogue.md).

Les types (`planner.conf.js`) définissent aujourd'hui une couleur et une
icône par catégorie, mais pas de dimensions par défaut — voir
[14-types-objets.md](14-types-objets.md). Les dimensions viennent de
l'entrée de catalogue (`ModeleObjet.largeur`/`hauteur`) choisie à la pose.
