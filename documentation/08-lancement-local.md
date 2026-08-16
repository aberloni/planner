# Lancement en local

Rappel de contrainte : pas de Docker, pas de webserver à installer/
administrer, pas de Python (voir [00-vision.md](00-vision.md)).

## Ouverture directe (par défaut, aucune installation)

Double-cliquer sur `index.html` (ou glisser le fichier dans un onglet de
navigateur). Fonctionne en `file://`, sans rien installer. C'est le mode
"plan local" (`localStorage`) — voir [20-plans.md](20-plans.md).

## App servie en ligne (http/https)

L'app est aussi une SPA statique déposable telle quelle sur n'importe quel
hébergement web classique. Dans ce mode, le choix des plans passe par les
fichiers `.json` de `plans/` et par les petits scripts PHP du même
dossier (`liste.php`, `sauvegarder.php`, `renommer.php`, `supprimer.php`) ;
le catalogue (global, partagé par tous les plans) passe de la même façon
par `catalogue/catalogue.json` et `catalogue/sauvegarder.php` — voir
[20-plans.md](20-plans.md). Un hébergement compatible PHP est nécessaire
pour ce mode ; sans PHP, l'app fonctionne quand même (édition en mémoire,
export/import manuel de fichier `.json`) mais l'écran de choix de plan
reste vide et le catalogue ne peut pas être sauvegardé.

## Pas de build à faire

Aucune étape de compilation/bundling n'est nécessaire (voir
[01-architecture-technique.md](01-architecture-technique.md) — JavaScript
vanilla, scripts classiques). Le dossier du projet est directement
utilisable tel quel.
