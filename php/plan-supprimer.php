<?php
// Supprime un plan d'un projet (mode "servi") dans projets/<projet>/plans/
// — voir documentation/20-plans.md.
header('Content-Type: application/json');

$projet = $_GET['projet'] ?? '';
$fichier = $_GET['fichier'] ?? '';
if (!preg_match('/^[a-zA-Z0-9_-]+$/', $projet) || !preg_match('/^[a-zA-Z0-9_-]+\.json$/', $fichier)) {
    http_response_code(400);
    echo json_encode(['erreur' => 'Paramètres invalides.']);
    exit;
}

$chemin = __DIR__ . '/../projets/' . $projet . '/plans/' . $fichier;
if (is_file($chemin)) unlink($chemin);
echo json_encode(['ok' => true]);
