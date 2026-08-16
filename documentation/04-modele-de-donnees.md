# Modèle de données

Toutes les structures ci-dessous sont sérialisées en JSON, aussi bien pour
l'auto-sauvegarde (`localStorage`) que pour l'export/import de fichier
(voir [03-stockage-et-persistance.md](03-stockage-et-persistance.md)).

## `Projet`

```jsonc
{
  "version": 1,                     // version du format, pour migrations futures
  "id": "7d6e5f4a-...",             // identifiant unique, nom de fichier par défaut à l'export
  "nom": "Maison Dupont",           // optionnel, nom du plan (voir 20-plans.md), affiché sur sa carte
  "plan": { /* voir Blueprint */ },       // partagé — champ nommé "plan" pour compat, contient le blueprint
  "habillage": [ /* voir Habillage */ ],  // partagé
  "cadreExport": { "x": 0, "y": 0, "largeur": 1200, "hauteur": 800 }, // voir 19-export-png.md
  "propositions": [ /* voir Proposition */ ] // chacune avec ses propres meubles
}
```

- `version` : entier, incrémenté si la structure change de façon
  incompatible, pour permettre une future logique de migration à
  l'import.
- `id` : généré (`crypto.randomUUID()`) à la création du projet (import
  d'un plan), conservé à chaque sauvegarde/export. Sert de **nom de
  fichier par défaut** à "Enregistrer sous..." (voir
  [03-stockage-et-persistance.md](03-stockage-et-persistance.md)). Un
  fichier projet sans `id` (ancien format) s'en voit attribuer un nouveau
  à l'ouverture.
- `nom` : nom du plan choisi à sa création (voir
  [20-plans.md](20-plans.md)), affiché sur sa carte dans l'écran de
  choix. Absent/`null` sur les fichiers exportés manuellement en dehors du
  système de plans (repli sur `id` à l'affichage).
- **Pas de `catalogue`/`catalogueId` sur `Projet`** : le catalogue est
  global, partagé par tous les plans, avec sa propre structure et sa
  propre persistance — voir `CatalogueGlobal` plus bas et
  [20-plans.md](20-plans.md). Un `Projet` exporté avant ce changement peut
  encore porter un `catalogue` embarqué (ancien format) : à l'import, ce
  champ est simplement **ignoré** (pas de migration, voir "Ce qui n'est
  pas prévu" dans [20-plans.md](20-plans.md)).

## `Plan`

```jsonc
{
  "image": "data:image/png;base64,iVBORw0KGgo...",  // image encodée en base64
  "largeurPx": 1200,   // dimensions naturelles de l'image importée
  "hauteurPx": 800,
  "echellePxParCm": 8.5   // pixels par centimètre réel ; null si pas encore calibré
}
```

- `image` : *data URL* complète (inclut le type MIME), directement utilisable
  comme `src` d'une `<image>` SVG ou d'un `<img>`.
- `largeurPx` / `hauteurPx` : dimensions naturelles de l'image, utilisées
  pour dimensionner la zone de travail (le viewport SVG) à l'import.
- `echellePxParCm` : défini par calibration (l'utilisateur trace un segment
  sur le plan et indique sa longueur réelle en cm). Sert aux règles
  graduées des axes X/Y, et à convertir la taille réelle (cm) d'un
  `ModeleObjet` du catalogue en dimensions px au moment où une instance
  est posée (voir `ModeleObjet` plus bas).

## `Meuble`

```jsonc
{
  "id": "f3b1c2d4-...",       // identifiant unique (UUID)
  "modeleId": "9c8b7a6d-...", // optionnel, id d'une entrée du catalogue (voir plus bas)
  "type": "canape",           // id d'un type défini dans planner.conf.js
  "libelle": "Canapé salon",
  "forme": "rectangle",       // "rectangle" | "cercle" | "capsule" — voir note plus bas
  "zOrdre": "normal",         // "bas" | "normal" | "haut" — voir note plus bas
  "x": 340,                   // position du centre du meuble, en px, sur le plan
  "y": 210,
  "largeur": 180,             // en px
  "hauteur": 80,              // en px (profondeur au sol, vue de dessus)
  "rotation": 45,              // en degrés, multiple de 45, 0 = non pivoté
  "hauteurCm": null,           // hauteur réelle verticale, en cm — voir note plus bas
  "aDemenager": true           // faux = exclu du volume total (catalogue) — voir note plus bas
}
```

- **Système de coordonnées** : `x`/`y` désignent le **centre** du rectangle
  (plus simple pour la rotation, qui pivote autour du centre), en pixels,
  dans le référentiel de l'image du plan (0,0 = coin haut-gauche du plan).
- `largeur`/`hauteur` : dimensions du rectangle **avant rotation**, en
  **pixels** — dérivées de la taille réelle (cm) du `ModeleObjet` d'origine
  via `Echelle.pxParCm` au moment où l'instance est posée (voir
  `ajouterDepuisModele` dans [js/objets.js](../js/objets.js)) ; figées
  ensuite (un recalibrage de l'échelle ne change pas la taille à l'écran
  des meubles déjà posés). Modifiables depuis le catalogue ou l'inspecteur
  (reconverties en cm à l'affichage), pas de poignée sur le plan (voir
  [13-inspecteur.md](13-inspecteur.md), [17-catalogue.md](17-catalogue.md)
  et [07-interactions-techniques.md](07-interactions-techniques.md)).
- `type` : voir [14-types-objets.md](14-types-objets.md) — détermine la
  couleur d'affichage (pas de champ `couleur` séparé, dérivée du type).
- `forme` : **`largeur`/`hauteur` restent toujours la bounding box de
  l'objet, quelle que soit la forme.** Rendue en jouant uniquement sur
  `rx`/`ry` du même `<rect>` SVG (voir
  [07-interactions-techniques.md](07-interactions-techniques.md)) :
  `rectangle` (rx=ry=0), `cercle` (rx=largeur/2, ry=hauteur/2 — devient
  une ellipse si largeur ≠ hauteur), `capsule` (rx=ry=min(largeur,hauteur)/2,
  bouts arrondis au maximum sur le petit côté). Absente = `rectangle`
  (valeur par défaut). Le hit-testing (sélection) reste basé sur la
  bounding box rectangulaire dans tous les cas, pas sur la forme rendue.
- `rotation` : en degrés, contrainte aux multiples de 45 (poignée dédiée).
- `zOrdre` : niveau d'empilement visuel — `bas` (arrière-plan), `normal`
  (défaut), `haut` (premier plan). Permet par exemple de faire passer une
  chaise sous une table. `liste` (le tableau qui contient tous les objets
  d'un module, meubles ou habillage) garde en permanence 3 segments
  contigus dans cet ordre (tous les `bas`, puis tous les `normal`, puis
  tous les `haut`) ; au sein d'un même niveau, l'ordre relatif d'ajout est
  conservé. C'est ce même tableau qui sert à la fois de référence pour
  l'empilement visuel (DOM réordonné en conséquence, voir
  [07-interactions-techniques.md](07-interactions-techniques.md)) et pour
  le hit-testing (sélection) — les deux restent donc toujours cohérents.
  Éditable via le repli "Ordre d'affichage" de l'inspecteur (voir
  [13-inspecteur.md](13-inspecteur.md)). Absent = `normal`. Les objets
  `bas` reçoivent en plus une étiquette (icône + nom) plus petite et plus
  transparente, pour rester discrets visuellement.
- `id` : généré côté client (`crypto.randomUUID()`), utilisé pour la
  sélection, l'édition, la suppression, et pour que undo/redo puisse
  cibler un meuble précis même après réordonnancement.
- `hauteurCm` : hauteur réelle du meuble (verticale, pas la profondeur au
  sol représentée par `hauteur`). Éditable dans l'inspecteur mais **sans
  effet sur le rendu** — stockée en anticipation d'une évolution future
  (ex. vue 3D, voir [09-roadmap.md](09-roadmap.md)). Vide = `null` (non
  définie). N'existe que sur les objets typés (`Meuble`), pas sur
  `Habillage`.
- `aDemenager` : faux pour un objet qui ne sera pas déménagé (acheté sur
  place — type "À acheter" — ou volume fixe déjà en place — type "Volume
  fixe", voir [14-types-objets.md](14-types-objets.md)). Éditable via une
  case à cocher dans la vue d'édition du catalogue (voir
  [17-catalogue.md](17-catalogue.md)) : sans effet sur le rendu ni les
  dimensions, exclut juste l'objet du volume total (vue catalogue +
  impression). Absent/`true` = compté par défaut.

## `Habillage`

```jsonc
{
  "id": "a1b2c3d4-...",
  "libelle": "Masque",
  "forme": "rectangle",
  "zOrdre": "normal",
  "x": 500,
  "y": 300,
  "largeur": 100,
  "hauteur": 100,
  "rotation": 0
}
```

Même forme qu'un `Meuble`, **sans champ `type`** ni `hauteurCm` — les
masques d'habillage ont toujours une couleur blanche fixe (voir
[15-modes.md](15-modes.md)). Le champ `forme` est en revanche **générique**
(pas réservé aux objets typés) : un masque peut aussi être circulaire ou
en capsule. `Meuble` et `Habillage` sont produits par la même fabrique
`creerModuleObjets()` (voir [js/objets.js](../js/objets.js)) ;
l'inspecteur détecte la présence du champ `type`/`hauteurCm` pour savoir
s'il doit afficher les champs correspondants, mais affiche toujours
"Forme".

## `ModeleObjet` (entrée de catalogue)

```jsonc
{
  "id": "9c8b7a6d-...",
  "nom": "Canapé du salon",
  "type": "canape",
  "largeur": 180,   // en CM (taille réelle du meuble, donnée brute)
  "hauteur": 80,    // en CM
  "hauteurCm": null // hauteur réelle verticale, en cm
}
```

Voir [17-catalogue.md](17-catalogue.md) : catalogue partagé, sans rien de
prédéfini, qui grandit au fil de l'eau. **`largeur`/`hauteur` sont la
donnée brute saisie par l'utilisateur (cm), indépendante de tout plan** —
contrairement à `Meuble.largeur`/`hauteur` (px), qui n'existent que
**dérivées** de ces cm au moment où une instance est posée sur un plan
donné (voir note sur `Meuble` plus haut). Un `Meuble.modeleId` référence
l'entrée dont il a été posé (pas de lien vivant : modifier l'instance
posée — taille, rotation, nom — ne modifie pas l'entrée du catalogue,
**sauf** `type`, `hauteurCm` et les dimensions (reconverties px→cm),
reportés sur l'entrée d'origine pour garder l'icône du panneau catalogue à
jour et propager la taille réelle aux poses suivantes du même modèle —
voir `Catalogue.synchroniserDimensions` dans
[js/catalogue.js](../js/catalogue.js)).

## `CatalogueGlobal`

```jsonc
{
  "version": 1,
  "id": "9f8e7d6c-...",              // identifiant unique, nom de fichier par défaut à l'export CSV
  "catalogue": [ /* voir ModeleObjet ci-dessus */ ]
}
```

C'est la forme sérialisée du catalogue **global** (partagé par tous les
plans, voir [17-catalogue.md](17-catalogue.md)) telle que persistée par
`CatalogueStockage` ([js/catalogue-stockage.js](../js/catalogue-stockage.js)) :
une entrée `localStorage` unique en mode local, ou le fichier
`catalogue/catalogue.json` en mode fichiers — voir
[20-plans.md](20-plans.md). Distinct du `Projet` : ne voyage plus dedans.

## Paquet d'export multi-plans

```jsonc
{
  "version": 1,
  "catalogue": [ /* voir ModeleObjet */ ],
  "catalogueId": "9f8e7d6c-...",
  "plans": [ /* un Projet complet par plan */ ]
}
```

Format produit par "Enregistrer sous..." (voir
[20-plans.md](20-plans.md)) — présence du tableau `plans` = ce format
(plutôt qu'un `Projet` isolé, qui a un `plan` singulier et pas de
`plans`). Un fichier dans ce format, réimporté via "Ouvrir un projet...",
fusionne son `catalogue` dans le catalogue global et crée chaque entrée de
`plans` comme un **nouveau** plan (jamais un écrasement).

## `Proposition`

```jsonc
{
  "id": "e5f6a7b8-...",
  "nom": "Proposition 1",
  "meubles": [ /* voir Meuble */ ]
}
```

Voir [16-propositions.md](16-propositions.md) : chaque proposition porte
son propre agencement (`meubles`). Le blueprint et l'habillage
restent au niveau du `Projet`, pas dupliqués par proposition.

## Notes de conception

- **La donnée réelle (cm) vit dans le catalogue, pas sur l'instance** :
  `ModeleObjet.largeur`/`hauteur` sont la taille réelle du meuble, saisie
  une fois par l'utilisateur, indépendante de tout plan. `Meuble.largeur`/
  `hauteur` (px) en sont une **projection** sur un plan donné via
  `Plan.echellePxParCm`, calculée à la pose et recalculée à chaque
  redimensionnement (dans les deux sens : poser depuis le catalogue
  convertit cm→px, redimensionner une instance reconvertit px→cm avant
  d'écrire sur le modèle). Ça évite qu'un recalibrage de l'échelle change
  rétroactivement le sens des tailles déjà stockées dans le catalogue.
- **Ordre d'empilement (z-order)** : l'ordre des meubles dans le tableau
  `meubles` détermine l'ordre de superposition à l'affichage (le dernier de
  la liste est dessiné au-dessus). Une action "Mettre au premier plan /
  arrière-plan" pourra réordonner ce tableau.
