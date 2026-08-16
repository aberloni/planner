<?php
// Supprime un plan (mode "servi") — voir documentation/20-plans.md.
header('Content-Type: application/json');

$fichier = $_GET['fichier'] ?? '';
if (!preg_match('/^[a-zA-Z0-9_-]+\.json$/', $fichier)) {
    http_response_code(400);
    echo json_encode(['erreur' => 'Nom de fichier invalide.']);
    exit;
}

$chemin = __DIR__ . '/' . $fichier;
if (is_file($chemin)) unlink($chemin);
echo json_encode(['ok' => true]);
