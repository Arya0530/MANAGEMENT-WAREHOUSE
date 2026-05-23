<?php
$pdo = new PDO('sqlite:' . __DIR__ . '/../database/database.sqlite');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

try {
    $pdo->exec('ALTER TABLE BARANG ADD COLUMN ID_Supplier TEXT');
    echo "Column ID_Supplier added successfully to BARANG table\n";
} catch (Exception $e) {
    echo "Column might already exist: " . $e->getMessage() . "\n";
}

echo "Done.\n";
