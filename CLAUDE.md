# Instructions pour Claude

- Ne jamais lancer l'application (pas de serveur local, pas de preview browser, pas de `python serveur.py`, etc.). L'utilisateur teste lui-même dans son propre navigateur avec ses vraies données et rapporte les problèmes constatés.
- Se limiter à l'édition de code. Ne pas ouvrir de navigateur ni de serveur pour "vérifier" un correctif.
- Tenir à jour un `CHANGELOG.md` à la racine du projet à chaque changement de code : une ligne par changement, simple et directe, regroupées par date (la plus récente en haut).
- Versioning `X.Y` dans `version.md` à la racine (recopié dans `js/version.js`, affiché en filigrane discret bas droite via `#filigrane-version`) : incrémenter Y à chaque modification/prompt de code. Le X n'est incrémenté que sur demande explicite de l'utilisateur.
- Réponses ultra-concises, droit au but. Pas de blabla, pas de résumé inutile.
