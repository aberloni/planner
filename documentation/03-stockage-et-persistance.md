# Stockage et persistance

Pas de base de données. Deux mécanismes complémentaires, actifs **dans tous
les cas** : auto-sauvegarde locale et export/import de fichier `.json`.
S'y ajoute, au démarrage, le choix d'un **plan** — voir
[20-plans.md](20-plans.md) — qui détermine où l'auto-sauvegarde
écrit réellement (localStorage seul, ou aussi `plans/*.json` via PHP en
mode servi).

## 1. Auto-sauvegarde locale (`localStorage`)

- À chaque modification (déplacement, rotation, ajout, suppression...),
  l'état courant du projet est sérialisé en JSON et écrit dans
  `localStorage`, sous une clé fixe (`planner-projet`, voir
  [js/stockage.js](../js/stockage.js)) qui sert de filet de sécurité
  indépendamment du plan actif.
- En mode local (ouverture `file://`), le plan actif lui-même est
  aussi stocké dans `localStorage`, sous sa propre clé — voir
  [20-plans.md](20-plans.md).
- Rien n'est restauré automatiquement au chargement de l'app : l'utilisateur
  choisit son plan sur l'écran d'accueil (voir
  [20-plans.md](20-plans.md)).
- Limite connue : `localStorage` est limité en taille (~5-10 Mo selon
  navigateur) et l'image du blueprint (encodée en base64) peut être volumineuse.
  Si le quota est dépassé, l'auto-sauvegarde échoue silencieusement — faire
  un export `.json` manuel comme sauvegarde durable en cas de doute.
- `localStorage` est propre à un navigateur/profil sur une machine : ce n'est
  pas un mécanisme de sauvegarde durable ni transportable.

## 2. Export / import de fichier `.json`

C'est le mécanisme de sauvegarde **durable et transportable** :

- **Export** : bouton "Enregistrer sous..." qui demande un nom (`prompt()`,
  pas de vraie boîte de dialogue "Enregistrer sous" native possible depuis
  le web) **pré-rempli avec l'identifiant unique du projet** (`Projet.id`,
  voir [04-modele-de-donnees.md](04-modele-de-donnees.md)) puis génère un
  fichier `nom-du-projet.json` téléchargé via le navigateur (`Blob` +
  `<a download>`).
- **Import** : bouton "Ouvrir un projet..." avec `<input type="file">`
  filtré sur `.json`, qui relit et restaure l'état complet.
- Le fichier JSON contient **tout** ce qui est nécessaire pour restaurer le
  projet à l'identique, y compris l'image du blueprint encodée en base64 (voir
  [04-modele-de-donnees.md](04-modele-de-donnees.md)) — un seul fichier =
  un projet complet et portable, pas de dépendance à un chemin d'image
  externe.

### Pourquoi embarquer l'image en base64 plutôt qu'un chemin de fichier

- Portabilité : le fichier `.json` peut être déplacé, renommé, copié sur une
  autre machine sans casser le lien vers l'image.
- Simplicité : pas de gestion de chemins relatifs/absolus, pas de risque de
  lien cassé.
- Contrepartie assumée : fichiers `.json` plus lourds (taille de l'image
  d'origine). Acceptable pour un usage local mono-utilisateur.

## Format de nommage

Pas de convention imposée par l'app — l'utilisateur choisit le nom du
fichier à l'export, comme n'importe quel "Enregistrer sous..." classique.

## Ce qui n'est pas prévu (pour l'instant)

- Pas d'historique de versions au-delà de l'undo/redo en mémoire (perdu à la
  fermeture de l'onglet).
- Pas de sauvegarde automatique sur disque en mode local (nécessiterait la
  File System Access API, disponible uniquement sur Chrome/Edge — à évaluer
  en v2 si jugé utile, voir [09-roadmap.md](09-roadmap.md)). En mode servi,
  ce besoin est couvert par `plans/*.json` (voir
  [20-plans.md](20-plans.md)).
