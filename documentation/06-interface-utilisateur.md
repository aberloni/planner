# Interface utilisateur

## Disposition générale (layout)

```
┌─────────────────────────────────────────────────────────────┐
│ Barre d'outils : gauche | centre (charger/sauver) | droite   │
│                  (utilisateurs) — voir groupes ci-dessous     │
├─────────────────────────────────────────────────────────────┤
│  Zone de travail (SVG) = plan + habillage + meubles           │
│  Flottants : contrôles zoom (haut-gauche), statut (haut-      │
│  centre), "+"/⧉/panneau catalogue (bas-gauche), inspecteur    │
│  (haut-droit), bouton mode (bas-droit)                        │
└─────────────────────────────────────────────────────────────┘
```

- **Barre d'outils** (haut) : actions globales sur le projet, réparties en
  3 groupes (`#barre-outils` en grid 3 colonnes) :
  - **Gauche** : import plan, échelle, cadrage.
  - **Centre** : chargement/sauvegarde — ouvrir/enregistrer projet, import/
    export/impression du catalogue, export PNG.
  - **Droite** : système d'utilisateurs (voir
    [16-utilisateurs.md](16-utilisateurs.md)).
- **Zone de travail** (tout le reste de l'écran) : le plan (image de fond)
  + l'habillage + les meubles posés, en SVG. Support du zoom (molette,
  double-clic, ou contrôles flottants) et du pan (clic sur le fond,
  maintenir, glisser).
- **Contrôles de zoom** (flottants, haut-gauche du viewport) : `-` /
  `%age` / `+`.
- **Statut** (flottant, haut-centre du viewport) : bulle discrète, masquée
  quand vide.
- **Catalogue** (flottant, bas-gauche) : bouton "+" ouvre le panneau
  catalogue (voir [17-catalogue.md](17-catalogue.md)) ; bouton "⧉"
  (dupliquer) apparaît juste à côté quand un objet est sélectionné.
- **Inspecteur** (flottant, haut-droit, voir
  [13-inspecteur.md](13-inspecteur.md)) : visible uniquement quand un
  objet est sélectionné.
- **Bouton de mode** (flottant, bas-droit) : bascule édition/nettoyage,
  voir [15-modes.md](15-modes.md).

## États de l'écran principal

1. **Aucun plan importé** : la zone de travail affiche un message d'accueil
   invitant à cliquer sur "Importer un plan" dans la barre d'outils (pas de
   glisser-déposer). Contrôles de zoom, bouton "+", cadre d'export et
   bouton de mode restent masqués tant qu'aucun plan n'est chargé.
2. **Plan importé, rien de sélectionné** : bouton "+", bouton de mode et
   contrôles de zoom visibles, inspecteur masqué.
3. **Objet sélectionné** (meuble ou masque, selon le mode) : contour
   distinct + poignées, l'inspecteur apparaît en haut à droite, le bouton
   "⧉" apparaît en bas à gauche.

## Interactions clé

- **Sélection** : clic simple (sans glisser) sur un objet du mode courant.
  Clic dans le vide = désélection. Voir l'arbitrage clic/pan détaillé dans
  [07-interactions-techniques.md](07-interactions-techniques.md) — un
  clic-glisser sur un objet non sélectionné pan le fond au lieu de le
  déplacer ; il faut d'abord le sélectionner (clic simple), puis le
  déplacer (clic-glisser).
- **Déplacement** : glisser l'objet déjà sélectionné.
- **Rotation** : glisser la poignée de rotation (au-dessus de l'objet,
  reliée par un petit trait), accroche systématique au multiple de 45° le
  plus proche.
- **Redimensionnement** : pas de poignée sur le plan — attribut du prefab,
  se change depuis le catalogue ou l'inspecteur (voir 17-catalogue.md).
- **Suppression** : bouton "Supprimer" de l'inspecteur pour un meuble ;
  double-clic pour un masque d'habillage (voir
  [15-modes.md](15-modes.md)).
- **Zoom** : molette de la souris (centré sur le curseur), double-clic
  (+25 points de zoom en absolu, centré sur le point cliqué), ou les
  contrôles `-` / `%age` / `+` en haut à gauche du viewport (pas dans la
  barre d'outils) — `-`/`+` par pas de ±10 points en absolu, clic sur le
  `%age` pour revenir à 100% **sans changer le pan** (le centre de la vue
  actuelle reste fixe). Le bouton "Cadrer" de la barre d'outils, lui,
  réinitialise aussi le pan (recadre sur tout le plan).
- **Pan (déplacement de la vue)** : clic sur le fond du plan, maintenir,
  glisser (un déplacement en dessous d'un petit seuil reste un simple clic,
  pour ne pas gêner la sélection/calibration).

## Retours visuels

- Objet sélectionné : contour distinct (pointillés bleus) + poignées.
- Statut ("Enregistré", nom de l'objet sélectionné, etc.) : bulle centrée
  en haut du viewport (pas dans la barre d'outils), discrète et non
  cliquable.

## Accessibilité / ergonomie (MVP, niveau raisonnable)

- Tous les boutons de la barre d'outils ont un `title` (tooltip) explicite.
- Pas de raccourcis clavier ni d'exigence d'accessibilité clavier complète
  pour le MVP — l'app est centrée sur une interaction souris de type
  "éditeur graphique" (voir [09-roadmap.md](09-roadmap.md) pour
  l'undo/redo, non implémenté).
