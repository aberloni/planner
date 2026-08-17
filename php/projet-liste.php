<?php
// Liste les projets disponibles (fichiers .json directement dans projets/,
// pas les sous-dossiers projets/<id>/) pour l'écran d'accueil, en mode
// "servi en ligne" — voir documentation/21-projets.md et js/projets.js.
header('Content-Type: application/json');

$dossier = __DIR__ . '/../projets';

$projets = [];
foreach (glob($dossier . '/*.json') as $chemin) {
    $donnees = json_decode(file_get_contents($chemin), true);
    if (!is_array($donnees)) continue;
    $id = $donnees['id'] ?? pathinfo($chemin, PATHINFO_FILENAME);
    $projets[] = [
        'id' => $id,
        'nom' => $donnees['nom'] ?? null,
        'nbPlans' => count(glob($dossier . '/' . $id . '/plans/*.json')),
        'modifie' => $donnees['modifie'] ?? filemtime($chemin)
    ];
}

usort($projets, fn($a, $b) => $b['modifie'] <=> $a['modifie']);
echo json_encode($projets);
