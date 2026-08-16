# Types d'objets

Vocabulaire : sur le plan, on pose des **objets**. Un objet a un **type**
(ex. "Lit", "Table"...) qui détermine sa couleur d'affichage. Pour
l'instant, le seul type d'objet géré par l'app est le meuble rectangulaire
(voir [12-calques.md](12-calques.md), calque "meubles") — la distinction
"objet générique vs meuble" reste conceptuelle pour l'instant, à affiner
si d'autres catégories d'objets apparaissent (ex. des formes du calque
"habillage").

## `planner.conf.js`

Fichier de configuration statique, dans `js/`, qui liste les
types disponibles. C'est un fichier **JS** (pas JSON) chargé via
`<script src="js/planner.conf.js">`, pour rester compatible avec l'ouverture
directe en `file://` sans serveur — `fetch()` d'un fichier JSON local est
bloqué par CORS dans Chrome en `file://` (voir
[01-architecture-technique.md](01-architecture-technique.md) et
[08-lancement-local.md](08-lancement-local.md) pour la contrainte
"pas de webserver").

```js
const PlannerConf = {
  typeParDefaut: "generique",
  typesObjets: [
    { id: "generique", libelle: "Générique", couleur: "#adb5bd" },
    { id: "lit", libelle: "Lit", couleur: "#a8dadc" },
    { id: "electromenager", libelle: "Électroménager", couleur: "#6c757d" },
    // ...
  ],
  trouverType(id) { /* ... */ },
  icone(id) { /* -> `icones/${id}.svg` */ }
};
```

- `id` : identifiant stable, utilisé dans les données sauvegardées
  (`Meuble.type`) — ne pas renommer un `id` déjà utilisé dans des projets
  existants (ça reviendrait à changer leur type silencieusement). **Lien
  fort avec son icône** : le fichier `icones/<id>.svg` doit exister (voir
  section suivante) — pas de champ séparé pour le chemin, pas de repli
  emoji si le fichier manque (l'icône s'affiche alors cassée, signal
  immédiat qu'il manque le SVG).
- `libelle` : affiché dans le menu déroulant "Type" de l'inspecteur, et
  comme nom par défaut du meuble.
- `couleur` : appliquée automatiquement à tout objet de ce type.
- `typeParDefaut` : type assigné aux objets créés depuis "+ Nouvel
  objet..." dans le panneau catalogue (voir
  [17-catalogue.md](17-catalogue.md)), et type de repli si un
  `Meuble.type` sauvegardé ne correspond à aucun `id` connu (ex. après
  suppression d'un type dans la config).

## Icônes (`icones/`)

Chaque type **doit** avoir un SVG `icones/<id>.svg` (ex. `icones/lit.svg`
pour le type `lit`) — affiché en transparence (55% d'opacité, 25% pour les
objets en arrière-plan) au centre du meuble sur le plan, voir
[06-interface-utilisateur.md](06-interface-utilisateur.md). Convention
stricte, pas de fallback : ajouter un type sans son SVG casse l'icône
plutôt que de retomber silencieusement sur autre chose (signal visible
immédiat).

Pour trouver/télécharger une icône : API publique
[Iconify](https://api.iconify.design) (set `mdi` = Material Design Icons,
sans clé) —

```
curl -sf "https://api.iconify.design/mdi/<nom-icone>.svg" -o "icones/<id>.svg"
```

Téléchargement ponctuel en amont, jamais d'appel réseau au chargement de
l'app (contrainte `file://`, voir
[08-lancement-local.md](08-lancement-local.md)).

## Édition

Modifiable à la main dans un éditeur de texte — ajouter/retirer/renommer
des entrées dans le tableau `typesObjets`. Redémarrer/recharger l'app pour
que les changements soient pris en compte (pas de rechargement à chaud).

## Modèle de données

Voir [04-modele-de-donnees.md](04-modele-de-donnees.md) : `Meuble.type`
remplace l'ancien champ `Meuble.couleur` (la couleur n'est plus stockée
sur l'objet, elle est dérivée du type à l'affichage via
`PlannerConf.trouverType(type).couleur`).

## Inspecteur

Un menu déroulant "Type" est le premier champ de l'inspecteur (voir
[13-inspecteur.md](13-inspecteur.md)), peuplé depuis
`PlannerConf.typesObjets`. Changer le type met à jour la couleur affichée
immédiatement.
