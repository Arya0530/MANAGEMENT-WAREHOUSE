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

        $qtyMasuk = (int) $request->Qty_Masuk;

        // 3. Simpan ke database
        $transaksi = BarangMasuk::create([
            'ID_Masuk'    => $idMasukOtomatis,
            'ID_Barang'   => $request->ID_Barang,
            'ID_Supplier' => $request->ID_Supplier,
            'ID_Pegawai'  => $request->ID_Pegawai,
            'Tgl_Masuk'   => now(),
            'Qty_Masuk'   => $qtyMasuk,
            'Status'      => 'PENDING'
        ]);

        $barangInfo = \Illuminate\Support\Facades\DB::table('BARANG')->where('ID_Barang', $request->ID_Barang)->first();
        $namaBarang = $barangInfo ? ($barangInfo->Nama_Barang ?? $barangInfo->nama_barang ?? $barangInfo->NAMA_BARANG) : 'Unknown';

        AuditLogger::record(
            $request->ID_Pegawai,
            'Transaksi Masuk dibuat: ' . $idMasukOtomatis . ' (Barang ' . $request->ID_Barang . ' - ' . $namaBarang . ', Qty ' . $qtyMasuk . ')'
        );

        return response()->json([
            'success' => true,
            'message' => 'Barang masuk dicatat dengan ID: ' . $idMasukOtomatis,
            'data'    => $transaksi
        ], 201);
    }

    /**
     * Issue #5: Pending keluar sekarang JOIN ke BARANG biar ada nama_barang
     */
    public function pendingKeluar()
    {
        $transaksi = \Illuminate\Support\Facades\DB::table('BARANG_KELUAR as bk')
                        ->join('BARANG as b', 'bk.ID_Barang', '=', 'b.ID_Barang')
                        ->select('bk.*', 'b.Nama_Barang as nama_barang')
                        ->where('bk.status', 'PENDING')->get();
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
            $barangInfo = \Illuminate\Support\Facades\DB::table('BARANG')->where('ID_Barang', $trx->id_barang)->first();
            $namaBarang = $barangInfo ? ($barangInfo->Nama_Barang ?? $barangInfo->nama_barang ?? $barangInfo->NAMA_BARANG) : 'Unknown';
            $pegawaiId = $request->query('id_pegawai') ?: $request->input('ID_Pegawai');
            AuditLogger::record($pegawaiId, 'Approve Barang Keluar: ' . $id . ' - ' . $namaBarang);
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
        $trx = \Illuminate\Support\Facades\DB::table('BARANG_KELUAR')->where('id_keluar', $id)->first();
        $barangInfo = $trx ? \Illuminate\Support\Facades\DB::table('BARANG')->where('ID_Barang', $trx->id_barang)->first() : null;
        $namaBarang = $barangInfo ? ($barangInfo->Nama_Barang ?? $barangInfo->nama_barang ?? $barangInfo->NAMA_BARANG) : 'Unknown';
        $pegawaiId = $request->query('id_pegawai') ?: $request->input('ID_Pegawai');
        AuditLogger::record($pegawaiId, 'Reject Barang Keluar: ' . $id . ' - ' . $namaBarang);
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
   
    /**
     * Issue #6: Input Barang Keluar sekarang VALIDASI STOK dulu.
     * Kalau Qty_Keluar > Stok barang, langsung DITOLAK.
     */
    public function keluar(Request $request)
    {
        $request->validate([
            'ID_Barang'  => 'required',
            'Qty_Keluar' => 'required|numeric|min:1',
            'Tujuan'     => 'required'
        ]);

        // Issue #6: CEK STOK DULU SEBELUM INPUT!
        $barang = \Illuminate\Support\Facades\DB::table('BARANG')
            ->where('ID_Barang', $request->ID_Barang)
            ->first();

        if (!$barang) {
            return response()->json([
                'success' => false,
                'message' => 'Barang tidak ditemukan di database!'
            ], 404);
        }

        $stokSekarang = (int) ($barang->Stok ?? $barang->stok ?? $barang->STOK ?? 0);
        $qtyKeluar = (int) $request->Qty_Keluar;

        if ($qtyKeluar > $stokSekarang) {
            return response()->json([
                'success' => false,
                'message' => "Qty keluar ($qtyKeluar) melebihi stok tersedia ($stokSekarang)! Tidak bisa diproses."
            ], 422);
        }

        $idKeluarOtomatis = 'OUT-' . date('ymd') . '-' . rand(1000, 9999);

        try {
            \Illuminate\Support\Facades\DB::table('BARANG_KELUAR')->insert([
                'ID_Keluar'  => $idKeluarOtomatis,
                'ID_Barang'  => $request->ID_Barang,
                'Qty_Keluar' => $qtyKeluar,
                'Tujuan'     => $request->Tujuan,
                'ID_Pegawai' => $request->ID_Pegawai,
                'Tgl_Keluar' => now(),
                'Status'     => 'PENDING' // <-- Ditahan SPV
            ]);

            $namaBarang = $barang->Nama_Barang ?? $barang->nama_barang ?? $barang->NAMA_BARANG ?? 'Unknown';
            AuditLogger::record(
                $request->ID_Pegawai,
                'Transaksi Keluar dibuat: ' . $idKeluarOtomatis . ' (Barang ' . $request->ID_Barang . ' - ' . $namaBarang . ', Qty ' . $qtyKeluar . ')'
            );

            return response()->json(['success' => true, 'message' => 'Permintaan Barang Keluar dicatat! Menunggu persetujuan SPV.'], 200);

        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Gagal nyimpen: ' . $e->getMessage()], 500);
        }
    }
    // ==========================================
    // FUNGSI ANTREAN & APPROVAL BARANG MASUK
    // ==========================================

    /**
     * Issue #5: Pending masuk sekarang JOIN ke BARANG biar ada nama_barang
     */
    public function pending()
    {
        $transaksi = \Illuminate\Support\Facades\DB::table('BARANG_MASUK as bm')
                        ->join('BARANG as b', 'bm.ID_Barang', '=', 'b.ID_Barang')
                        ->select('bm.*', 'b.Nama_Barang as nama_barang')
                        ->where('bm.status', 'PENDING')->get();
        return response()->json(['success' => true, 'data' => $transaksi], 200);
    }

    // 2. APPROVE Barang Masuk (Nambah Stok)
    public function approveMasuk(Request $request, $id)
    {
        try {
            \Illuminate\Support\Facades\DB::beginTransaction();

            $trx = \Illuminate\Support\Facades\DB::table('BARANG_MASUK')->where('id_masuk', $id)->first();
            
            \Illuminate\Support\Facades\DB::table('BARANG_MASUK')->where('id_masuk', $id)->update(['status' => 'APPROVED']);

            // Karena ini barang masuk, stoknya NAIK (increment) — pakai qty_masuk yang benar
            $qtyMasuk = (int) ($trx->qty_masuk ?? $trx->Qty_Masuk ?? 1);
            \Illuminate\Support\Facades\DB::table('BARANG')
                ->where('ID_Barang', $trx->id_barang)
                ->increment('Stok', $qtyMasuk);

            \Illuminate\Support\Facades\DB::commit();
            $barangInfo = \Illuminate\Support\Facades\DB::table('BARANG')->where('ID_Barang', $trx->id_barang)->first();
            $namaBarang = $barangInfo ? ($barangInfo->Nama_Barang ?? $barangInfo->nama_barang ?? $barangInfo->NAMA_BARANG) : 'Unknown';
            $pegawaiId = $request->query('id_pegawai') ?: $request->input('ID_Pegawai');
            AuditLogger::record($pegawaiId, 'Approve Barang Masuk: ' . $id . ' - ' . $namaBarang);
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
        $trx = \Illuminate\Support\Facades\DB::table('BARANG_MASUK')->where('id_masuk', $id)->first();
        $barangInfo = $trx ? \Illuminate\Support\Facades\DB::table('BARANG')->where('ID_Barang', $trx->id_barang)->first() : null;
        $namaBarang = $barangInfo ? ($barangInfo->Nama_Barang ?? $barangInfo->nama_barang ?? $barangInfo->NAMA_BARANG) : 'Unknown';
        $pegawaiId = $request->query('id_pegawai') ?: $request->input('ID_Pegawai');
        AuditLogger::record($pegawaiId, 'Reject Barang Masuk: ' . $id . ' - ' . $namaBarang);
        return response()->json(['success' => true, 'message' => 'Transaksi Masuk DITOLAK!']);
    }
}
