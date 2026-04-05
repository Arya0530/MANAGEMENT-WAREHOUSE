<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\BarangMasuk;

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

        // 3. Simpan ke database Oracle
        $transaksi = BarangMasuk::create([
            'ID_Masuk'    => $idMasukOtomatis,
            'ID_Barang'   => $request->ID_Barang,
            'ID_Supplier' => $request->ID_Supplier,
            'ID_Pegawai'  => $request->ID_Pegawai,
            'Tgl_Masuk'   => now(), // <-- INI TANGGALNYA, OTOMATIS DARI SERVER!
            'Qty_Masuk'   => $request->Qty_Masuk,
            'Status'      => 'PENDING'
        ]);

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
    public function approveKeluar($id)
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
            return response()->json(['success' => true, 'message' => 'Barang Keluar di-Approve & Stok terpotong!']);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Gagal: ' . $e->getMessage()]);
        }
    }

    // 3. REJECT Barang Keluar
    public function rejectKeluar($id)
    {
        \Illuminate\Support\Facades\DB::table('BARANG_KELUAR')->where('id_keluar', $id)->update(['status' => 'REJECTED']);
        return response()->json(['success' => true, 'message' => 'Transaksi Keluar DITOLAK!']);
    }

    // 4. Update RIWAYAT (Gabungin Masuk & Keluar buat Audit Trail)
    public function riwayat()
    {
        $masuk = \Illuminate\Support\Facades\DB::table('BARANG_MASUK')
                    ->select('id_masuk as id', 'tgl_masuk as tanggal', 'id_barang', 'qty_masuk as qty', 'status', \Illuminate\Support\Facades\DB::raw("'Barang Masuk' as jenis"));
        
        $riwayat = \Illuminate\Support\Facades\DB::table('BARANG_KELUAR')
                    ->select('id_keluar as id', 'tgl_keluar as tanggal', 'id_barang', 'qty_keluar as qty', 'status', \Illuminate\Support\Facades\DB::raw("'Barang Keluar' as jenis"))
                    ->union($masuk)
                    ->orderBy('tanggal', 'desc')
                    ->get();

        return response()->json(['success' => true, 'data' => $riwayat], 200);
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

            return response()->json(['success' => true, 'message' => 'Permintaan Barang Keluar dicatat! Menunggu persetujuan SPV.'], 200);

        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Gagal nyimpen: ' . $e->getMessage()], 500);
        }
    }
    
} // <--- Ini kurung kurawal penutup file (class) lu
