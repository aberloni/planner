# Lancement en local

Rappel de contrainte : pas de Docker, pas de webserver à installer/
administrer, pas de Python (voir [00-vision.md](00-vision.md)).

## Ouverture directe (par défaut, aucune installation)

Double-cliquer sur `index.html` (ou glisser le fichier dans un onglet de
navigateur). Fonctionne en `file://`, sans rien installer. C'est le mode
"session locale" (`localStorage`) — voir [20-sessions.md](20-sessions.md).

## App servie en ligne (http/https)

L'app est aussi une SPA statique déposable telle quelle sur n'importe quel
hébergement web classique. Dans ce mode, le choix des sessions passe par les
fichiers `.json` de `sessions/` et par les petits scripts PHP du même
dossier (`liste.php`, `sauvegarder.php`, `renommer.php`, `supprimer.php`) —
voir [20-sessions.md](20-sessions.md). Un hébergement compatible PHP est
nécessaire pour ce mode ; sans PHP, l'app fonctionne quand même mais
l'écran de choix de session reste vide (aucune session n'est trouvée).

## Pas de build à faire

Aucune étape de compilation/bundling n'est nécessaire (voir
[01-architecture-technique.md](01-architecture-technique.md) — JavaScript
vanilla, scripts classiques). Le dossier du projet est directement
utilisable tel quel.
