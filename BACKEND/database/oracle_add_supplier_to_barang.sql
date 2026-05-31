-- ============================================================
-- ALTER TABLE: Tambah kolom ID_SUPPLIER ke tabel BARANG
-- Jalankan sebagai app_user jika tabel BARANG sudah ada
--
-- sqlplus app_user/password123@127.0.0.1:1521/ORCLPDB
-- @database/oracle_add_supplier_to_barang.sql
-- ============================================================

-- 1. Tambah kolom ID_SUPPLIER (nullable dulu biar data lama tidak error)
ALTER TABLE BARANG ADD (ID_SUPPLIER VARCHAR2(10));

-- 2. Isi data lama dengan supplier default (SUP-0001) agar tidak NULL
UPDATE BARANG SET ID_SUPPLIER = 'SUP-0001' WHERE ID_SUPPLIER IS NULL;

-- 3. Tambah Foreign Key ke tabel SUPPLIER
ALTER TABLE BARANG ADD CONSTRAINT FK_BARANG_SUPPLIER
    FOREIGN KEY (ID_SUPPLIER) REFERENCES SUPPLIER(ID_SUPPLIER);

COMMIT;

-- Verifikasi
SELECT COLUMN_NAME, DATA_TYPE, NULLABLE
FROM USER_TAB_COLUMNS
WHERE TABLE_NAME = 'BARANG'
ORDER BY COLUMN_ID;
