<?php

$pdo = new PDO('sqlite:' . __DIR__ . '/../database/database.sqlite');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$pdo->exec('CREATE TABLE IF NOT EXISTS KATEGORI (
    ID_Kategori TEXT PRIMARY KEY,
    Nama_Kategori TEXT
)');

$pdo->exec('CREATE TABLE IF NOT EXISTS SUPPLIER (
    ID_Supplier TEXT PRIMARY KEY,
    Nama_Supplier TEXT,
    Kontak TEXT,
    Alamat TEXT
)');

$pdo->exec('CREATE TABLE IF NOT EXISTS BARANG (
    ID_Barang TEXT PRIMARY KEY,
    ID_Kategori TEXT,
    Nama_Barang TEXT,
    Stok INTEGER,
    Satuan TEXT,
    Batas_Minimum INTEGER,
    Kapasitas_Max INTEGER
)');

$pdo->exec('CREATE TABLE IF NOT EXISTS PEGAWAI (
    ID_Pegawai TEXT PRIMARY KEY,
    Nama TEXT,
    Role_Akses TEXT,
    Username TEXT UNIQUE,
    Password TEXT
)');

$pdo->exec('CREATE TABLE IF NOT EXISTS BARANG_MASUK (
    ID_Masuk TEXT PRIMARY KEY,
    ID_Barang TEXT,
    ID_Supplier TEXT,
    ID_Pegawai TEXT,
    Tgl_Masuk TEXT,
    Qty_Masuk INTEGER,
    Status TEXT
)');

$pdo->exec('CREATE TABLE IF NOT EXISTS BARANG_KELUAR (
    ID_Keluar TEXT PRIMARY KEY,
    ID_Barang TEXT,
    ID_Pegawai TEXT,
    Tgl_Keluar TEXT,
    Qty_Keluar INTEGER,
    Tujuan TEXT,
    Status TEXT
)');

$pdo->exec('CREATE TABLE IF NOT EXISTS AUDIT_LOG (
    ID_Log INTEGER PRIMARY KEY,
    ID_Pegawai TEXT,
    Aktivitas TEXT,
    Waktu TEXT
)');

$pdo->exec("INSERT OR IGNORE INTO KATEGORI (ID_Kategori, Nama_Kategori) VALUES ('KAT-001', 'Umum')");
$pdo->exec("INSERT OR IGNORE INTO SUPPLIER (ID_Supplier, Nama_Supplier, Kontak, Alamat) VALUES ('SUP-001', 'Default Supplier', '000000', 'Local')");
$pdo->exec("INSERT OR IGNORE INTO BARANG (ID_Barang, ID_Kategori, Nama_Barang, Stok, Satuan, Batas_Minimum, Kapasitas_Max) VALUES ('BRG-001', 'KAT-001', 'Barang Contoh', 50, 'pcs', 5, 200)");
$pdo->exec("INSERT OR IGNORE INTO PEGAWAI (ID_Pegawai, Nama, Role_Akses, Username, Password) VALUES ('PG-001', 'Admin', 'Admin', 'admin', 'admin123')");

echo "SQLite bootstrap done\n";
