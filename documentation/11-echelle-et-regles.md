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

## Portée MVP

- Une seule échelle par plan (pas d'échelle différente par zone).
- Pas d'unité paramétrable (cm uniquement en saisie ; affichage cm/m selon
  le zoom).
- Pas encore utilisée pour convertir les dimensions des meubles (v2, voir
  [09-roadmap.md](09-roadmap.md)) — l'échelle du MVP sert uniquement de
  repère visuel via les règles.
