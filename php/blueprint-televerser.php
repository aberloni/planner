<?php
// Téléverse l'image d'un blueprint (mode "servi") dans imports/, à plat
// (pas de sous-dossier par projet — chaque fichier doit avoir un nom unique
// dans tout imports/), sous son nom d'origine — voir js/blueprint.js. Le
// chemin relatif retourné est stocké tel quel dans le plan (plus jamais de
// base64 embarqué, voir js/plans.js). Best-effort côté client.
header('Content-Type: application/json');

if (empty($_FILES['fichier']) || $_FILES['fichier']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['erreur' => 'Fichier manquant ou invalide.']);
    exit;
}

$fichier = $_FILES['fichier'];
$extensionsAutorisees = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
$extension = strtolower(pathinfo($fichier['name'], PATHINFO_EXTENSION));
if (!in_array($extension, $extensionsAutorisees, true) || getimagesize($fichier['tmp_name']) === false) {
    http_response_code(400);
    echo json_encode(['erreur' => 'Le fichier n\'est pas une image valide.']);
    exit;
}

// Nom d'origine conservé (basename seul : pas de traversée de dossier).
$nom = basename($fichier['name']);

$dossier = __DIR__ . '/../imports';
if (!is_dir($dossier)) mkdir($dossier, 0777, true);

move_uploaded_file($fichier['tmp_name'], $dossier . '/' . $nom);
echo json_encode(['ok' => true, 'chemin' => 'imports/' . $nom]);
