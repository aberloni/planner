# Plans (écran de choix au démarrage)

Un **plan** = un `Projet` complet (voir
[04-modele-de-donnees.md](04-modele-de-donnees.md)) — un blueprint, son
habillage, ses propositions d'agencement (voir
[16-propositions.md](16-propositions.md)). Sert aussi à représenter les
étages d'un même lieu (un plan par étage). Plusieurs personnes/foyers
peuvent ainsi partager la même app avec des plans indépendants (ex. un
blueprint différent par maison/projet).

**Le catalogue n'est PAS propre à un plan** : il est global, partagé par
tous les plans, avec sa propre persistance — voir
[17-catalogue.md](17-catalogue.md) et
[js/catalogue-stockage.js](../js/catalogue-stockage.js).

## Au démarrage

Si un plan a déjà été ouvert sur ce navigateur/poste, l'app le rouvre
directement (bypass de l'écran de choix) — voir
`Plans.memoriserDernier`/`dernierPlanId` dans
[js/plans.js](../js/plans.js) : mémorisé dans `localStorage`
(`planner-dernier-plan`, un simple id/nom de fichier, dans tous les
modes) à chaque sauvegarde réussie d'un projet. Sinon (premier lancement,
ou plan mémorisé introuvable/supprimé), l'app affiche un écran de
sélection (grille de cartes, une par plan — nom, propositions existantes,
date de modification) — voir
[js/selecteur-plans.js](../js/selecteur-plans.js). Rien n'est restauré
automatiquement dans ce cas : l'utilisateur choisit un plan existant, ou en
crée un nouveau ("+ Nouveau plan").

Le bouton "Changer de plan" de la barre d'outils (`#btn-changer-plan`)
ouvre une sidebar ancrée à gauche (voir
[js/sidebar-plans.js](../js/sidebar-plans.js)) listant tous les plans, pour
en changer, en créer, en renommer ou en supprimer un sans revenir à l'écran
de choix ni recharger la page — sans risque de perte, le plan en cours est
déjà sauvegardé en continu (voir plus bas). Supprimer le plan en cours
depuis la sidebar recharge la page et retombe sur l'écran de choix (plus de
dernier plan valide).

## Deux modes de stockage, détectés automatiquement

Voir [js/plans.js](../js/plans.js) (module `Plans`) — jamais mélangés,
CRUD complet (créer/renommer/supprimer) dans les deux cas.

### Mode local (ouverture directe en `file://`)

- Plans stockés dans `localStorage` : un index (`planner-plans`,
  `[{id, nom, modifie}]`) + une clé par plan (`planner-plan-<id>`)
  contenant le `Projet` complet.
- Propre à un navigateur/profil sur une machine, comme le filet de sécurité
  `localStorage` classique (voir
  [03-stockage-et-persistance.md](03-stockage-et-persistance.md)).
- Migration automatique et silencieuse, une seule fois : si une ancienne
  sauvegarde mono-plan existe (clé `planner-projet`, avant l'introduction
  des plans multiples) et qu'aucun index de plans n'existe encore, elle
  devient le premier plan ("Plan 1").

### Mode fichiers (app servie en http/https)

- Plans = fichiers `.json` du dossier `plans/` (même format qu'un export
  "Enregistrer sous...", avec en plus un champ `nom` optionnel pour
  l'affichage sur la carte).
- Découverte et écriture via de petits scripts PHP du dossier `plans/`
  (seule brique non-JS-vanilla de l'app, strictement limitée à ce rôle) :
  - `liste.php` : scanne `plans/*.json`, retourne pour chacun `{fichier,
    id, nom, propositions, modifie}` (sans l'image du blueprint, pour
    rester léger) — alimente l'écran de choix.
  - `sauvegarder.php?fichier=xxx.json` : écrase le fichier avec le corps
    JSON envoyé (POST). Appelé à chaque modification, comme le filet
    `localStorage` (best-effort, silencieux en cas d'échec réseau).
  - `renommer.php?fichier=xxx.json&nom=...` : met à jour le champ `nom` du
    fichier (le nom du fichier physique ne change pas).
  - `supprimer.php?fichier=xxx.json` : supprime le fichier.
- Le nom de fichier est un identifiant opaque choisi côté client
  (`crypto.randomUUID() + ".json"`) à la création d'un plan, avant même sa
  première sauvegarde réelle (le fichier n'existe vraiment qu'après un
  premier import de blueprint).
- Sans hébergement compatible PHP, l'app reste utilisable (export/import de
  fichier `.json` manuel, comme avant) mais l'écran de choix ne liste aucun
  plan.
- Pas d'authentification — quiconque atteint l'app peut lire/écrire/
  supprimer n'importe quel plan de `plans/`.

## Catalogue global (distinct du stockage des plans)

Voir [17-catalogue.md](17-catalogue.md) pour le principe (un seul
catalogue partagé par tous les plans/étages). Persistance dans
[js/catalogue-stockage.js](../js/catalogue-stockage.js) (module
`CatalogueStockage`), mêmes deux modes que `Plans`, mais c'est un
**singleton** (pas une liste de fichiers, pas de CRUD créer/renommer/
supprimer — juste charger/sauvegarder) :

- **Mode local** : une seule clé `localStorage` fixe
  (`planner-catalogue-globale`), contenant `{ version, id, catalogue }`.
- **Mode fichiers** : un seul fichier `catalogue/catalogue.json` (dossier
  séparé de `plans/`, pour ne pas être ramassé par `plans/liste.php`), lu
  directement, écrit via `catalogue/sauvegarder.php?` (POST, corps JSON,
  même style best-effort que les scripts de `plans/`).
- **Pas de migration depuis les anciens catalogues embarqués par plan**
  (avant l'introduction du catalogue global, chaque plan portait sa propre
  copie dans `Projet.catalogue`) : au premier démarrage après cette
  évolution, rien n'existe encore côté catalogue global, donc il repart
  vide (choix assumé — voir "Ce qui n'est pas prévu" plus bas). Un ancien
  fichier `.json` de plan avec un champ `catalogue` embarqué reste
  importable normalement, mais ce champ est ignoré.
- Chargé une seule fois au démarrage (`chargerCatalogueGlobal()` dans
  [js/app.js](../js/app.js)), avant l'affichage de l'écran de choix de
  plan — jamais rechargé au changement de plan.

## Export / import de TOUS les plans

"Enregistrer sous..." (menu "Session et propositions") exporte désormais
**tous les plans en un seul fichier** — pas seulement le plan courant —
puisque le catalogue est global et ne voyage plus avec un seul plan :

```jsonc
{
  "version": 1,
  "catalogue": [ /* voir ModeleObjet, 04-modele-de-donnees.md */ ],
  "catalogueId": "9f8e7d6c-...",
  "plans": [ /* un Projet complet par plan, voir 04-modele-de-donnees.md */ ]
}
```

- Le plan actuellement ouvert est repris depuis l'état en mémoire (évite
  une course avec une sauvegarde pas encore terminée) ; les autres sont
  relus depuis leur stockage (`Plans.charger`).
- **Import** ("Ouvrir un projet...") détecte ce format (présence d'un
  tableau `plans`) et bascule automatiquement dessus : le catalogue
  embarqué est fusionné dans le catalogue global (jamais un remplacement),
  puis **chaque plan du paquet est créé comme une toute nouvelle entrée**
  (jamais un écrasement d'un plan existant, même en cas de nom identique),
  avant d'ouvrir le premier. Un ancien fichier mono-plan (sans `plans`)
  reste importable tel quel, comme avant.

## Ce qui n'est pas prévu (pour l'instant)

- Pas de gestion de conflits (dernière sauvegarde gagne, pas de fusion si
  deux postes éditent le même plan en même temps).
- Pas de renommage du fichier physique en mode fichiers (seul le champ
  `nom` affiché change).
- **Pas de migration entre versions incompatibles du format de stockage** :
  principe assumé pour toute l'app, pas seulement le catalogue global —
  quand un changement casse la compatibilité d'une donnée déjà sauvegardée,
  elle est simplement ignorée/repartie de zéro plutôt que migrée
  automatiquement.
