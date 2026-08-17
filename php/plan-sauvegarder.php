<?php
// Crée/écrase un plan d'un projet (mode "servi") dans
// projets/<projet>/plans/ : le fichier cible est désigné par le client
// (voir js/plans.js, Plans.sauvegarder()), appelé en continu à chaque
// modification, best-effort côté client — voir documentation/20-plans.md.
header('Content-Type: application/json');

$projet = $_GET['projet'] ?? '';
$fichier = $_GET['fichier'] ?? '';
if (!preg_match('/^[a-zA-Z0-9_-]+$/', $projet) || !preg_match('/^[a-zA-Z0-9_-]+\.json$/', $fichier)) {
    http_response_code(400);
    echo json_encode(['erreur' => 'Paramètres invalides.']);
    exit;
}

$corps = file_get_contents('php://input');
if (json_decode($corps) === null) {
    http_response_code(400);
    echo json_encode(['erreur' => 'JSON invalide.']);
    exit;
}

$dossier = __DIR__ . '/../projets/' . $projet . '/plans';
if (!is_dir($dossier)) mkdir($dossier, 0777, true);

file_put_contents($dossier . '/' . $fichier, $corps);
echo json_encode(['ok' => true]);
