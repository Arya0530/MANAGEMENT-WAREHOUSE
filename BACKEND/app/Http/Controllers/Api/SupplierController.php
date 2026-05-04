<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Services\AuditLogger;

class SupplierController extends Controller
{
    // 1. Nampilin semua supplier
    public function index() {
        $suppliers = DB::table('SUPPLIER')->orderBy('ID_Supplier', 'desc')->get();
        return response()->json(['data' => $suppliers]);
    }

    // 2. Nambah supplier baru
    public function store(Request $request) {
        $request->validate([
            'Nama_Supplier' => 'required',
            'Kontak'        => 'required',
            'Alamat'        => 'required'
        ]);

        // Bikin ID Supplier otomatis (Contoh: SUP-9182) maksimal 10 huruf
        $newId = 'SUP-' . rand(1000, 9999);

        DB::table('SUPPLIER')->insert([
            'ID_Supplier'   => $newId,
            'Nama_Supplier' => $request->Nama_Supplier,
            'Kontak'        => $request->Kontak,
            'Alamat'        => $request->Alamat
        ]);

        $pegawaiId = $request->input('ID_Pegawai') ?: $request->input('id_pegawai');
        AuditLogger::record(
            $pegawaiId,
            'Tambah Supplier: ' . $newId . ' - ' . $request->Nama_Supplier
        );

        return response()->json(['success' => true, 'message' => 'Supplier berhasil ditambahkan!']);
    }

    // 3. Hapus supplier
    public function destroy(Request $request, $id) {
        try {
            DB::table('SUPPLIER')->where('ID_Supplier', $id)->delete();
            $pegawaiId = $request->query('id_pegawai') ?: $request->input('ID_Pegawai');
            AuditLogger::record($pegawaiId, 'Hapus Supplier: ' . $id);
            return response()->json(['success' => true, 'message' => 'Supplier dihapus!']);
        } catch (\Exception $e) {
            // Kalau error, berarti suppliernya udah pernah dipakai transaksi (Foreign Key nyangkut)
            return response()->json(['success' => false, 'message' => 'Gagal! Supplier ini sudah memiliki riwayat barang masuk.'], 400);
        }
    }
}