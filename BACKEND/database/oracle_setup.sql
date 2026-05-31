-- ============================================================
-- ORACLE DATABASE SETUP - MANAGEMENT WAREHOUSE
-- Jalankan sebagai SYSDBA untuk buat user, lalu sebagai app_user
--
-- STEP 1 (sebagai SYSDBA):
--   sqlplus sys/SysPassword1@127.0.0.1:1521/ORCLPDB as sysdba
--   @database/oracle_setup_sysdba.sql
--
-- STEP 2 (sebagai app_user):
--   sqlplus app_user/password123@127.0.0.1:1521/ORCLPDB
--   @database/oracle_setup.sql
--
-- Sesuai .env: DB_USERNAME=app_user, DB_PASSWORD=password123
-- ============================================================

-- ============================================================
-- DROP TABEL LAMA (urutan penting karena ada FK)
-- ============================================================
BEGIN EXECUTE IMMEDIATE 'DROP TABLE AUDIT_LOG CASCADE CONSTRAINTS'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP TABLE BARANG_KELUAR CASCADE CONSTRAINTS'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP TABLE BARANG_MASUK CASCADE CONSTRAINTS'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP TABLE BARANG CASCADE CONSTRAINTS'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP TABLE KATEGORI CASCADE CONSTRAINTS'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP TABLE SUPPLIER CASCADE CONSTRAINTS'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP TABLE PEGAWAI CASCADE CONSTRAINTS'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP TABLE personal_access_tokens CASCADE CONSTRAINTS'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP SEQUENCE SEQ_AUDIT_LOG'; EXCEPTION WHEN OTHERS THEN NULL; END;
/

-- ============================================================
-- 1. TABEL PEGAWAI
-- Role: Admin, SPV, Staf
-- ============================================================
CREATE TABLE PEGAWAI (
    ID_Pegawai  VARCHAR2(10)  NOT NULL,
    Nama        VARCHAR2(100) NOT NULL,
    Role_Akses  VARCHAR2(10)  NOT NULL CHECK (Role_Akses IN ('Admin', 'SPV', 'Staf')),
    Username    VARCHAR2(50)  NOT NULL UNIQUE,
    Password    VARCHAR2(255) NOT NULL,
    CONSTRAINT PK_PEGAWAI PRIMARY KEY (ID_Pegawai)
);

-- ============================================================
-- 2. TABEL KATEGORI
-- ============================================================
CREATE TABLE KATEGORI (
    ID_Kategori   VARCHAR2(10)  NOT NULL,
    Nama_Kategori VARCHAR2(100) NOT NULL,
    CONSTRAINT PK_KATEGORI PRIMARY KEY (ID_Kategori)
);

-- ============================================================
-- 3. TABEL SUPPLIER
-- ============================================================
CREATE TABLE SUPPLIER (
    ID_Supplier   VARCHAR2(10)  NOT NULL,
    Nama_Supplier VARCHAR2(100) NOT NULL,
    Kontak        VARCHAR2(20)  NOT NULL,
    Alamat        VARCHAR2(255),
    CONSTRAINT PK_SUPPLIER PRIMARY KEY (ID_Supplier)
);

-- ============================================================
-- 4. TABEL BARANG
-- ============================================================
CREATE TABLE BARANG (
    ID_Barang     VARCHAR2(10)  NOT NULL,
    ID_Kategori   VARCHAR2(10)  NOT NULL,
    ID_Supplier   VARCHAR2(10),
    Nama_Barang   VARCHAR2(100) NOT NULL,
    Stok          NUMBER(10)    DEFAULT 0 NOT NULL,
    Satuan        VARCHAR2(20)  NOT NULL,
    Batas_Minimum NUMBER(10)    DEFAULT 0,
    Kapasitas_Max NUMBER(10)    DEFAULT 0,
    CONSTRAINT PK_BARANG PRIMARY KEY (ID_Barang),
    CONSTRAINT FK_BARANG_KATEGORI FOREIGN KEY (ID_Kategori) REFERENCES KATEGORI(ID_Kategori),
    CONSTRAINT FK_BARANG_SUPPLIER FOREIGN KEY (ID_Supplier) REFERENCES SUPPLIER(ID_Supplier)
);

-- ============================================================
-- 5. TABEL BARANG_MASUK
-- ============================================================
CREATE TABLE BARANG_MASUK (
    ID_Masuk    VARCHAR2(20)  NOT NULL,
    ID_Barang   VARCHAR2(10)  NOT NULL,
    ID_Supplier VARCHAR2(10)  NOT NULL,
    ID_Pegawai  VARCHAR2(10)  NOT NULL,
    Tgl_Masuk   DATE          DEFAULT SYSDATE NOT NULL,
    Qty_Masuk   NUMBER(10)    NOT NULL,
    Status      VARCHAR2(10)  DEFAULT 'PENDING' CHECK (Status IN ('PENDING','APPROVED','REJECTED')),
    CONSTRAINT PK_BARANG_MASUK PRIMARY KEY (ID_Masuk),
    CONSTRAINT FK_MASUK_BARANG   FOREIGN KEY (ID_Barang)   REFERENCES BARANG(ID_Barang),
    CONSTRAINT FK_MASUK_SUPPLIER FOREIGN KEY (ID_Supplier) REFERENCES SUPPLIER(ID_Supplier),
    CONSTRAINT FK_MASUK_PEGAWAI  FOREIGN KEY (ID_Pegawai)  REFERENCES PEGAWAI(ID_Pegawai)
);

-- ============================================================
-- 6. TABEL BARANG_KELUAR
-- ============================================================
CREATE TABLE BARANG_KELUAR (
    ID_Keluar   VARCHAR2(20)  NOT NULL,
    ID_Barang   VARCHAR2(10)  NOT NULL,
    ID_Pegawai  VARCHAR2(10)  NOT NULL,
    Tgl_Keluar  DATE          DEFAULT SYSDATE NOT NULL,
    Qty_Keluar  NUMBER(10)    NOT NULL,
    Tujuan      VARCHAR2(255),
    Status      VARCHAR2(10)  DEFAULT 'PENDING' CHECK (Status IN ('PENDING','APPROVED','REJECTED')),
    CONSTRAINT PK_BARANG_KELUAR PRIMARY KEY (ID_Keluar),
    CONSTRAINT FK_KELUAR_BARANG  FOREIGN KEY (ID_Barang)  REFERENCES BARANG(ID_Barang),
    CONSTRAINT FK_KELUAR_PEGAWAI FOREIGN KEY (ID_Pegawai) REFERENCES PEGAWAI(ID_Pegawai)
);

-- ============================================================
-- 7. TABEL AUDIT_LOG (Sequence + Trigger auto-increment)
-- ============================================================
CREATE TABLE AUDIT_LOG (
    ID_Log     NUMBER        NOT NULL,
    ID_Pegawai VARCHAR2(10)  NOT NULL,
    Aktivitas  VARCHAR2(500) NOT NULL,
    Waktu      DATE          DEFAULT SYSDATE NOT NULL,
    CONSTRAINT PK_AUDIT_LOG PRIMARY KEY (ID_Log),
    CONSTRAINT FK_LOG_PEGAWAI FOREIGN KEY (ID_Pegawai) REFERENCES PEGAWAI(ID_Pegawai)
);

CREATE SEQUENCE SEQ_AUDIT_LOG START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;

CREATE OR REPLACE TRIGGER TRG_AUDIT_LOG_ID
BEFORE INSERT ON AUDIT_LOG
FOR EACH ROW
BEGIN
    IF :NEW.ID_Log IS NULL THEN
        SELECT SEQ_AUDIT_LOG.NEXTVAL INTO :NEW.ID_Log FROM DUAL;
    END IF;
END;
/

-- ============================================================
-- 8. TABEL personal_access_tokens (Laravel Sanctum)
-- ============================================================
CREATE TABLE personal_access_tokens (
    id             NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tokenable_type VARCHAR2(255) NOT NULL,
    tokenable_id   VARCHAR2(10)  NOT NULL,
    name           VARCHAR2(255) NOT NULL,
    token          VARCHAR2(64)  NOT NULL UNIQUE,
    abilities      CLOB,
    last_used_at   TIMESTAMP,
    expires_at     TIMESTAMP,
    created_at     TIMESTAMP,
    updated_at     TIMESTAMP
);

CREATE INDEX idx_pat_tokenable ON personal_access_tokens (tokenable_type, tokenable_id);

-- ============================================================
-- DATA AWAL: KATEGORI
-- ============================================================
INSERT INTO KATEGORI VALUES ('KAT-001', 'Elektronik');
INSERT INTO KATEGORI VALUES ('KAT-002', 'Alat Tulis');
INSERT INTO KATEGORI VALUES ('KAT-003', 'Peralatan Kantor');
INSERT INTO KATEGORI VALUES ('KAT-004', 'Bahan Baku');
INSERT INTO KATEGORI VALUES ('KAT-005', 'Spare Part');

-- ============================================================
-- DATA AWAL: SUPPLIER
-- ============================================================
INSERT INTO SUPPLIER VALUES ('SUP-0001', 'PT Maju Jaya',       '081234567890', 'Jl. Industri No.1, Jakarta');
INSERT INTO SUPPLIER VALUES ('SUP-0002', 'CV Berkah Abadi',    '082345678901', 'Jl. Raya Bogor No.5, Bogor');
INSERT INTO SUPPLIER VALUES ('SUP-0003', 'UD Sumber Makmur',   '083456789012', 'Jl. Pahlawan No.10, Bandung');

-- ============================================================
-- DATA AWAL: BARANG (ID_Barang, ID_Kategori, ID_Supplier, Nama_Barang, Stok, Satuan, Batas_Minimum, Kapasitas_Max)
-- ============================================================
INSERT INTO BARANG VALUES ('BRG-0001', 'KAT-001', 'SUP-0001', 'Laptop Asus',      10,  'Unit', 2,  20);
INSERT INTO BARANG VALUES ('BRG-0002', 'KAT-001', 'SUP-0001', 'Monitor 24 inch',  15,  'Unit', 3,  30);
INSERT INTO BARANG VALUES ('BRG-0003', 'KAT-002', 'SUP-0002', 'Pulpen Pilot',     200, 'Pcs',  50, 500);
INSERT INTO BARANG VALUES ('BRG-0004', 'KAT-003', 'SUP-0002', 'Kursi Kantor',     20,  'Unit', 5,  40);
INSERT INTO BARANG VALUES ('BRG-0005', 'KAT-004', 'SUP-0003', 'Kertas A4 80gr',   100, 'Rim',  20, 200);

-- ============================================================
-- DATA AWAL: PEGAWAI
-- Password: plain text (sesuai sistem existing)
-- ============================================================
INSERT INTO PEGAWAI VALUES ('PEG-001', 'Budi Santoso',  'Admin', 'admin',  'admin123');
INSERT INTO PEGAWAI VALUES ('PEG-002', 'Dewi Rahayu',   'Admin', 'admin2', 'admin123');
INSERT INTO PEGAWAI VALUES ('PEG-003', 'Hendra Wijaya', 'SPV',   'spv',    'spv123');
INSERT INTO PEGAWAI VALUES ('PEG-004', 'Sari Indah',    'SPV',   'spv2',   'spv123');
INSERT INTO PEGAWAI VALUES ('PEG-005', 'Andi Pratama',  'Staf',  'staf',   'staf123');
INSERT INTO PEGAWAI VALUES ('PEG-006', 'Rina Kusuma',   'Staf',  'staf2',  'staf123');
INSERT INTO PEGAWAI VALUES ('PEG-007', 'Doni Setiawan', 'Staf',  'staf3',  'staf123');

COMMIT;

-- ============================================================
-- DATA SAMPLE: BARANG_MASUK (status APPROVED agar stok naik)
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
-- DATA SAMPLE: BARANG_KELUAR (status APPROVED agar stok berkurang)
-- ============================================================
INSERT INTO BARANG_KELUAR VALUES ('OUT-260503-0001', 'BRG-0001', 'PEG-005', SYSDATE - 22, 2,  'Divisi IT',       'APPROVED');
INSERT INTO BARANG_KELUAR VALUES ('OUT-260507-0002', 'BRG-0003', 'PEG-006', SYSDATE - 18, 30, 'Divisi Umum',     'APPROVED');
INSERT INTO BARANG_KELUAR VALUES ('OUT-260512-0003', 'BRG-0002', 'PEG-005', SYSDATE - 13, 5,  'Divisi Keuangan', 'APPROVED');
INSERT INTO BARANG_KELUAR VALUES ('OUT-260516-0004', 'BRG-0004', 'PEG-006', SYSDATE - 9,  3,  'Divisi HRD',      'APPROVED');
INSERT INTO BARANG_KELUAR VALUES ('OUT-260519-0005', 'BRG-0005', 'PEG-007', SYSDATE - 6,  15, 'Divisi Produksi', 'APPROVED');
INSERT INTO BARANG_KELUAR VALUES ('OUT-260521-0006', 'BRG-0001', 'PEG-005', SYSDATE - 4,  1,  'Divisi IT',       'APPROVED');
INSERT INTO BARANG_KELUAR VALUES ('OUT-260523-0007', 'BRG-0002', 'PEG-006', SYSDATE - 2,  4,  'Divisi Umum',     'PENDING');

COMMIT;

-- ============================================================
-- VERIFIKASI
-- ============================================================
SELECT TABLE_NAME FROM USER_TABLES ORDER BY TABLE_NAME;
SELECT ID_Pegawai, Nama, Role_Akses, Username FROM PEGAWAI ORDER BY Role_Akses, ID_Pegawai;
SELECT COUNT(*) AS TOTAL_MASUK  FROM BARANG_MASUK;
SELECT COUNT(*) AS TOTAL_KELUAR FROM BARANG_KELUAR;
