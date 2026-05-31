# 🚀 Panduan Setup & Run - Management Warehouse

## Prasyarat

Pastikan sudah terinstall:
- **PHP 8.2+** dengan ekstensi `oci8` (untuk Oracle)
- **Composer**
- **Node.js 18+** dan **npm**
- **Oracle Database** (XE / 21c / 19c) dengan PDB bernama `ORCLPDB`
- **Oracle Instant Client** (agar ekstensi `oci8` PHP bisa jalan)

---

## LANGKAH 1 — Setup Database Oracle

### 1a. Buat User Oracle (jalankan sekali sebagai SYSDBA)

Buka terminal, login sebagai SYSDBA:

```bash
sqlplus sys/YourSysPassword@127.0.0.1:1521/ORCLPDB as sysdba
```

Lalu jalankan script:

```sql
@BACKEND/database/oracle_create_user.sql
```

> Script ini membuat user `app_user` dengan password `password123` sesuai `.env`.

### 1b. Buat Semua Tabel & Data Awal

Login sebagai `app_user`:

```bash
sqlplus app_user/password123@127.0.0.1:1521/ORCLPDB
```

Jalankan script setup:

```sql
@BACKEND/database/oracle_setup.sql
```

Script ini akan membuat tabel-tabel berikut:

| Tabel                   | Keterangan                          |
|-------------------------|-------------------------------------|
| PEGAWAI                 | Data user login (Admin/SPV/Staf)    |
| KATEGORI                | Kategori barang                     |
| SUPPLIER                | Data supplier                       |
| BARANG                  | Master data barang + stok           |
| BARANG_MASUK            | Transaksi barang masuk              |
| BARANG_KELUAR           | Transaksi barang keluar             |
| AUDIT_LOG               | Log aktivitas sistem                |
| personal_access_tokens  | Token Sanctum (Laravel auth)        |

---

## LANGKAH 2 — Setup Backend (Laravel)

Buka terminal di folder `BACKEND`:

```bash
cd BACKEND
```

### 2a. Install dependencies PHP

```bash
composer install
```

### 2b. Cek file .env

File `.env` sudah ada dan sudah dikonfigurasi. Pastikan isinya:

```
DB_CONNECTION=oracle
DB_HOST=127.0.0.1
DB_PORT=1521
DB_SERVICE_NAME=ORCLPDB
DB_USERNAME=app_user
DB_PASSWORD=password123
```

Jika Oracle kamu pakai service name berbeda (misal `XE`, `orcl`), sesuaikan `DB_SERVICE_NAME`.

### 2c. Generate App Key (jika belum ada)

```bash
php artisan key:generate
```

### 2d. Test koneksi database

```bash
php check_conn.php
```

Output yang diharapkan:
```
BERHASIL konek ke ORCLPDB sebagai app_user
Tabel yang ada:
  - AUDIT_LOG
  - BARANG
  - BARANG_KELUAR
  - BARANG_MASUK
  - KATEGORI
  - PEGAWAI
  - PERSONAL_ACCESS_TOKENS
  - SUPPLIER
```

### 2e. Jalankan Backend Server

```bash
php artisan serve
```

Backend berjalan di: **http://localhost:8000**

---

## LANGKAH 3 — Setup Frontend (React + Vite)

Buka terminal **baru** di folder `FRONTEND`:

```bash
cd FRONTEND
```

### 3a. Install dependencies

```bash
npm install
```

### 3b. Jalankan Frontend

```bash
npm run dev
```

Frontend berjalan di: **http://localhost:5173**

---

## LANGKAH 4 — Login & Test

Buka browser ke **http://localhost:5173** dan login dengan salah satu akun:

| Username | Password  | Role  | Akses                                       |
|----------|-----------|-------|---------------------------------------------|
| admin    | admin123  | Admin | Semua fitur + audit log + kelola data       |
| admin2   | admin123  | Admin | Semua fitur + audit log + kelola data       |
| spv      | spv123    | SPV   | Approve/reject transaksi + lihat riwayat    |
| spv2     | spv123    | SPV   | Approve/reject transaksi + lihat riwayat    |
| staf     | staf123   | Staf  | Input barang masuk/keluar + riwayat sendiri |
| staf2    | staf123   | Staf  | Input barang masuk/keluar + riwayat sendiri |
| staf3    | staf123   | Staf  | Input barang masuk/keluar + riwayat sendiri |

---

## Troubleshooting

### ❌ Error: `oci_connect(): Unable to connect`
- Pastikan Oracle Database sudah running
- Cek service name: `lsnrctl status` di terminal Oracle
- Pastikan ekstensi `oci8` aktif di PHP: `php -m | grep oci8`

### ❌ Error: `ORA-01017: invalid username/password`
- Jalankan ulang `oracle_create_user.sql` sebagai SYSDBA
- Pastikan password di `.env` sama dengan yang di Oracle

### ❌ Error: `Class "Yajra\Oci8\..." not found`
- Jalankan `composer install` di folder BACKEND

### ❌ Frontend tidak bisa hit API (CORS error)
- Pastikan backend sudah jalan di port 8000
- Cek `BACKEND/config/cors.php` — `allowed_origins` harus include `http://localhost:5173`

### ❌ Error: `php_oci8` extension not loaded
- Windows: tambahkan `extension=oci8_19` di `php.ini`
- Pastikan Oracle Instant Client sudah di PATH

---

## Struktur API Endpoints

```
POST   /api/login                    Login pegawai
GET    /api/barang                   Daftar barang
POST   /api/barang                   Tambah barang (Admin)
PUT    /api/barang/{id}              Edit barang (Admin)
DELETE /api/barang/{id}              Hapus barang (Admin)
GET    /api/kategori                 Daftar kategori
GET    /api/supplier                 Daftar supplier
POST   /api/supplier                 Tambah supplier (Admin)
DELETE /api/supplier/{id}            Hapus supplier (Admin)
POST   /api/barang-masuk             Input barang masuk (Staf/Admin)
GET    /api/barang-masuk/pending     Pending approval (Admin/SPV)
POST   /api/approve-masuk/{id}       Approve masuk (Admin/SPV)
POST   /api/reject-masuk/{id}        Reject masuk (Admin/SPV)
POST   /api/barang-keluar            Input barang keluar (Staf/Admin)
GET    /api/pending-keluar           Pending keluar (Admin/SPV)
POST   /api/approve-keluar/{id}      Approve keluar (Admin/SPV)
POST   /api/reject-keluar/{id}       Reject keluar (Admin/SPV)
GET    /api/riwayat                  Riwayat transaksi
GET    /api/alerts/low-stock         Alert stok menipis
GET    /api/analytics/summary        Ringkasan analytics
GET    /api/reports/riwayat/pdf      Export PDF riwayat
GET    /api/reports/restock/pdf      Export PDF restock
GET    /api/reports/analytics/pdf    Export PDF analytics
```
