<?php

header('Content-Type: application/json');

$q = $_GET['q'] ?? '';
$q = trim($q);

if ($q === '') {
    echo json_encode([]);
    exit;
}

$db = new SQLite3('poi.db');

$stmt = $db->prepare("
    SELECT
        poi.name,
        poi.category,
        poi.lat,
        poi.lon
    FROM poi_fts
    JOIN poi
        ON poi.id = poi_fts.rowid
    WHERE poi_fts MATCH :query
    LIMIT 5
");

$stmt->bindValue(
    ':query',
    strtolower($q) . '*',
    SQLITE3_TEXT
);

$result = $stmt->execute();

$data = [];

while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
    $data[] = $row;
}

echo json_encode(
    $data,
    JSON_UNESCAPED_UNICODE |
    JSON_UNESCAPED_SLASHES
);
