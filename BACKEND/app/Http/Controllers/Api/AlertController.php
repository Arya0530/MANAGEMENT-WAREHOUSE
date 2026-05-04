<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ReportService;
use Illuminate\Http\Request;

class AlertController extends Controller
{
    public function lowStock(Request $request)
    {
        $threshold = (int) $request->query('threshold', 5);
        $items = ReportService::lowStock($threshold);

        return response()->json([
            'success' => true,
            'threshold' => $threshold,
            'data' => $items,
        ], 200);
    }
}
