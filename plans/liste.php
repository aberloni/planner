<?php
// Liste les plans disponibles (fichiers .json de ce dossier) pour l'écran
// d'accueil, en mode "servi en ligne" — voir documentation/20-plans.md et
// js/plans.js. N'expose pas l'image du blueprint (potentiellement
// volumineuse), juste de quoi afficher une carte.
header('Content-Type: application/json');

$plans = [];
foreach (glob(__DIR__ . '/*.json') as $chemin) {
    $donnees = json_decode(file_get_contents($chemin), true);
    if (!is_array($donnees)) continue;
    $propositions = array_map(
        fn($p) => $p['nom'] ?? '',
        $donnees['propositions'] ?? []
    );
    $plans[] = [
        'fichier' => basename($chemin),
        'id' => $donnees['id'] ?? pathinfo($chemin, PATHINFO_FILENAME),
        'nom' => $donnees['nom'] ?? null,
        'propositions' => $propositions,
        'modifie' => filemtime($chemin)
    ];
}

usort($plans, fn($a, $b) => $b['modifie'] <=> $a['modifie']);
echo json_encode($plans);
