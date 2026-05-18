<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\BarangMasuk;
use App\Services\AuditLogger;
use App\Services\ReportService;

class TransaksiController extends Controller
{
    // Fungsi Input Barang (Status PENDING)
    public function masuk(Request $request)
    {
        // 1. Validasi (ID_Masuk dihapus dari validasi karena nggak dikirim dari React lagi)
        $request->validate([
            'ID_Barang'   => 'required',
            'ID_Supplier' => 'required',
            'ID_Pegawai'  => 'required',
            'Qty_Masuk'   => 'required|numeric|min:1'
        ]);

        // 2. Bikin ID Transaksi Otomatis (Contoh: TRX-20260405-1234)
        $idMasukOtomatis = 'TRX-' . date('ymd') . '-' . rand(1000, 9999);

        $qtyMasuk = 1;

        // 3. Simpan ke database Oracle
        $transaksi = BarangMasuk::create([
            'ID_Masuk'    => $idMasukOtomatis,
            'ID_Barang'   => $request->ID_Barang,
            'ID_Supplier' => $request->ID_Supplier,
            'ID_Pegawai'  => $request->ID_Pegawai,
            'Tgl_Masuk'   => now(), // <-- INI TANGGALNYA, OTOMATIS DARI SERVER!
            'Qty_Masuk'   => $qtyMasuk,
            'Status'      => 'PENDING'
        ]);

        AuditLogger::record(
            $request->ID_Pegawai,
            'Transaksi Masuk dibuat: ' . $idMasukOtomatis . ' (Barang ' . $request->ID_Barang . ', Qty ' . $qtyMasuk . ')'
        );

        return response()->json([
            'success' => true,
            'message' => 'Barang masuk dicatat dengan ID: ' . $idMasukOtomatis,
            'data'    => $transaksi
        ], 201);
    }

    // Fungsi narik data pending buat Supervisor
 // 1. Narik data barang keluar yang masih PENDING buat SPV
    public function pendingKeluar()
    {
        $transaksi = \Illuminate\Support\Facades\DB::table('BARANG_KELUAR')
                        ->where('status', 'PENDING')->get();
        return response()->json(['success' => true, 'data' => $transaksi], 200);
    }

    // 2. APPROVE Barang Keluar (Di sini stok baru dipotong!)
    public function approveKeluar(Request $request, $id)
    {
        try {
            \Illuminate\Support\Facades\DB::beginTransaction();

            // Ambil data transaksi buat tau ID_Barang dan Qty-nya
            $trx = \Illuminate\Support\Facades\DB::table('BARANG_KELUAR')->where('id_keluar', $id)->first();

            // Update status jadi APPROVED
            \Illuminate\Support\Facades\DB::table('BARANG_KELUAR')->where('id_keluar', $id)->update(['status' => 'APPROVED']);

            // POTONG STOK SEKARANG!
            \Illuminate\Support\Facades\DB::table('BARANG')
                ->where('ID_Barang', $trx->id_barang)
                ->decrement('Stok', $trx->qty_keluar);

            \Illuminate\Support\Facades\DB::commit();
            $pegawaiId = $request->query('id_pegawai') ?: $request->input('ID_Pegawai');
            AuditLogger::record($pegawaiId, 'Approve Barang Keluar: ' . $id);
            return response()->json(['success' => true, 'message' => 'Barang Keluar di-Approve & Stok terpotong!']);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Gagal: ' . $e->getMessage()]);
        }
    }

    // 3. REJECT Barang Keluar
    public function rejectKeluar(Request $request, $id)
    {
        \Illuminate\Support\Facades\DB::table('BARANG_KELUAR')->where('id_keluar', $id)->update(['status' => 'REJECTED']);
        $pegawaiId = $request->query('id_pegawai') ?: $request->input('ID_Pegawai');
        AuditLogger::record($pegawaiId, 'Reject Barang Keluar: ' . $id);
        return response()->json(['success' => true, 'message' => 'Transaksi Keluar DITOLAK!']);
    }

 // 4. Update RIWAYAT (Diakalin gabunginnya di Laravel, BUKAN di Oracle biar ga meledak)
   public function riwayat(Request $request)
    {
        try {
            $role = $request->query('role');
            $idPegawai = $request->query('id_pegawai');

            $riwayat = ReportService::riwayat($role, $idPegawai);

            return response()->json(['success' => true, 'data' => $riwayat], 200);

        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Oracle Error: ' . $e->getMessage()], 500);
        }
    }
   
    // Fungsi Input Barang Keluar (Status PENDING SPV)
    public function keluar(Request $request)
    {
        $request->validate([
            'ID_Barang'  => 'required',
            'Qty_Keluar' => 'required|numeric|min:1',
            'Tujuan'     => 'required'
        ]);

        $idKeluarOtomatis = 'OUT-' . date('ymd') . '-' . rand(1000, 9999);

        try {
            \Illuminate\Support\Facades\DB::table('BARANG_KELUAR')->insert([
                'ID_Keluar'  => $idKeluarOtomatis,
                'ID_Barang'  => $request->ID_Barang,
                'Qty_Keluar' => $request->Qty_Keluar,
                'Tujuan'     => $request->Tujuan,
                'ID_Pegawai' => $request->ID_Pegawai,
                'Tgl_Keluar' => now(),
                'Status'     => 'PENDING' // <-- Ditahan SPV
            ]);

            AuditLogger::record(
                $request->ID_Pegawai,
                'Transaksi Keluar dibuat: ' . $idKeluarOtomatis . ' (Barang ' . $request->ID_Barang . ', Qty ' . $request->Qty_Keluar . ')'
            );

            return response()->json(['success' => true, 'message' => 'Permintaan Barang Keluar dicatat! Menunggu persetujuan SPV.'], 200);

        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Gagal nyimpen: ' . $e->getMessage()], 500);
        }
    }
    // ==========================================
    // FUNGSI ANTREAN & APPROVAL BARANG MASUK
    // ==========================================

    // 1. Narik data barang masuk yang masih PENDING
    public function pending()
    {
        $transaksi = \Illuminate\Support\Facades\DB::table('BARANG_MASUK')
                        ->where('status', 'PENDING')->get();
        return response()->json(['success' => true, 'data' => $transaksi], 200);
    }

    // 2. APPROVE Barang Masuk (Nambah Stok)
    public function approveMasuk(Request $request, $id)
    {
        try {
            \Illuminate\Support\Facades\DB::beginTransaction();

            $trx = \Illuminate\Support\Facades\DB::table('BARANG_MASUK')->where('id_masuk', $id)->first();
            
            \Illuminate\Support\Facades\DB::table('BARANG_MASUK')->where('id_masuk', $id)->update(['status' => 'APPROVED']);

            // Karena ini barang masuk, stoknya NAIK (increment)
            \Illuminate\Support\Facades\DB::table('BARANG')
                ->where('ID_Barang', $trx->id_barang)
                ->increment('Stok', 1);

            \Illuminate\Support\Facades\DB::commit();
            $pegawaiId = $request->query('id_pegawai') ?: $request->input('ID_Pegawai');
            AuditLogger::record($pegawaiId, 'Approve Barang Masuk: ' . $id);
            return response()->json(['success' => true, 'message' => 'Barang Masuk di-Approve & Stok bertambah!']);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Gagal: ' . $e->getMessage()]);
        }
    }

    // 3. REJECT Barang Masuk
    public function rejectMasuk(Request $request, $id)
    {
        \Illuminate\Support\Facades\DB::table('BARANG_MASUK')->where('id_masuk', $id)->update(['status' => 'REJECTED']);
        $pegawaiId = $request->query('id_pegawai') ?: $request->input('ID_Pegawai');
        AuditLogger::record($pegawaiId, 'Reject Barang Masuk: ' . $id);
        return response()->json(['success' => true, 'message' => 'Transaksi Masuk DITOLAK!']);
    }
} // <--- Ini kurung kurawal penutup file (class) lu
