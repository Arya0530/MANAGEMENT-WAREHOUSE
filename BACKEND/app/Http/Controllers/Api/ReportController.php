<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ReportService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    private function pdfResponse(string $view, array $data, string $filename)
    {
        $pdf = Pdf::loadView($view, $data)->setPaper('a4');

        return response()->streamDownload(function () use ($pdf) {
            echo $pdf->output();
        }, $filename, [
            'Content-Type' => 'application/pdf',
        ]);
    }

    public function riwayatPdf(Request $request)
    {
        $role = $request->query('role');
        $pegawaiId = $request->query('id_pegawai');
        $rows = ReportService::riwayat($role, $pegawaiId);

        return $this->pdfResponse('reports.riwayat', [
            'rows' => $rows,
            'generatedAt' => now(),
        ], 'laporan_riwayat.pdf');
    }

    public function restockPdf(Request $request)
    {
        $threshold = (int) $request->query('threshold', 5);
        $items = ReportService::lowStock($threshold);

        return $this->pdfResponse('reports.restock', [
            'items' => $items,
            'threshold' => $threshold,
            'generatedAt' => now(),
        ], 'laporan_restock.pdf');
    }

    public function analyticsPdf(Request $request)
    {
        $days = (int) $request->query('days', 30);
        $summary = ReportService::analyticsSummary($days);

        return $this->pdfResponse('reports.analytics', [
            'summary' => $summary,
            'generatedAt' => now(),
        ], 'laporan_analytics.pdf');
    }
}
