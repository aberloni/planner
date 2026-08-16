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
classique (http/https) — voir [20-sessions.md](20-sessions.md) pour ce que
ça change côté choix de session (seul cas où un peu de PHP entre en jeu,
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
├── planner.conf.js          # config statique : types d'objets (voir 14-types-objets.md)
├── css/
│   └── style.css
├── js/
│   ├── app.js                 # point d'entrée, orchestration
│   ├── plan.js                 # lecture du fichier image importé
│   ├── viewport.js             # SVG racine : viewBox, zoom, pan, calques
│   ├── statut.js               # zone de statut de la barre d'outils
│   ├── echelle.js              # calibration de l'échelle du plan
│   ├── regles.js               # règles graduées X/Y
│   ├── objets.js               # fabrique commune : sélection/drag/resize/rotation
│   ├── meubles.js               # instance typée de la fabrique (voir 14-types-objets.md)
│   ├── habillage.js             # instance de masquage de la fabrique (voir 15-modes.md)
│   ├── catalogue.js             # catalogue partagé d'objets nommés (voir 17-catalogue.md)
│   ├── utilisateurs.js          # profils utilisateurs (voir 16-utilisateurs.md)
│   ├── mode.js                  # bascule édition / nettoyage (voir 15-modes.md)
│   ├── inspecteur.js            # panneau de propriétés de l'objet sélectionné
│   ├── stockage.js               # localStorage, filet de sécurité (voir 03)
│   ├── sessions.js               # couche de données du choix de session (voir 20-sessions.md)
│   └── selecteur-sessions.js     # écran d'accueil, choix de session
├── sessions/
│   ├── liste.php                # découverte des sessions en mode "servi" (voir 20-sessions.md)
│   └── *.json                   # sessions elles-mêmes (déposées manuellement)
└── documentation/
    └── *.md
```

Cette arborescence est indicative — à ajuster librement au moment de
l'implémentation, ce document ne fige pas les noms de fichiers, seulement
les grands principes (pas de build, pas de backend, SVG, JSON pour la
persistance durable).
