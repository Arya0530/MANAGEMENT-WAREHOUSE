-- ============================================================
-- JALANKAN INI SEBAGAI SYSDBA DULU (sekali saja)
-- Untuk membuat user app_user di Oracle
--
-- Cara jalankan:
--   sqlplus sys/YourSysPassword@127.0.0.1:1521/ORCLPDB as sysdba
--   @database/oracle_create_user.sql
-- ============================================================

-- Hapus user lama jika ada
BEGIN
    EXECUTE IMMEDIATE 'DROP USER app_user CASCADE';
EXCEPTION WHEN OTHERS THEN NULL;
END;
/

-- Buat user baru sesuai .env
CREATE USER app_user IDENTIFIED BY password123
    DEFAULT TABLESPACE USERS
    TEMPORARY TABLESPACE TEMP
    QUOTA UNLIMITED ON USERS;

-- Grant hak akses
GRANT CONNECT, RESOURCE TO app_user;
GRANT CREATE SESSION TO app_user;
GRANT CREATE TABLE TO app_user;
GRANT CREATE SEQUENCE TO app_user;
GRANT CREATE TRIGGER TO app_user;
GRANT CREATE VIEW TO app_user;
GRANT UNLIMITED TABLESPACE TO app_user;

COMMIT;

PROMPT ============================================
PROMPT User app_user berhasil dibuat!
PROMPT Sekarang jalankan: oracle_setup.sql
PROMPT sebagai app_user/password123@ORCLPDB
PROMPT ============================================
