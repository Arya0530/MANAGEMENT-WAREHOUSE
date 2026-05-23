<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ReportService;
use Illuminate\Http\Request;

class AlertController extends Controller
{
    /**
     * Issue #3: Barang menipis sekarang pakai <= 10% Kapasitas_Max
     * Parameter threshold tetap diterima tapi tidak dipakai untuk filter utama.
     */
    public function lowStock(Request $request)
    {
        $items = ReportService::lowStock();

        return response()->json([
            'success' => true,
            'threshold' => '10% Kapasitas',
            'data' => $items,
        ], 200);
    }
}
