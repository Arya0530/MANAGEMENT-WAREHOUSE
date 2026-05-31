# Panduan Setup Database Oracle

## Langkah 1: Jalankan Script SQL

Buka SQL*Plus atau SQL Developer, login sebagai user `warehouse`:

```bash
sqlplus warehouse/warehouse123@127.0.0.1:1521/orclpdb
```

Lalu jalankan script:
```sql
@oracle_setup.sql
```

Atau dari terminal:
```bash
sqlplus warehouse/warehouse123@127.0.0.1:1521/orclpdb @database/oracle_setup.sql
```

---

## Langkah 2: Akun Login yang Tersedia

| Username | Password  | Role  | Akses                                          |
|----------|-----------|-------|------------------------------------------------|
| admin    | admin123  | Admin | Semua fitur + audit log + kelola pegawai       |
| admin2   | admin123  | Admin | Semua fitur + audit log + kelola pegawai       |
| spv      | spv123    | SPV   | Approve/reject transaksi + lihat semua riwayat |
| spv2     | spv123    | SPV   | Approve/reject transaksi + lihat semua riwayat |
| staf     | staf123   | Staf  | Input barang masuk/keluar + riwayat sendiri    |
| staf2    | staf123   | Staf  | Input barang masuk/keluar + riwayat sendiri    |
| staf3    | staf123   | Staf  | Input barang masuk/keluar + riwayat sendiri    |

---

## Langkah 3: Cara Login dari Frontend (React)

### Request:
```http
POST /api/login
Content-Type: application/json

{
  "Username": "admin",
  "Password": "admin123"
}
```

### Response sukses:
```json
{
  "success": true,
  "message": "Login Berhasil sebagai Admin",
  "token": "1|abc123...",
  "data": {
    "ID_Pegawai": "PEG-001",
    "Nama": "Budi Santoso",
    "Role_Akses": "Admin",
    "Username": "admin"
  }
}
```

### Simpan token di React:
```js
localStorage.setItem('token', response.data.token);
localStorage.setItem('user', JSON.stringify(response.data.data));
```

### Kirim token di setiap request berikutnya:
```js
axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
```

---

## Langkah 4: Hak Akses per Role

| Endpoint                        | Admin | SPV | Staf |
|---------------------------------|-------|-----|------|
| GET /api/barang                 | ✅    | ✅  | ✅   |
| POST /api/barang                | ✅    | ❌  | ❌   |
| PUT /api/barang/:id             | ✅    | ❌  | ❌   |
| DELETE /api/barang/:id          | ✅    | ❌  | ❌   |
| GET /api/supplier               | ✅    | ✅  | ✅   |
| POST /api/supplier              | ✅    | ❌  | ❌   |
| DELETE /api/supplier/:id        | ✅    | ❌  | ❌   |
| POST /api/barang-masuk          | ✅    | ❌  | ✅   |
| GET /api/barang-masuk/pending   | ✅    | ✅  | ❌   |
| POST /api/approve-masuk/:id     | ✅    | ✅  | ❌   |
| POST /api/reject-masuk/:id      | ✅    | ✅  | ❌   |
| POST /api/barang-keluar         | ✅    | ❌  | ✅   |
| GET /api/pending-keluar         | ✅    | ✅  | ❌   |
| POST /api/approve-keluar/:id    | ✅    | ✅  | ❌   |
| POST /api/reject-keluar/:id     | ✅    | ✅  | ❌   |
| GET /api/riwayat                | ✅    | ✅  | ✅*  |
| GET /api/pegawai                | ✅    | ❌  | ❌   |

*Staf hanya melihat riwayat transaksi milik sendiri

---

## Struktur Tabel PEGAWAI

```sql
CREATE TABLE PEGAWAI (
    ID_Pegawai  VARCHAR2(10)  -- PEG-001, PEG-002, dst
    Nama        VARCHAR2(100)
    Role_Akses  VARCHAR2(10)  -- 'Admin', 'SPV', atau 'Staf'
    Username    VARCHAR2(50)  -- UNIQUE
    Password    VARCHAR2(255) -- plain text (upgrade ke bcrypt untuk production)
)
```
