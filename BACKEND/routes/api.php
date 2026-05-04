<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BarangController;
use App\Http\Controllers\Api\TransaksiController;
use App\Http\Controllers\Api\SupplierController;
use App\Http\Controllers\Api\AlertController;
use App\Http\Controllers\Api\AnalyticsController;
use App\Http\Controllers\Api\ReportController;

// AUTH
Route::post('/login', [AuthController::class, 'login']);

// MASTER BARANG
Route::get('/barang', [BarangController::class, 'index']);
Route::post('/barang', [BarangController::class, 'store']);
Route::put('/barang/{id}', [BarangController::class, 'update']);
Route::delete('/barang/{id}', [BarangController::class, 'destroy']);

// KATEGORI
Route::get('/kategori', function() { 
    return response()->json([
        'data' => \App\Models\Kategori::orderBy('ID_Kategori', 'asc')->get()
    ]); 
});

// SUPPLIER
Route::get('/supplier', [SupplierController::class, 'index']);
Route::post('/supplier', [SupplierController::class, 'store']);
Route::delete('/supplier/{id}', [SupplierController::class, 'destroy']);

// RIWAYAT
Route::get('/riwayat', [TransaksiController::class, 'riwayat']);

// ALERTS
Route::get('/alerts/low-stock', [AlertController::class, 'lowStock']);

// ANALYTICS
Route::get('/analytics/summary', [AnalyticsController::class, 'summary']);

// ==========================
// 🔽 BARANG MASUK
// ==========================
Route::post('/barang-masuk', [TransaksiController::class, 'masuk']);
Route::get('/barang-masuk/pending', [TransaksiController::class, 'pending']);
Route::post('/approve-masuk/{id}', [TransaksiController::class, 'approveMasuk']);
Route::post('/reject-masuk/{id}', [TransaksiController::class, 'rejectMasuk']);

// ==========================
// 🔽 BARANG KELUAR
// ==========================
Route::post('/barang-keluar', [TransaksiController::class, 'keluar']);
Route::get('/pending-keluar', [TransaksiController::class, 'pendingKeluar']);
Route::post('/approve-keluar/{id}', [TransaksiController::class, 'approveKeluar']);
Route::post('/reject-keluar/{id}', [TransaksiController::class, 'rejectKeluar']);

// REPORTS (PDF)
Route::get('/reports/riwayat/pdf', [ReportController::class, 'riwayatPdf']);
Route::get('/reports/restock/pdf', [ReportController::class, 'restockPdf']);
Route::get('/reports/analytics/pdf', [ReportController::class, 'analyticsPdf']);

