-- ============================================================
-- SEED DATA TRANSAKSI SAMPLE
-- Jalankan ini kalau tabel sudah ada tapi grafik analytics kosong
-- karena belum ada data BARANG_MASUK / BARANG_KELUAR
--
-- sqlplus app_user/password123@127.0.0.1:1521/ORCLPDB
-- @database/oracle_seed_transaksi.sql
-- ============================================================

-- Hapus data lama kalau ada (aman dijalankan ulang)
DELETE FROM BARANG_KELUAR WHERE ID_Keluar LIKE 'OUT-260%';
DELETE FROM BARANG_MASUK  WHERE ID_Masuk  LIKE 'TRX-260%';

-- ============================================================
-- BARANG_MASUK sample (tersebar 30 hari terakhir)
-- ============================================================
INSERT INTO BARANG_MASUK VALUES ('TRX-260501-0001', 'BRG-0001', 'SUP-0001', 'PEG-005', SYSDATE - 25, 5,  'APPROVED');
INSERT INTO BARANG_MASUK VALUES ('TRX-260505-0002', 'BRG-0002', 'SUP-0001', 'PEG-005', SYSDATE - 20, 10, 'APPROVED');
INSERT INTO BARANG_MASUK VALUES ('TRX-260510-0003', 'BRG-0003', 'SUP-0002', 'PEG-006', SYSDATE - 15, 50, 'APPROVED');
INSERT INTO BARANG_MASUK VALUES ('TRX-260515-0004', 'BRG-0001', 'SUP-0001', 'PEG-005', SYSDATE - 10, 3,  'APPROVED');
INSERT INTO BARANG_MASUK VALUES ('TRX-260518-0005', 'BRG-0004', 'SUP-0002', 'PEG-006', SYSDATE - 7,  8,  'APPROVED');
INSERT INTO BARANG_MASUK VALUES ('TRX-260520-0006', 'BRG-0005', 'SUP-0003', 'PEG-007', SYSDATE - 5,  30, 'APPROVED');
INSERT INTO BARANG_MASUK VALUES ('TRX-260522-0007', 'BRG-0002', 'SUP-0001', 'PEG-005', SYSDATE - 3,  7,  'PENDING');
INSERT INTO BARANG_MASUK VALUES ('TRX-260524-0008', 'BRG-0003', 'SUP-0002', 'PEG-006', SYSDATE - 1,  20, 'PENDING');

-- ============================================================
-- BARANG_KELUAR sample (tersebar 30 hari terakhir)
-- ============================================================
INSERT INTO BARANG_KELUAR VALUES ('OUT-260503-0001', 'BRG-0001', 'PEG-005', SYSDATE - 22, 2,  'Divisi IT',       'APPROVED');
INSERT INTO BARANG_KELUAR VALUES ('OUT-260507-0002', 'BRG-0003', 'PEG-006', SYSDATE - 18, 30, 'Divisi Umum',     'APPROVED');
INSERT INTO BARANG_KELUAR VALUES ('OUT-260512-0003', 'BRG-0002', 'PEG-005', SYSDATE - 13, 5,  'Divisi Keuangan', 'APPROVED');
INSERT INTO BARANG_KELUAR VALUES ('OUT-260516-0004', 'BRG-0004', 'PEG-006', SYSDATE - 9,  3,  'Divisi HRD',      'APPROVED');
INSERT INTO BARANG_KELUAR VALUES ('OUT-260519-0005', 'BRG-0005', 'PEG-007', SYSDATE - 6,  15, 'Divisi Produksi', 'APPROVED');
INSERT INTO BARANG_KELUAR VALUES ('OUT-260521-0006', 'BRG-0001', 'PEG-005', SYSDATE - 4,  1,  'Divisi IT',       'APPROVED');
INSERT INTO BARANG_KELUAR VALUES ('OUT-260523-0007', 'BRG-0002', 'PEG-006', SYSDATE - 2,  4,  'Divisi Umum',     'PENDING');

COMMIT;

-- Verifikasi
SELECT COUNT(*) AS TOTAL_MASUK  FROM BARANG_MASUK;
SELECT COUNT(*) AS TOTAL_KELUAR FROM BARANG_KELUAR;
PROMPT Data transaksi sample berhasil diinsert!
