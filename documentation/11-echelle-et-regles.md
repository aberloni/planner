# Échelle du plan et règles graduées

## Échelle par défaut à l'import

- À l'import d'un plan, une échelle par défaut est appliquée automatiquement :
  **100px = 1m** (`echellePxParCm = 1`). Pas de calibration imposée à
  l'import — l'utilisateur peut travailler directement avec ce repère
  approximatif.

## Calibration de l'échelle

- Déclenchée **uniquement** via le bouton "Échelle" de la barre d'outils
  (jamais automatiquement) — que ce soit pour une première calibration
  précise ou pour recalibrer un plan déjà importé.
- Déroulé : l'utilisateur clique deux points sur le plan (segment affiché
  pendant la saisie) puis saisit la longueur réelle de ce segment, en
  centimètres.
- Calcul : `echellePxParCm = distancePx / longueurCm`, stocké sur
  `Plan.echellePxParCm` (voir [04-modele-de-donnees.md](04-modele-de-donnees.md)).
- Recalibrer écrase simplement l'ancienne valeur (et remplace l'échelle par
  défaut si elle n'avait pas encore été ajustée).

## Règles graduées (axes X/Y)

- Une règle horizontale en haut de la zone de travail, une règle verticale
  à gauche, toutes deux graduées en centimètres (bascule automatique en
  mètres au-delà d'un certain niveau de zoom arrière, pour rester lisible).
- Les règles se redessinent à chaque changement de zoom/pan (le viewport
  SVG expose ses changements de `viewBox`, voir
  [07-interactions-techniques.md](07-interactions-techniques.md)), pour
  rester alignées avec le plan affiché.
- Objectif : donner un repère visuel de dimension, pas un outil de mesure
  précis au pixel près.

## Outil "Mesurer" (`js/mesure.js`)

- Bouton rond flottant (bas droite) : mesure une distance directement sur
  le plan, sans rien y poser, en utilisant l'échelle courante
  (`Echelle.pxParCm`).
- Deux façons de l'utiliser au choix, tant que l'outil est actif : deux
  clics simples (premier point, puis second point), ou un cliquer-glisser
  (le segment se dessine en direct, résultat affiché au relâchement).
- Résultat affiché dans la barre de statut, en cm ou en m selon la
  distance. Si l'échelle n'est pas définie, message explicite plutôt qu'un
  résultat faux.
- Échap ou barre d'espace quitte le mode mesure.

## Origine du plan (`js/origine.js`)

- Point de référence (0,0) utilisé par les règles et la grille, distinct
  du coin de l'image de fond — se définit en cliquant un point sur le
  plan (même mécanique que la calibration d'échelle).
- Stocke un simple décalage (en px image) entre le coin du fond et
  l'origine choisie : le fond, les meubles et l'échelle restent inchangés,
  seuls l'affichage des règles/grille et l'aimantation de la grille en
  tiennent compte.
- Tant qu'aucune origine n'a été définie explicitement, le décalage est
  (0,0) : l'origine reste le coin du fond. Réinitialisée à (0,0) à chaque
  nouveau plan importé.

## Grille graduée (`js/grille.js`)

- Grille visuelle alignée sur le pas des règles, affichée en overlay
  `<canvas>` par-dessus le plan.
- Cycle au clic sur son bouton dédié : désactivée → 2 cellules par unité
  de mesure → 4 cellules → désactivée.
- Sert aussi de point d'accroche (aimantation) optionnel pour le
  déplacement des meubles (`Grille.pointAccroche`, voir
  [07-interactions-techniques.md](07-interactions-techniques.md)) — pas
  d'accroche aux bords d'autres meubles ni au plan, seulement à la grille
  quand elle est active (voir [09-roadmap.md](09-roadmap.md) pour le
  reste de l'accrochage encore à faire).

## Gizmo d'échelle visuelle (`js/echelle-visuelle.js`)

- Barre "façon carte" (segments noir/blanc alternés, 1m chacun) affichée
  en bas du viewport, fixe à l'écran (ne bouge pas avec le pan), dont la
  largeur reflète le niveau de zoom courant.
- Purement informatif, se redessine à chaque changement de zoom/pan ou de
  calibration d'échelle.

## Portée MVP

- Une seule échelle par plan (pas d'échelle différente par zone).
- Pas d'unité paramétrable (cm uniquement en saisie ; affichage cm/m selon
  le zoom).
- Pas encore utilisée pour convertir les dimensions des meubles (v2, voir
  [09-roadmap.md](09-roadmap.md)) — l'échelle du MVP sert uniquement de
  repère visuel via les règles, la grille et l'outil de mesure.
