<?php
// Sauvegarde le catalogue global (mode "servi"), partagé par tous les
// plans — un seul fichier catalogue.json, pas de liste (contrairement à
// plans/, voir documentation/17-catalogue.md). Best-effort côté client.
header('Content-Type: application/json');

$corps = file_get_contents('php://input');
if (json_decode($corps) === null) {
    http_response_code(400);
    echo json_encode(['erreur' => 'JSON invalide.']);
    exit;
}

file_put_contents(__DIR__ . '/catalogue.json', $corps);
echo json_encode(['ok' => true]);
