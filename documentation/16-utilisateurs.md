# Utilisateurs (propositions multiples)

Plusieurs personnes peuvent proposer des agencements de meubles différents
sur le **même plan**. Chaque utilisateur a sa propre liste de meubles ;
le plan et l'habillage (masques, voir [15-modes.md](15-modes.md)) sont
**communs** à tous les utilisateurs.

## Ce qui est partagé vs propre à chaque utilisateur

| | Partagé | Propre à l'utilisateur |
|---|---|---|
| Plan (image, échelle) | ✅ | |
| Habillage (masques) | ✅ | |
| Meubles | | ✅ |

Autrement dit : la calque d'édition (meubles, voir
[12-calques.md](12-calques.md)) est dupliquée par utilisateur ; les
calques fond et habillage restent des tableaux uniques au niveau du
projet. Le **catalogue d'objets** (voir [17-catalogue.md](17-catalogue.md))
est lui aussi partagé — un objet créé par un utilisateur est immédiatement
posable par les autres, sans recréation.

## Interface

Toute la gestion des utilisateurs est regroupée dans un menu kebab (bouton
"⋮", `#btn-menu-utilisateur`) dans la barre d'outils, à côté d'un label en
lecture seule (`#label-utilisateur-actif`) affichant le nom de l'utilisateur
actif.

- **Label** (`#label-utilisateur-actif`) : non éditable, affiche simplement
  le nom de l'utilisateur actif.
- **Ajouter un utilisateur** : option du menu. Demande un nom (`prompt()`),
  crée une proposition vide, et **bascule immédiatement dessus**.
- **Renommer l'utilisateur actif** : option du menu, demande le nouveau nom
  (`prompt()`).
- **Supprimer l'utilisateur actif** : option du menu (avec confirmation) —
  refuse de supprimer le dernier utilisateur restant.
- **Changer d'utilisateur** : sous un séparateur horizontal, la liste de
  tous les utilisateurs est listée explicitement (un bouton par nom,
  l'actif mis en évidence) dans le même menu — cliquer sur un nom bascule
  directement dessus. Le menu se referme après chaque action ou sélection
  (`_actualiserAffichage` régénère cette liste, `fermerMenu` la referme).
- Un seul utilisateur au départ ("Utilisateur 1"), créé automatiquement.

## Implémentation

- **[js/utilisateurs.js](../js/utilisateurs.js)** : module `Utilisateurs`,
  `liste` = `[{ id, nom, meubles: [] }]`.
- `Meubles.liste` (voir [js/objets.js](../js/objets.js)) est toujours la
  liste de l'utilisateur **actif** — pas une copie séparée. À chaque
  bascule :
  1. `Meubles.liste` est recopié dans l'utilisateur qu'on quitte
     (`_sauvegarderMeublesCourant`).
  2. `Meubles.charger(nouvelUtilisateur.meubles)` reconstruit
     entièrement l'affichage avec la liste du nouvel utilisateur actif
     (désélectionne au passage, masque l'inspecteur).
- Avant toute sauvegarde/export, `Utilisateurs.synchroniser()` force la
  recopie (l'utilisateur actif peut avoir été modifié depuis la dernière
  bascule).
- **Importer un plan remet tout à zéro** (voir
  [07-interactions-techniques.md](07-interactions-techniques.md)) :
  `Utilisateurs.charger([])` recrée un unique utilisateur par défaut.

## Portée MVP

- Pas d'indication visuelle de "qui a fait quoi" au-delà de la séparation
  par utilisateur (pas de couleur par utilisateur, pas de vue comparative
  superposée des propositions).
- Pas d'authentification — n'importe qui avec l'app ouverte peut basculer
  entre utilisateurs et éditer n'importe quelle proposition.
