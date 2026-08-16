# Export PNG

Bouton 🖼️ "Exporter le plan en PNG" dans la barre d'outils. L'export est
délimité par un **cadre** — un rectangle en pointillé, toujours visible
sur le plan une fois un projet chargé, avec deux poignées de coin pour le
redimensionner.

## Le cadre

- Par défaut : couvre tout le plan importé.
- Toujours à l'écran (contrairement au panneau catalogue ou à
  l'inspecteur) — pas besoin de l'activer, il est déjà là, en
  superposition, au-dessus de tous les calques et objets.
- **Redimensionnement uniquement** (pas de déplacement en glissant
  l'intérieur) : deux poignées, coin haut-droit et coin bas-gauche
  (`js/cadre-export.js`) — la poignée qu'on tire ancre le coin opposé, qui
  ne bouge pas. Le cadre n'a pas de rotation (toujours axis-aligned), donc
  le calcul est plus simple que le redimensionnement d'un meuble via le
  catalogue (voir [07-interactions-techniques.md](07-interactions-techniques.md)).
- Taille minimale : 10cm (dans les deux dimensions), pour éviter un
  cadre dégénéré.
- Sauvegardé avec le projet (`Projet.cadreExport`, voir
  [04-modele-de-donnees.md](04-modele-de-donnees.md)) — on le retrouve
  tel quel à la réouverture. Réinitialisé (= tout le plan) à chaque
  nouvel import de plan, comme le reste (voir
  [07-interactions-techniques.md](07-interactions-techniques.md)).

## Ce qui est exporté

Exactement ce qui est visuellement affiché à l'intérieur du cadre, pour
l'**utilisateur actif** (voir [16-utilisateurs.md](16-utilisateurs.md)) et
le **mode courant** (voir [15-modes.md](15-modes.md)) — si un calque est
masqué (ex. meubles en mode nettoyage), il n'apparaît pas dans l'export,
comme à l'écran. En sont en revanche toujours exclus : le cadre lui-même,
les poignées de sélection/rotation/redimensionnement, le contour de
sélection.

## Implémentation

1. Clone du `<svg>` racine (`js/app.js`, `exporterPNG()`).
2. Suppression dans le clone des éléments d'outillage (`#cadre-export`,
   poignées, classe `.selectionne`).
3. `viewBox` fixé sur les bornes du cadre (en unités du plan), mais
   `width`/`height` du clone multipliés par `FACTEUR_RESOLUTION_PNG`
   (**×3**) — le PNG sort donc à 3× la taille du cadre en pixels du plan,
   pour un rendu net (texte/formes vectorielles) même à l'impression. Le
   fond (photo importée) est juste ré-échantillonné à cette résolution,
   sans gain de détail réel au-delà de sa résolution d'origine, mais sans
   pixelisation visible.
4. Sérialisation (`XMLSerializer`) → *data URL* SVG → chargée dans une
   `Image` → dessinée sur un `<canvas>` → `canvas.toDataURL("image/png")`
   → téléchargement.
5. Le fond du plan étant déjà une image encodée en base64 (voir
   [03-stockage-et-persistance.md](03-stockage-et-persistance.md)), le
   canvas n'est jamais "taintée" (pas de ressource externe chargée).

Nom de fichier par défaut : `Projet.id` (même logique que l'export du
projet/catalogue, voir [04-modele-de-donnees.md](04-modele-de-donnees.md)).

## Portée MVP

- Facteur de résolution fixe (×3, constante `FACTEUR_RESOLUTION_PNG` dans
  [js/app.js](../js/app.js)), pas de réglage exposé dans l'interface.
- Pas de fond blanc/transparent configurable en dehors du plan lui-même.
