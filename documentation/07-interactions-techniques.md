# Détail technique des interactions

Ce document précise, pour l'implémentation à venir, *comment* les
interactions décrites dans
[06-interface-utilisateur.md](06-interface-utilisateur.md) seront gérées
techniquement.

## Rendu SVG

- La zone de travail est un unique `<svg>` dont le `viewBox` correspond aux
  dimensions naturelles du plan (`largeurPx` × `hauteurPx`, voir
  [04-modele-de-donnees.md](04-modele-de-donnees.md)).
- Le plan est un `<image>` SVG en fond, non interactif (`pointer-events:
  none`), positionnée à `(0,0)`.
- Chaque objet est un groupe `<g>` contenant :
  - un `<rect>` centré sur `(0,0)` localement (largeur/hauteur de l'objet),
  - pour les meubles uniquement (objets typés) : un `<text>` icône (emoji
    du type, 55% d'opacité, taille ≈ 60% du petit côté — 25% d'opacité et
    35% du petit côté pour les objets en arrière-plan, voir `zOrdre` dans
    [04-modele-de-donnees.md](04-modele-de-donnees.md)) et un `<text>` nom
    (libellé, sous l'icône) — voir [14-types-objets.md](14-types-objets.md).
    Les masques d'habillage n'ont ni icône ni nom affiché.
  - **Étiquette de nom ajustée dynamiquement** : la taille de police du
    `<text>` nom part d'une valeur de base (∝ petit côté de la bounding
    box) puis est réduite par paliers d'1px, jusqu'à un plancher de 7px,
    tant que `getComputedTextLength()` dépasse 85% du petit côté. Si le
    texte déborde encore au plancher, il est tronqué caractère par
    caractère avec un "…" final. Recalculé à la création, au
    redimensionnement et au renommage (`_ajusterNomEtiquette` dans
    [js/objets.js](../js/objets.js)) — le petit côté sert de largeur
    disponible de façon volontairement conservatrice, valable quelle que
    soit la rotation de l'objet.
  - le `<g>` est transformé via `transform="translate(x,y) rotate(rotation)"`
    pour le positionner et le pivoter — la rotation autour du centre est
    ainsi triviale (pas de calcul trigonométrique manuel sur la position).
  - les deux `<text>` reçoivent en plus leur propre `transform="rotate(-rotation) ..."`,
    pour rester lisibles à l'écran quelle que soit l'orientation de l'objet.
- Le zoom/pan de la zone de travail est géré en manipulant le `viewBox` du
  `<svg>` racine (pas de `transform: scale()` CSS, pour garder des
  coordonnées cohérentes pour le hit-testing natif du SVG).

## Sélection et poignées

- Un meuble sélectionné reçoit une classe CSS (`.selectionne`) qui affiche
  son contour distinctif.
- La poignée de rotation est un élément SVG additionnel, générés dynamiquement uniquement pour le meuble
  actuellement sélectionné (pas un par meuble en permanence, pour limiter
  le nombre d'éléments DOM).
- Un seul meuble sélectionné à la fois dans le MVP (pas de multi-sélection,
  voir [02-perimetre-mvp.md](02-perimetre-mvp.md)).

## Arbitrage clic / sélection / pan (implémenté)

Un meuble n'est déplaçable que s'il est déjà sélectionné — sinon un
clic-glisser dessus doit panner le fond, pas le déplacer. Règle retenue :

- **Clic simple (sans glisser) sur un meuble** : le sélectionne. Géré via
  `Viewport.alClicSimple(...)` (voir plus haut) + hit-testing (point dans
  le rectangle, en tenant compte de la rotation) sur la liste des meubles,
  du dernier posé (dessus) au premier.
- **Clic simple dans le vide** : désélectionne.
- **Clic-glisser sur un meuble NON sélectionné** : intentionnellement
  *pas* intercepté par le meuble — l'événement remonte jusqu'au `<svg>` et
  déclenche le pan normal du fond (comme un clic-glisser sur le vide).
- **Clic-glisser sur le meuble ACTUELLEMENT sélectionné** : intercepté dès
  le `pointerdown` sur son propre `<g>` (`stopPropagation()`, pour que
  Viewport ne le voie jamais et ne pan pas), avec son propre couple
  `pointermove`/`pointerup` qui met à jour `x`/`y` du meuble. La sélection
  est conservée au relâchement.

Chaque meuble est un groupe `<g>` (voir [04-modele-de-donnees.md](04-modele-de-donnees.md))
contenant un `<rect>` centré sur `(0,0)` localement, transformé via
`transform="translate(x,y) rotate(rotation)"`.

## Rotation

- Poignée dédiée (cercle relié par un trait), enfant du `<g>` du meuble
  pour suivre automatiquement sa position/rotation courante — créée
  uniquement pour le meuble sélectionné, supprimée à la désélection.
- Angle calculé via `Math.atan2` entre le centre du meuble et le curseur
  pendant le drag de la poignée, **toujours contraint au multiple de 45°
  le plus proche** (pas de rotation libre, pas de modificateur `Shift`).
- La distance de la poignée dépend de la hauteur du meuble ; elle est
  repositionnée si le meuble est redimensionné via le catalogue.

## Redimensionnement

Deux poignées de coin (carrés bas-gauche/haut-droit), enfants du `<g>` pivoté
du meuble (suivent donc sa rotation, comme la poignée de rotation) — créées
uniquement pour l'objet sélectionné. Glisser une poignée ancre le coin
opposé (fixe, calculé une fois au pointerdown dans le repère MONDE) ; à
chaque déplacement, le curseur est reprojeté dans le repère LOCAL (tourné,
figé pendant tout le drag) de l'objet pour en déduire largeur/hauteur
(valeur absolue, bornée à un minimum de 5px plan) et le nouveau centre —
voir `_surPointerDownTaille` dans `js/objets.js`.

La taille d'un meuble posé depuis le catalogue est un attribut du **prefab**,
partagé entre toutes ses instances — voir [17-catalogue.md](17-catalogue.md).
`Objets.redimensionner`/`_definirTaille` (dans `js/objets.js`) appliquent la
nouvelle taille sur le plan et rafraîchissent en direct : icône/nom (taille +
position), poignée de rotation (distance dépend de la hauteur), poignées de
coin elles-mêmes, infobulle de dimensions. `redimensionner` reporte aussi la
nouvelle taille (cm) sur le prefab du catalogue ET sur toutes ses autres
instances déjà posées, dans toutes les propositions du plan actif (voir
`_propagerTailleAuxAutresInstances`) — pour rester cohérent avec un catalogue
partagé. Le redimensionnement reste également possible depuis la vue
d'édition du catalogue (`js/edition-catalogue.js`) ou, si une instance est
posée, depuis l'inspecteur (champs largeur/profondeur en lecture seule +
bouton "Éditer dans le catalogue").

## Historique (undo/redo, pas encore implémenté)

- Pile d'états complets du tableau `meubles` (approche simple : snapshot
  JSON avant/après chaque action significative), avec une limite raisonnable
  (ex. 50 entrées) pour ne pas consommer de mémoire indéfiniment.
- Actions qui créent une entrée d'historique : ajout, suppression,
  déplacement (au `pointerup`), rotation (au `pointerup`), modification via
  le panneau propriétés (au `blur`/validation du champ).
- Le raccourci `Ctrl+Z` dépile l'historique "arrière", `Ctrl+Y` /
  `Ctrl+Shift+Z` rejoue l'historique "avant".
- L'import d'un nouveau plan ou d'un nouveau projet réinitialise
  l'historique.

## Import d'image (plan)

- Une seule entrée : bouton "Importer un plan" (`<input
  type="file" accept="image/png,image/jpeg">`) dans la barre d'outils —
  pas de glisser-déposer, pour éviter d'écraser une session en cours par
  erreur.
- Lecture via `FileReader.readAsDataURL` → obtention directe de la *data
  URL* base64 à stocker dans `Plan.image` (voir
  [04-modele-de-donnees.md](04-modele-de-donnees.md)).
- Les dimensions naturelles (`largeurPx`/`hauteurPx`) sont lues via un
  objet `Image` temporaire (`img.naturalWidth`/`naturalHeight`) après
  chargement, avant de dimensionner le `viewBox` du SVG.
- **Comportement différent selon qu'un plan est déjà chargé** (voir
  `chargerFichierPlan` dans `js/app.js`) :
  - **Aucun plan chargé** (nouvelle session) : remet tout à zéro — les
    meubles déjà posés sont supprimés (`Meubles.charger([])`), l'échelle
    repasse à la valeur par défaut (100px = 1m), catalogue/habillage/
    utilisateurs/cadre d'export réinitialisés.
  - **Un plan est déjà chargé** : remplace uniquement l'image de fond
    (`Viewport.definirPlan`) — échelle, meubles, habillage, catalogue,
    utilisateurs et cadre d'export restent inchangés. Utile pour recaler
    une photo de plan plus nette sans perdre la disposition déjà faite.
