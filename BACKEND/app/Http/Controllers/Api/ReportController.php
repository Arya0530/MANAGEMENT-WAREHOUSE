<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ReportService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    /**
     * Issue #4: Semua method PDF sekarang dibungkus try-catch
     * supaya kalau error, return JSON error (bukan blank page).
     */
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
        try {
            $role = $request->query('role');
            $pegawaiId = $request->query('id_pegawai');
            $rows = ReportService::riwayat($role, $pegawaiId);

            return $this->pdfResponse('reports.riwayat', [
                'rows' => $rows,
                'generatedAt' => now(),
            ], 'laporan_riwayat.pdf');
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal generate PDF Riwayat: ' . $e->getMessage(),
            ], 500);
        }
    }


    public function analyticsPdf(Request $request)
    {
        try {
            $days = (int) $request->query('days', 30);
            $summary = ReportService::analyticsSummary($days);

            return $this->pdfResponse('reports.analytics', [
                'summary' => $summary,
                'generatedAt' => now(),
            ], 'laporan_analytics.pdf');
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal generate PDF Analytics: ' . $e->getMessage(),
            ], 500);
        }
    }
}
