<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ReportService;
use Illuminate\Http\Request;

class AnalyticsController extends Controller
{
    public function summary(Request $request)
    {
        $days = (int) $request->query('days', 30);
        $summary = ReportService::analyticsSummary($days);

        return response()->json([
            'success' => true,
            'data' => $summary,
        ], 200);
    }
}
