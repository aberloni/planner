# Instructions pour Claude

- Ne jamais lancer l'application (pas de serveur local, pas de preview browser, pas de `python serveur.py`, etc.). L'utilisateur teste lui-même dans son propre navigateur avec ses vraies données et rapporte les problèmes constatés.
- Se limiter à l'édition de code. Ne pas ouvrir de navigateur ni de serveur pour "vérifier" un correctif.
- Tenir à jour un `CHANGELOG.md` à la racine du projet à chaque changement de code : une ligne par changement, simple et directe, regroupées par date (la plus récente en haut). Chaque entrée doit tenir en 250 caractères maximum — garder le fait (quoi a changé), pas le détail (mécanisme exact, fichiers, migration).
- Versioning `X.Y` dans `version.md` à la racine (recopié dans `js/version.js`, affiché en filigrane discret bas droite via `#filigrane-version`) : incrémenter Y à chaque modification/prompt de code. Le X n'est incrémenté que sur demande explicite de l'utilisateur.
- Réponses ultra-concises, droit au but. Pas de blabla, pas de résumé inutile.
- Ne jamais manipuler git dans ce repo (pas de commit, branche, reset, rewrite d'historique) — même si une tâche semble le nécessiter ou si l'utilisateur paraît confirmer un plan lié à git. Édition de fichiers uniquement ; si une action git est nécessaire, l'indiquer et laisser l'utilisateur l'exécuter lui-même.
- Pas de code de migration quand un changement de format/stockage casse la compatibilité avec des données déjà sauvegardées (localStorage, fichiers plans/*.json, catalogue, etc.). Repartir de zéro (donnée ignorée/vide) plutôt que convertir/fusionner l'ancien format.
- Pour trouver une icône SVG alternative (ex. emoji manquant type "lave-linge") : API publique Iconify, sans clé — `https://api.iconify.design/{prefix}/{icon-name}.svg` (ex. `mdi/washing-machine`). Téléchargement ponctuel en amont, jamais d'appel réseau live dans l'app (contrainte `file://` sans serveur).
