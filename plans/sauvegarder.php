<?php
// Crée/écrase un plan (mode "servi") : le fichier cible est désigné par
// le client (voir js/plans.js, Plans.sauvegarder()), appelé en continu
// à chaque modification, best-effort côté client — voir
// documentation/20-plans.md.
header('Content-Type: application/json');

$fichier = $_GET['fichier'] ?? '';
if (!preg_match('/^[a-zA-Z0-9_-]+\.json$/', $fichier)) {
    http_response_code(400);
    echo json_encode(['erreur' => 'Nom de fichier invalide.']);
    exit;
}

$corps = file_get_contents('php://input');
if (json_decode($corps) === null) {
    http_response_code(400);
    echo json_encode(['erreur' => 'JSON invalide.']);
    exit;
}

file_put_contents(__DIR__ . '/' . $fichier, $corps);
echo json_encode(['ok' => true]);
