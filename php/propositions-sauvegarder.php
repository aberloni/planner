<?php
// Sauvegarde les propositions d'un projet (mode "servi"), partagées par
// tous ses plans — un seul fichier projets/<projet>/propositions.json, pas
// de liste (même principe que php/catalogue-sauvegarder.php). Best-effort
// côté client.
header('Content-Type: application/json');

$projet = $_GET['projet'] ?? '';
if (!preg_match('/^[a-zA-Z0-9_-]+$/', $projet)) {
    http_response_code(400);
    echo json_encode(['erreur' => 'Paramètre invalide.']);
    exit;
}

$corps = file_get_contents('php://input');
if (json_decode($corps) === null) {
    http_response_code(400);
    echo json_encode(['erreur' => 'JSON invalide.']);
    exit;
}

$dossier = __DIR__ . '/../projets/' . $projet;
if (!is_dir($dossier)) mkdir($dossier, 0777, true);

file_put_contents($dossier . '/propositions.json', $corps);
echo json_encode(['ok' => true]);
