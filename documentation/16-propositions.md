# Propositions (agencements multiples)

Plusieurs personnes peuvent proposer des agencements de meubles différents
sur le **même plan**. Chaque proposition a sa propre liste de meubles ;
le blueprint et l'habillage (masques, voir [15-modes.md](15-modes.md)) sont
**communs** à toutes les propositions.

## Ce qui est partagé vs propre à chaque proposition

| | Partagé | Propre à la proposition |
|---|---|---|
| Blueprint (image, échelle) | ✅ | |
| Habillage (masques) | ✅ | |
| Meubles | | ✅ |

Autrement dit : la calque d'édition (meubles, voir
[12-calques.md](12-calques.md)) est dupliquée par proposition ; les
calques fond et habillage restent des tableaux uniques au niveau du
projet. Le **catalogue d'objets** (voir [17-catalogue.md](17-catalogue.md))
est lui aussi partagé — un objet créé depuis une proposition est
immédiatement posable par les autres, sans recréation.

## Interface

Toute la gestion des propositions est regroupée dans le menu kebab
"Plan et propositions" (bouton "⋮", `#btn-menu-proposition`) dans la barre
d'outils, à côté d'un label en lecture seule (`#label-proposition-active`)
affichant le nom de la proposition active.

- **Label** (`#label-proposition-active`) : non éditable, affiche simplement
  le nom de la proposition active.
- **Ajouter une proposition** : option du menu. Demande un nom (`prompt()`),
  crée une proposition vide, et **bascule immédiatement dessus**.
- **Renommer la proposition active** : option du menu, demande le nouveau nom
  (`prompt()`).
- **Supprimer la proposition active** : option du menu (avec confirmation) —
  refuse de supprimer la dernière proposition restante.
- **Changer de proposition** : sous un séparateur horizontal, la liste de
  toutes les propositions est listée explicitement (un bouton par nom,
  l'active mise en évidence) dans le même menu — cliquer sur un nom bascule
  directement dessus. Le menu se referme après chaque action ou sélection
  (`_actualiserAffichage` régénère cette liste, `fermerMenu` la referme).
- Une seule proposition au départ ("Proposition 1"), créée automatiquement.

## Implémentation

- **[js/propositions.js](../js/propositions.js)** : module `Propositions`,
  `liste` = `[{ id, nom, meubles: [] }]`.
- `Meubles.liste` (voir [js/objets.js](../js/objets.js)) est toujours la
  liste de la proposition **active** — pas une copie séparée. À chaque
  bascule :
  1. `Meubles.liste` est recopié dans la proposition qu'on quitte
     (`_sauvegarderMeublesCourante`).
  2. `Meubles.charger(nouvelleProposition.meubles)` reconstruit
     entièrement l'affichage avec la liste de la nouvelle proposition active
     (désélectionne au passage, masque l'inspecteur).
- Avant toute sauvegarde/export, `Propositions.synchroniser()` force la
  recopie (la proposition active peut avoir été modifiée depuis la dernière
  bascule).
- **Importer un blueprint remet tout à zéro** (voir
  [07-interactions-techniques.md](07-interactions-techniques.md)) :
  `Propositions.charger([])` recrée une unique proposition par défaut.

## Portée MVP

- Pas d'indication visuelle de "qui a fait quoi" au-delà de la séparation
  par proposition (pas de couleur par proposition, pas de vue comparative
  superposée des propositions).
- Pas d'authentification — n'importe qui avec l'app ouverte peut basculer
  entre propositions et les éditer.
