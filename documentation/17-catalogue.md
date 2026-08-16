# Catalogue d'objets (partagé, évolutif)

Les propositions répartissent les objets d'une maison existante sur le
nouveau plan. Ces objets ne sont **pas prédéfinis** — le catalogue
démarre vide et grandit au fil de l'eau, à mesure que les propositions
créent des objets.

## Principe

- Un objet créé depuis une proposition (avec un **nom** propre, ex. "Canapé
  du salon") devient immédiatement disponible pour **toutes les autres
  propositions**, sans qu'elles aient à le recréer.
- Le catalogue est **global** : un seul catalogue, partagé par **tous les
  plans** (tous les étages d'un même lieu, pas seulement les propositions
  d'un même plan) — persistance à part de celle des plans, voir
  [js/catalogue-stockage.js](../js/catalogue-stockage.js). Un objet créé
  sur un étage est donc immédiatement posable sur les autres.
- Un même objet du catalogue peut être **posé plusieurs fois** dans une
  même proposition, ou pas du tout dans une autre — voir la discussion sur
  les types dans [14-types-objets.md](14-types-objets.md) (même logique,
  appliquée ici aux objets nommés plutôt qu'aux catégories).
- Chaque pose (placement) reste une instance indépendante dans
  `Meubles.liste` de l'utilisateur qui l'a posée ; modifier une instance
  posée (rotation, nom) ne modifie **pas** le modèle du catalogue — pas de
  propagation. Exceptions : le **type**, la **hauteur réelle** (`hauteurCm`)
  et la **taille** (largeur/profondeur, reconverties px→cm) d'une instance
  sont reportés sur son modèle d'origine (`Catalogue.synchroniserType`/
  `synchroniserHauteurCm`/`synchroniserDimensions` dans
  [js/catalogue.js](../js/catalogue.js)), pour que l'icône affichée dans
  le panneau catalogue reste juste, et que la prochaine pose depuis ce
  modèle hérite de la taille/hauteur déjà renseignées.

## Interface

Le bouton "+" (bas gauche, mode édition) ouvre désormais un **panneau
catalogue** au lieu de poser directement un meuble générique :

- Liste des objets déjà créés (icône du type + nom), cliquables pour en
  poser une instance au centre de la vue.
- "+ Nouvel objet..." en bas : demande un nom (`prompt()`), crée l'entrée
  de catalogue (type par défaut, 1m×1m — modifiable ensuite via
  l'inspecteur sur l'instance posée) et pose immédiatement une instance.
- Se ferme au clic en dehors, à la sélection d'un item, ou en changeant
  de mode/d'utilisateur.

En mode nettoyage, le bouton "+" garde son comportement inchangé (ajoute
directement un masque, voir [15-modes.md](15-modes.md)) — pas de
catalogue pour l'habillage.

## Export / import séparés du projet

Le catalogue voyage aussi dans l'export/import complet du projet (voir
[03-stockage-et-persistance.md](03-stockage-et-persistance.md)), mais peut
**en plus** être exporté/importé seul, dans son propre fichier — pour
réutiliser une même liste d'objets sur un autre plan/projet sans repartir
d'un projet existant :

- **Exporter le catalogue...** (📤, barre d'outils) : demande un nom
  (`prompt()`, pré-rempli avec `Catalogue.id`) puis télécharge
  `{ version: 1, id, catalogue: [...] }` dans un fichier séparé.
- **Importer un catalogue...** (📥, barre d'outils) : lit un tel fichier et
  **remplace intégralement** le catalogue courant, y compris son `id`
  (`Catalogue.charger(modeles, id)` dans
  [js/catalogue.js](../js/catalogue.js)) — pas une fusion. Les meubles
  déjà posés ne sont pas affectés (leurs propriétés sont copiées à la
  pose, pas liées en direct au catalogue — voir plus haut).

## Impression

**Imprimer le détail du catalogue...** (🖨️, barre d'outils) : génère un
tableau (icône + nom, dimensions L × P × H en cm — le type n'a plus sa
propre colonne, l'icône suffit à l'identifier) dans une zone dédiée
(`#impression-catalogue`, masquée à l'écran, visible uniquement via une
règle CSS `@media print`) puis déclenche `window.print()`. Aucune
dépendance externe, pas de PDF généré côté app — c'est la boîte de
dialogue d'impression du navigateur qui prend le relais (imprimante
physique ou "Enregistrer en PDF" selon le pilote choisi par
l'utilisateur).

## Implémentation

- **[js/catalogue.js](../js/catalogue.js)** : module `Catalogue`,
  `id` (identifiant unique du catalogue courant, nom de fichier par
  défaut à l'export) + `liste` =
  `[{ id, nom, type, largeur, hauteur, hauteurCm }]`. **`largeur`/`hauteur`
  sont en CM** (taille réelle, donnée brute saisie par l'utilisateur,
  indépendante de tout plan) — la conversion en px pour un plan donné est
  toujours dérivée au contexte (pose d'une instance, rendu), jamais
  stockée dans le catalogue. Voir [04-modele-de-donnees.md](04-modele-de-donnees.md).
- **[js/objets.js](../js/objets.js)** : nouvelle méthode
  `ajouterDepuisModele(modele)` sur la fabrique (n'existe que pour les
  modules typés, donc `Meubles`) — crée une instance à partir d'un modèle
  du catalogue, avec un champ `modeleId` pour tracer son origine.

## Modèle de données

Voir [04-modele-de-donnees.md](04-modele-de-donnees.md) : nouveau tableau
`Projet.catalogue`, et nouveau champ optionnel `Meuble.modeleId`.

## Portée MVP

- Pas d'édition/suppression d'une entrée du catalogue après création.
- Pas de recherche/filtre dans la liste (suffisant pour un catalogue de
  taille raisonnable).
- Pas de compteur "combien de fois cet objet a été posé au total".
