<?php
// Crée/écrase un projet (mode "servi") : projets/<id>.json (métadonnées
// seules — pas de contenu lourd comme un plan, voir js/projets.js).
header('Content-Type: application/json');

$corps = file_get_contents('php://input');
$donnees = json_decode($corps, true);
$id = $donnees['id'] ?? '';
if (!is_array($donnees) || !preg_match('/^[a-zA-Z0-9_-]+$/', $id)) {
    http_response_code(400);
    echo json_encode(['erreur' => 'Données invalides.']);
    exit;
}

$dossier = __DIR__ . '/../projets';
if (!is_dir($dossier)) mkdir($dossier, 0777, true);

file_put_contents($dossier . '/' . $id . '.json', json_encode($donnees));
echo json_encode(['ok' => true]);
