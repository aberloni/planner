# Architecture technique

## Décision : application 100% front-end, sans backend

Étant donné les contraintes (pas de Docker, pas de webserver à
installer/administrer, doit tourner en local), l'app sera une **Single Page
Application statique** : HTML + CSS + JavaScript, sans aucun serveur
applicatif requis pour fonctionner.

Lancement : **double-clic sur `index.html`** → ouverture directe dans le
navigateur via `file://`. Aucune installation nécessaire, pas de Python, pas
de processus serveur à maintenir.

L'app peut aussi être déposée telle quelle sur un hébergement statique
classique (http/https) — voir [20-plans.md](20-plans.md) pour ce que
ça change côté choix de plan (seul cas où un peu de PHP entre en jeu,
uniquement pour lister des fichiers).

## Pourquoi pas de framework (React/Vue) pour le MVP

Un framework avec bundler (Vite, Webpack...) impose une étape de build et
souvent un serveur de dev — ce qui ajoute de la complexité inutile pour un
MVP à portée volontairement réduite (placer/déplacer/pivoter des rectangles).

Choix retenu pour le MVP : **JavaScript "vanilla" (ES2020+), sans build
step**, organisé en plusieurs fichiers `<script>` classiques (pas de modules
ES `type="module"` pour éviter les soucis de CORS en `file://` sur certains
navigateurs).

Si le projet grossit significativement (v2/v3, voir
[09-roadmap.md](09-roadmap.md)), une migration vers un outillage plus riche
(TypeScript + Vite, toujours buildé en fichiers statiques) pourra être
reconsidérée à ce moment-là — mais ce n'est pas un besoin du MVP.

## Rendu du plan et des meubles

- **HTML5 Canvas** pour la zone de plan : image de fond (le plan JPG/PNG) +
  dessin des meubles (rectangles) par-dessus, avec gestion du drag, de la
  rotation et du redimensionnement via des poignées.
- Alternative envisagée : SVG (facilite l'interaction DOM native sur chaque
  meuble, poignées, styles CSS). Voir arbitrage ci-dessous.

### Arbitrage Canvas vs SVG

| Critère | Canvas | SVG |
|---|---|---|
| Perf avec beaucoup d'objets | Meilleure | Correcte pour un nombre modéré |
| Interaction par élément (clic, drag) | À coder soi-même (hit-testing) | Native (chaque `<rect>` est un élément DOM) |
| Export image (PNG) | Trivial (`canvas.toDataURL`) | Nécessite une étape de conversion |
| Simplicité pour un MVP avec peu de meubles | OK | Plus simple |

**Choix retenu : SVG.** Pour un MVP avec un nombre de meubles réduit par
pièce, la simplicité d'interaction (chaque meuble = un élément DOM cliquable
et draggable, sélection via CSS, poignées de rotation/redimension en SVG
natif) l'emporte sur le gain de perf du Canvas. L'export en image PNG (v2)
se fera via une conversion SVG → Canvas → PNG au moment de l'export
uniquement.

## Stockage des données

Aucune base de données. Deux mécanismes complémentaires (détaillés dans
[03-stockage-et-persistance.md](03-stockage-et-persistance.md)) :

- **`localStorage`** pour l'auto-sauvegarde du projet en cours (confort,
  évite de perdre le travail en cas de fermeture accidentelle de l'onglet).
- **Export / import de fichier `.json`** (téléchargement / sélection de
  fichier via `<input type="file">`) pour sauvegarder un projet de façon
  durable et le reprendre plus tard, ou en garder plusieurs versions.

## Compatibilité navigateur

Cible : navigateur moderne desktop (Chrome/Edge/Firefox récents). Pas de
support mobile/tactile requis pour le MVP (souris + clavier uniquement).

## Structure de fichiers (réelle)

```
planner/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── app.js                 # point d'entrée, orchestration
│   ├── version.js               # numéro de version affiché en filigrane
│   ├── planner.conf.js          # config statique : types d'objets (voir 14-types-objets.md)
│   ├── blueprint.js             # lecture du fichier image importé
│   ├── viewport.js             # SVG racine : viewBox, zoom, pan, calques
│   ├── statut.js               # zone de statut de la barre d'outils
│   ├── echelle.js              # calibration de l'échelle du blueprint
│   ├── echelle-visuelle.js      # gizmo façon carte, bas de viewport (voir 11)
│   ├── regles.js               # règles graduées X/Y
│   ├── grille.js                # grille graduée + accroche meubles (voir 11)
│   ├── origine.js               # point de référence (0,0) réglable (voir 11)
│   ├── mesure.js                # outil "Mesurer" une distance (voir 11)
│   ├── objets.js               # fabrique commune : sélection/drag/resize/rotation
│   ├── meubles.js               # instance typée de la fabrique (voir 14-types-objets.md)
│   ├── habillage.js             # instance de masquage de la fabrique (voir 15-modes.md)
│   ├── cadre-export.js          # cadre d'export PNG (voir 19-export-png.md)
│   ├── catalogue.js             # catalogue GLOBAL d'objets nommés, partagé par tous les plans (voir 17-catalogue.md)
│   ├── edition-catalogue.js      # vue dédiée d'édition du catalogue
│   ├── propositions.js          # agencements multiples (voir 16-propositions.md)
│   ├── mode.js                  # bascule édition / nettoyage (voir 15-modes.md)
│   ├── inspecteur.js            # panneau de propriétés de l'objet sélectionné
│   ├── stockage.js               # localStorage, filet de sécurité (voir 03)
│   ├── plans.js                  # couche de données du choix de plan (voir 20-plans.md)
│   ├── catalogue-stockage.js     # persistance du catalogue global, distincte de plans.js (voir 20-plans.md)
│   ├── selecteur-plans.js        # écran d'accueil, choix de plan
│   └── sidebar-plans.js          # sidebar de changement/gestion de plan
├── plans/
│   ├── liste.php                 # découverte des plans en mode "servi" (voir 20-plans.md)
│   ├── sauvegarder.php           # écrit un plan
│   ├── renommer.php              # renomme un plan
│   ├── supprimer.php             # supprime un plan
│   └── *.json                    # plans eux-mêmes (déposés manuellement)
├── catalogue/
│   ├── sauvegarder.php           # écrit le catalogue global (voir 20-plans.md) — dossier séparé de plans/, pour ne pas être ramassé par plans/liste.php
│   └── catalogue.json            # le catalogue global lui-même
└── documentation/
    └── *.md
```

Cette arborescence est indicative — à ajuster librement au moment de
l'implémentation, ce document ne fige pas les noms de fichiers, seulement
les grands principes (pas de build, pas de backend, SVG, JSON pour la
persistance durable).
