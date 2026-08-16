<?php
// Renomme un plan (mode "servi") : met à jour le champ `nom` du JSON,
// le fichier lui-même garde son nom — voir documentation/20-plans.md.
header('Content-Type: application/json');

$fichier = $_GET['fichier'] ?? '';
$nom = $_GET['nom'] ?? '';
if (!preg_match('/^[a-zA-Z0-9_-]+\.json$/', $fichier) || $nom === '') {
    http_response_code(400);
    echo json_encode(['erreur' => 'Paramètres invalides.']);
    exit;
}

$chemin = __DIR__ . '/' . $fichier;
if (!is_file($chemin)) {
    http_response_code(404);
    echo json_encode(['erreur' => 'Session introuvable.']);
    exit;
}

$donnees = json_decode(file_get_contents($chemin), true);
if (!is_array($donnees)) {
    http_response_code(400);
    echo json_encode(['erreur' => 'Session illisible.']);
    exit;
}

$donnees['nom'] = $nom;
file_put_contents($chemin, json_encode($donnees));
echo json_encode(['ok' => true]);
