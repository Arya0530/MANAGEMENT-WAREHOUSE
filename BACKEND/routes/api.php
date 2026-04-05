<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BarangController;
use App\Http\Controllers\Api\TransaksiController;

// Route untuk Auth
Route::post('/login', [AuthController::class, 'login']);

// Route Master Barang (Data Utama)
Route::get('/barang', [BarangController::class, 'index']);      // Nampilin semua barang
Route::post('/barang', [BarangController::class, 'store']);     // Nambah barang baru


// Route Transaksi (Inbound/Outbound)
Route::post('/barang-masuk', [TransaksiController::class, 'masuk']);       // Staf input barang masuk
Route::post('/approve-masuk/{id}', [TransaksiController::class, 'approve']); // Spv approve barang
Route::get('/barang-masuk/pending', [TransaksiController::class, 'pending']);
Route::post('/barang', [BarangController::class, 'store']);
Route::put('/barang/{id}', [BarangController::class, 'update']);
Route::delete('/barang/{id}', [BarangController::class, 'destroy']);
// API buat narik seluruh jejak rekam (Audit Trail)
Route::get('/riwayat-transaksi', [BarangController::class, 'riwayat']); 
// (Sesuaikan nama Controller-nya dengan yang lu pake buat transaksi)
// API buat narik semua data Kategori
// API buat narik semua data Kategori (Diurutin dari K01 ke K05)
Route::get('/kategori', function() { 
    return response()->json([
        'data' => \App\Models\Kategori::orderBy('ID_Kategori', 'asc')->get()
    ]); 
});
Route::get('/supplier', [\App\Http\Controllers\Api\SupplierController::class, 'index']);
Route::post('/supplier', [\App\Http\Controllers\Api\SupplierController::class, 'store']);
Route::delete('/supplier/{id}', [\App\Http\Controllers\Api\SupplierController::class, 'destroy']);
Route::post('/reject-masuk/{id}', [\App\Http\Controllers\Api\TransaksiController::class, 'reject']);
Route::post('/barang-keluar', [\App\Http\Controllers\Api\TransaksiController::class, 'keluar']);
Route::get('/pending-keluar', [\App\Http\Controllers\Api\TransaksiController::class, 'pendingKeluar']);
Route::post('/approve-keluar/{id}', [\App\Http\Controllers\Api\TransaksiController::class, 'approveKeluar']);
Route::post('/reject-keluar/{id}', [\App\Http\Controllers\Api\TransaksiController::class, 'rejectKeluar']);