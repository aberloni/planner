# Sessions (écran de choix au démarrage)

Une **session** = un `Projet` complet (voir
[04-modele-de-donnees.md](04-modele-de-donnees.md)) — un plan, son
habillage, son catalogue, ses utilisateurs (chacun avec ses propositions
d'agencement, voir [16-utilisateurs.md](16-utilisateurs.md)). Plusieurs
personnes/foyers peuvent ainsi partager la même app avec des sessions
indépendantes (ex. un plan différent par maison/projet).

## Au démarrage

Si une session a déjà été ouverte sur ce navigateur/poste, l'app la
rouvre directement (bypass de l'écran de choix) — voir
`Sessions.memoriserDerniere`/`derniereSessionId` dans
[js/sessions.js](../js/sessions.js) : mémorisée dans `localStorage`
(`planner-derniere-session`, un simple id/nom de fichier, dans tous les
modes) à chaque sauvegarde réussie d'un projet. Sinon (premier lancement,
ou session mémorisée introuvable/supprimée), l'app affiche un écran de
sélection (grille de cartes, une par session — nom, propositions/
utilisateurs existants, date de modification) — voir
[js/selecteur-sessions.js](../js/selecteur-sessions.js). Rien n'est restauré
automatiquement dans ce cas : l'utilisateur choisit une session existante,
ou en crée une nouvelle ("+ Nouvelle session").

Le bouton "📑" de la barre d'outils (`#btn-sessions`) ouvre une sidebar
ancrée à gauche (voir [js/sidebar-sessions.js](../js/sidebar-sessions.js))
listant toutes les sessions, pour en changer, en créer, en renommer ou en
supprimer une sans revenir à l'écran de choix ni recharger la page — sans
risque de perte, la session en cours est déjà sauvegardée en continu (voir
plus bas). Supprimer la session en cours depuis la sidebar recharge la page
et retombe sur l'écran de choix (plus de dernière session valide).

## Deux modes de stockage, détectés automatiquement

Voir [js/sessions.js](../js/sessions.js) (module `Sessions`) — jamais
mélangés, CRUD complet (créer/renommer/supprimer) dans les deux cas.

### Mode local (ouverture directe en `file://`)

- Sessions stockées dans `localStorage` : un index (`planner-sessions`,
  `[{id, nom, modifie}]`) + une clé par session (`planner-session-<id>`)
  contenant le `Projet` complet.
- Propre à un navigateur/profil sur une machine, comme le filet de sécurité
  `localStorage` classique (voir
  [03-stockage-et-persistance.md](03-stockage-et-persistance.md)).
- Migration automatique et silencieuse, une seule fois : si une ancienne
  sauvegarde mono-session existe (clé `planner-projet`, avant l'introduction
  des sessions) et qu'aucun index de sessions n'existe encore, elle devient
  la première session ("Session 1").

### Mode fichiers (app servie en http/https)

- Sessions = fichiers `.json` du dossier `sessions/` (même format qu'un
  export "Enregistrer sous...", avec en plus un champ `nom` optionnel pour
  l'affichage sur la carte).
- Découverte et écriture via de petits scripts PHP du dossier `sessions/`
  (seule brique non-JS-vanilla de l'app, strictement limitée à ce rôle) :
  - `liste.php` : scanne `sessions/*.json`, retourne pour chacun `{fichier,
    id, nom, utilisateurs, modifie}` (sans l'image du plan, pour rester
    léger) — alimente l'écran de choix.
  - `sauvegarder.php?fichier=xxx.json` : écrase le fichier avec le corps
    JSON envoyé (POST). Appelé à chaque modification, comme le filet
    `localStorage` (best-effort, silencieux en cas d'échec réseau).
  - `renommer.php?fichier=xxx.json&nom=...` : met à jour le champ `nom` du
    fichier (le nom du fichier physique ne change pas).
  - `supprimer.php?fichier=xxx.json` : supprime le fichier.
- Le nom de fichier est un identifiant opaque choisi côté client
  (`crypto.randomUUID() + ".json"`) à la création d'une session, avant même
  sa première sauvegarde réelle (le fichier n'existe vraiment qu'après un
  premier import de plan).
- Sans hébergement compatible PHP, l'app reste utilisable (export/import de
  fichier `.json` manuel, comme avant) mais l'écran de choix ne liste
  aucune session.
- Pas d'authentification — quiconque atteint l'app peut lire/écrire/
  supprimer n'importe quelle session de `sessions/`.

## Ce qui n'est pas prévu (pour l'instant)

- Pas de gestion de conflits (dernière sauvegarde gagne, pas de fusion si
  deux postes éditent la même session en même temps).
- Pas de renommage du fichier physique en mode fichiers (seul le champ
  `nom` affiché change).
