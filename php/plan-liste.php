<?php
// Liste les plans d'un projet (fichiers .json de projets/<projet>/plans/)
// pour l'écran de choix, en mode "servi en ligne" — voir
// documentation/20-plans.md et js/plans.js. N'expose pas l'image du
// blueprint (potentiellement volumineuse), juste de quoi afficher une carte.
header('Content-Type: application/json');

$projet = $_GET['projet'] ?? '';
if (!preg_match('/^[a-zA-Z0-9_-]+$/', $projet)) {
    echo json_encode([]);
    exit;
}

$dossier = __DIR__ . '/../projets/' . $projet . '/plans';

$plans = [];
foreach (glob($dossier . '/*.json') as $chemin) {
    $donnees = json_decode(file_get_contents($chemin), true);
    if (!is_array($donnees)) continue;
    $plans[] = [
        'fichier' => basename($chemin),
        'id' => $donnees['id'] ?? pathinfo($chemin, PATHINFO_FILENAME),
        'nom' => $donnees['nom'] ?? null,
        'miniature' => $donnees['miniature'] ?? null,
        'modifie' => filemtime($chemin)
    ];
}

usort($plans, fn($a, $b) => $b['modifie'] <=> $a['modifie']);
echo json_encode($plans);
