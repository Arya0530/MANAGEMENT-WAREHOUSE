<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Barang;

class BarangController extends Controller
{
    // 1. READ: Tampil Semua Barang (Udah ada dari sebelumnya)
    public function index()
    {
        $barang = Barang::all();
        return response()->json(['success' => true, 'data' => $barang], 200);
    }

    // 2. CREATE: Tambah Barang Baru
   // 2. CREATE: Tambah Barang Baru
    public function store(Request $request)
    {
        // 1. Validasi: Nama Barang HARUS ada hurufnya (nggak boleh pure angka)
        $request->validate([
            'ID_Kategori' => 'required',
            'Nama_Barang' => ['required', 'regex:/[a-zA-Z]+/'], 
            'Stok'        => 'required|numeric|min:0',
            'Satuan'      => 'required'
        ], [
            'Nama_Barang.regex' => 'Nama barang harus mengandung huruf!'
        ]);

        // 2. Bikin ID Otomatis (Contoh hasil: BRG-8392)
        $idOtomatis = 'BRG-' . rand(1000, 9999);

        try {
            // 3. Simpan ke database
            $barang = Barang::create([
                'ID_Barang'   => $idOtomatis,
                'ID_Kategori' => $request->ID_Kategori,
                'Nama_Barang' => $request->Nama_Barang,
                'Stok'        => $request->Stok,
                'Satuan'      => $request->Satuan
            ]);

            // 4. CATAT KE AUDIT LOG (CCTV Admin)
            \Illuminate\Support\Facades\DB::table('AUDIT_LOG')->insert([
                'ID_Log'     => rand(10000, 99999),
                'ID_Pegawai' => $request->ID_Pegawai ?? 'P001', // Ambil ID Pegawai dari React, atau P001 kalau kosong
                'Aktivitas'  => 'Admin Menambah Barang Baru: ' . $idOtomatis . ' (' . $request->Nama_Barang . ')',
                'Waktu'      => now()
            ]);

            return response()->json(['success' => true, 'message' => 'Barang berhasil ditambahkan!', 'data' => $barang], 201);
            
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Gagal nyimpen barang atau log: ' . $e->getMessage()], 500);
        }
    }
    // 3. UPDATE: Edit Data Barang
    public function update(Request $request, $id)
    {
        // Pakai query builder biar nembus bug huruf kecil Oracle
        $affected = Barang::where('id_barang', $id)->update([
            'nama_barang' => $request->Nama_Barang,
            'stok'        => $request->Stok,
            'satuan'      => $request->Satuan
        ]);

        if ($affected === 0) {
            return response()->json(['success' => false, 'message' => 'Barang tidak ditemukan!'], 404);
        }

        return response()->json(['success' => true, 'message' => 'Barang berhasil diupdate!'], 200);
    }

    // 4. DELETE: Hapus Barang
    public function destroy($id)
    {
        try {
            // Niatnya ngehapus barang
            $affected = Barang::where('id_barang', $id)->delete();

            if ($affected === 0) {
                return response()->json(['success' => false, 'message' => 'Barang tidak ditemukan!'], 404);
            }

            return response()->json(['success' => true, 'message' => 'Barang berhasil dihapus!'], 200);

        } catch (\Illuminate\Database\QueryException $e) {
            // Kalau Oracle ngamuk karena barangnya masih dipakai di transaksi
            return response()->json([
                'success' => false, 
                'message' => 'Gagal! Barang tidak bisa dihapus karena masih memiliki riwayat transaksi di gudang.'
            ], 400); // 400 = Bad Request (bukan 500 lagi)
        }
    }
}