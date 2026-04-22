<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Services\StatsService;
use Illuminate\Http\Request;

class StatsController extends Controller
{
    protected $statsService;

    public function __construct(StatsService $statsService)
    {
        $this->statsService = $statsService;
    }

    /**
     * todayRevenue
     * [WHY] Returns the total revenue for the current day to be displayed on the Admin dash.
     */
    public function todayRevenue()
    {
        $revenue = $this->statsService->getTodayRevenue();

        return response()->json([
            'data' => [
                'revenue' => $revenue
            ],
            'message' => 'Success',
            'errors' => null
        ]);
    }

    /**
     * revenueReport
     * [WHY] Returns a comprehensive revenue report for the selected period.
     */
    public function revenueReport(Request $request)
    {
        $period = $request->query('period', 'day');
        $date = $request->query('date');
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');
        
        $report = $this->statsService->getRevenueReport($period, $date, $startDate, $endDate);

        return response()->json([
            'data' => $report,
            'message' => 'Success',
            'errors' => null
        ]);
    }
}
