<?php
// Supprime un projet (mode "servi") : projets/<id>.json ET son sous-dossier
// projets/<id>/ (tous ses plans + son catalogue) — voir
// documentation/21-projets.md.
header('Content-Type: application/json');

$id = $_GET['id'] ?? '';
if (!preg_match('/^[a-zA-Z0-9_-]+$/', $id)) {
    http_response_code(400);
    echo json_encode(['erreur' => 'Identifiant invalide.']);
    exit;
}

$racine = __DIR__ . '/../projets';

$fichier = $racine . '/' . $id . '.json';
if (is_file($fichier)) unlink($fichier);

$dossier = $racine . '/' . $id;
if (is_dir($dossier)) {
    $iterateur = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($dossier, RecursiveDirectoryIterator::SKIP_DOTS),
        RecursiveIteratorIterator::CHILD_FIRST
    );
    foreach ($iterateur as $item) {
        $item->isDir() ? rmdir($item->getPathname()) : unlink($item->getPathname());
    }
    rmdir($dossier);
}

echo json_encode(['ok' => true]);
