# Périmètre du MVP

> Ce document fige le périmètre **initial** envisagé avant implémentation.
> Le projet a depuis dépassé ce périmètre sur plusieurs points (catalogue
> partagé, types/formes/hauteur réelle, utilisateurs multiples, export PNG,
> duplication...) — voir [README.md](README.md) pour l'état actuel complet.
> Gardé tel quel comme repère historique, sauf les deux corrections
> ci-dessous où le texte d'origine est factuellement faux depuis.

## Dans le périmètre

1. **Importer un plan** : sélectionner un fichier JPG/PNG depuis le disque,
   affiché comme image de fond de la zone de travail.
2. **Définir l'échelle du plan** : à l'import (et modifiable ensuite), en
   traçant un segment sur le plan et en indiquant sa longueur réelle (cm).
   Affichage de règles graduées (cm) sur les axes X/Y de la zone de travail.
3. **Ajouter un meuble** : bouton rond "+" flottant, génère un rectangle
   1m x 1m (converti en pixels via l'échelle du plan) au centre de la vue
   actuelle, posé dans le calque "meubles" (voir [12-calques.md](12-calques.md)).
5. **Sélectionner un meuble** : clic (sans glisser) sur un meuble pour le
   sélectionner ; clic dans le vide pour désélectionner.
6. **Faire pivoter un meuble** : poignée de rotation dédiée (drag),
   contrainte aux multiples de 45° — voir
   [07-interactions-techniques.md](07-interactions-techniques.md).
7. **Renommer / changer le type d'un meuble** : via l'inspecteur (voir
   [13-inspecteur.md](13-inspecteur.md)) quand un meuble est sélectionné.
8. **Supprimer un meuble** sélectionné : bouton "Supprimer" dans
   l'inspecteur.
9. **Sauvegarder le projet** : export d'un fichier `.json` contenant le plan
   (image encodée) et la liste des meubles avec leurs propriétés.
10. **Charger un projet** : import d'un fichier `.json` précédemment
    exporté, qui restaure le plan et les meubles.
11. **Auto-sauvegarde locale** (`localStorage`) du dernier état en cours,
    pour ne pas perdre le travail en cas de fermeture accidentelle.
12. **Annuler / rétablir** (undo/redo) sur les actions de placement, rotation,
    suppression — jugé nécessaire dès le MVP pour un usage confortable
    (erreurs de manipulation fréquentes avec la souris) — *pas encore
    implémenté à ce stade*.

Un meuble MVP se limite donc à : un rectangle de couleur, nommé, qu'on peut
placer, orienter (rotation) et redimensionner (poignée de coin, par
paliers de 5cm, ou saisie directe dans l'inspecteur). **Depuis dépassé** :
la duplication est implémentée (bouton "⧉", voir
[13-inspecteur.md](13-inspecteur.md)).

## Explicitement hors périmètre du MVP

- Dimensions réelles (cm) des meubles (l'échelle du plan, elle, est dans le
  périmètre — voir ci-dessus).
- Détection de collision / chevauchement entre meubles ou avec les murs.
- Accrochage (snapping) aux murs, à d'autres meubles, ou à une grille.
- Édition des murs, portes, fenêtres (le plan reste une image figée).
- Plusieurs pièces / plusieurs plans dans un même projet.
- Vue 3D ou perspective.
- Bibliothèque de meubles personnalisée/enrichie (formes non rectangulaires,
  images de meubles réalistes) — **depuis dépassé** sur le point des formes
  non rectangulaires (`forme`: cercle/capsule, voir
  [04-modele-de-donnees.md](04-modele-de-donnees.md)).
- Export en image (PNG) du rendu final — **depuis dépassé**, implémenté
  (voir [19-export-png.md](19-export-png.md)).
- Multi-sélection et actions groupées.
- Mode tactile / mobile.

Voir [09-roadmap.md](09-roadmap.md) pour la suite envisagée après le MVP.

## Critère de "fait" pour le MVP

L'utilisateur peut, sans installer autre chose qu'un navigateur :

1. Ouvrir l'app.
2. Importer une photo/scan de son plan.
3. Ajouter plusieurs meubles via le bouton "+".
4. Les positionner et les orienter par glisser-déposer.
5. Sauvegarder son agencement dans un fichier, fermer l'app, la rouvrir,
   recharger le fichier et retrouver exactement son agencement.
