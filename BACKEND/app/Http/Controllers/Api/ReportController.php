<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ReportService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function riwayatPdf(Request $request)
    {
        $role = $request->query('role');
        $pegawaiId = $request->query('id_pegawai');
        $rows = ReportService::riwayat($role, $pegawaiId);

        $pdf = Pdf::loadView('reports.riwayat', [
            'rows' => $rows,
            'generatedAt' => now(),
        ]);

        return $pdf->download('laporan_riwayat.pdf');
    }

    public function restockPdf(Request $request)
    {
        $threshold = (int) $request->query('threshold', 5);
        $items = ReportService::lowStock($threshold);

        $pdf = Pdf::loadView('reports.restock', [
            'items' => $items,
            'threshold' => $threshold,
            'generatedAt' => now(),
        ]);

        return $pdf->download('laporan_restock.pdf');
    }

    public function analyticsPdf(Request $request)
    {
        $days = (int) $request->query('days', 30);
        $summary = ReportService::analyticsSummary($days);

        $pdf = Pdf::loadView('reports.analytics', [
            'summary' => $summary,
            'generatedAt' => now(),
        ]);

        return $pdf->download('laporan_analytics.pdf');
    }
}
