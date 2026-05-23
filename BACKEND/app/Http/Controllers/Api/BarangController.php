<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Barang;
use App\Services\AuditLogger;

class BarangController extends Controller
{
    // 1. READ: Tampil Semua Barang (Udah ada dari sebelumnya)
public function index()
    {
        // JANGAN pake Barang::all(). Kita paksa Oracle ngeluarin SEMUA kolom aslinya!
        $barang = \Illuminate\Support\Facades\DB::table('BARANG')->get();
        return response()->json(['success' => true, 'data' => $barang], 200);
    }

    // 2. CREATE: Tambah Barang Baru (VERSI TEMBAK PAKSA BYPASS ELOQUENT)
    public function store(Request $request) {
        // Gw hapus validasi regex-nya biar lu bebas masukin angka/simbol di nama barang
        $request->validate([
            'ID_Kategori'   => 'required',
            'Nama_Barang'   => 'required', 
            'Stok'          => 'required|numeric|min:0',
            'Satuan'        => 'required',
            'Batas_Minimum' => 'required|numeric', 
            'Kapasitas_Max' => 'required|numeric',
            'ID_Supplier'   => 'required'  
        ]);

        $idOtomatis = 'BRG-' . rand(1000, 9999);

        try {
            // TEMBAK LANGSUNG KE ORACLE PAKE HURUF BESAR
            \Illuminate\Support\Facades\DB::table('BARANG')->insert([
                'ID_BARANG'     => $idOtomatis,
                'ID_KATEGORI'   => $request->ID_Kategori,
                'NAMA_BARANG'   => $request->Nama_Barang,
                'STOK'          => $request->Stok,
                'SATUAN'        => $request->Satuan,
                'BATAS_MINIMUM' => $request->Batas_Minimum, 
                'KAPASITAS_MAX' => $request->Kapasitas_Max,
                'ID_SUPPLIER'   => $request->ID_Supplier
            ]);

            $pegawaiId = $request->input('ID_Pegawai') ?: $request->input('id_pegawai');
            AuditLogger::record(
                $pegawaiId,
                'Tambah Barang: ' . $idOtomatis . ' - ' . $request->Nama_Barang
            );

            return response()->json(['success' => true, 'message' => '✅ Barang berhasil ditambahkan ke Gudang!'], 201);

        } catch (\Exception $e) {
            // Jaga-jaga kalau Oracle lu mintanya huruf kecil
            try {
                \Illuminate\Support\Facades\DB::table('BARANG')->insert([
                    'id_barang'     => $idOtomatis,
                    'id_kategori'   => $request->ID_Kategori,
                    'nama_barang'   => $request->Nama_Barang,
                    'stok'          => $request->Stok,
                    'satuan'        => $request->Satuan,
                    'batas_minimum' => $request->Batas_Minimum,
                    'kapasitas_max' => $request->Kapasitas_Max,
                    'id_supplier'   => $request->ID_Supplier
                ]);
                $pegawaiId = $request->input('ID_Pegawai') ?: $request->input('id_pegawai');
                AuditLogger::record(
                    $pegawaiId,
                    'Tambah Barang: ' . $idOtomatis . ' - ' . $request->Nama_Barang
                );

                return response()->json(['success' => true, 'message' => '✅ Barang berhasil ditambahkan ke Gudang!'], 201);
            } catch (\Exception $e2) {
                // Kalau beneran error DB, error aslinya bakal dikirim ke React biar lu tau
                return response()->json(['success' => false, 'message' => 'ORACLE ERROR: ' . $e2->getMessage()], 500);
            }
        }
    }
    public function update(Request $request, $id)
    {
        try {
            // Tangkap datanya paksa pake input(), ubah jadi integer biar Oracle ga rewel
            $bMin = (int) $request->input('Batas_Minimum');
            $kMax = (int) $request->input('Kapasitas_Max');

            $affected = \Illuminate\Support\Facades\DB::table('BARANG')
                ->where('ID_BARANG', $id)
                ->update([
                    'NAMA_BARANG'   => $request->input('Nama_Barang'),
                    'STOK'          => $request->input('Stok'),
                    'SATUAN'        => $request->input('Satuan'),
                    'BATAS_MINIMUM' => $bMin,
                    'KAPASITAS_MAX' => $kMax
                ]);

            // Fallback kalau Oracle lu sensitif huruf kecil
            if ($affected === 0) {
                $affected = \Illuminate\Support\Facades\DB::table('BARANG')
                    ->where('id_barang', $id)
                    ->update([
                        'nama_barang'   => $request->input('Nama_Barang'),
                        'stok'          => $request->input('Stok'),
                        'satuan'        => $request->input('Satuan'),
                        'batas_minimum' => $bMin,
                        'kapasitas_max' => $kMax
                    ]);
            }

            if ($affected === 0) {
                return response()->json(['success' => false, 'message' => 'Gagal nemu ID Barang!'], 404);
            }

            $pegawaiId = $request->input('ID_Pegawai') ?: $request->input('id_pegawai');
            AuditLogger::record(
                $pegawaiId,
                'Edit Barang: ' . $id
            );

            return response()->json(['success' => true, 'message' => 'Berhasil diupdate paksa!'], 200);

        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'ORACLE NGAMUK: ' . $e->getMessage()], 500);
        }
    }

    // 4. DELETE: Hapus Barang
    public function destroy(Request $request, $id)
    {
        try {
            // Niatnya ngehapus barang
            $affected = Barang::where('id_barang', $id)->delete();

            if ($affected === 0) {
                return response()->json(['success' => false, 'message' => 'Barang tidak ditemukan!'], 404);
            }

            $pegawaiId = $request->query('id_pegawai') ?: $request->input('ID_Pegawai');
            AuditLogger::record($pegawaiId, 'Hapus Barang: ' . $id);

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