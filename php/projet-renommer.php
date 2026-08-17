<?php
// Renomme un projet (mode "servi") : met à jour le champ `nom` de
// projets/<id>.json — voir documentation/21-projets.md.
header('Content-Type: application/json');

$id = $_GET['id'] ?? '';
$nom = $_GET['nom'] ?? '';
if (!preg_match('/^[a-zA-Z0-9_-]+$/', $id) || $nom === '') {
    http_response_code(400);
    echo json_encode(['erreur' => 'Paramètres invalides.']);
    exit;
}

$chemin = __DIR__ . '/../projets/' . $id . '.json';
if (!is_file($chemin)) {
    http_response_code(404);
    echo json_encode(['erreur' => 'Projet introuvable.']);
    exit;
}

$donnees = json_decode(file_get_contents($chemin), true);
if (!is_array($donnees)) {
    http_response_code(400);
    echo json_encode(['erreur' => 'Projet illisible.']);
    exit;
}

$donnees['nom'] = $nom;
file_put_contents($chemin, json_encode($donnees));
echo json_encode(['ok' => true]);
