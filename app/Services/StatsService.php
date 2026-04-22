<?php

namespace App\Services;

use App\Models\Order;
use Illuminate\Support\Facades\DB;

class StatsService
{
    /**
     * getRevenueReport
     * [WHY] Aggregates revenue and order counts for a specific period with segmentation.
     * [RULE] Periods supported: day, week, month, year.
     */
    public function getRevenueReport($period = 'day', $date = null, $startDate = null, $endDate = null)
    {
        $query = Order::where('status', 'completed');
        $referenceDate = $date ? \Illuminate\Support\Carbon::parse($date) : now();

        switch ($period) {
            case 'week':
                if ($startDate && $endDate) {
                    $query->whereBetween('updated_at', [
                        \Illuminate\Support\Carbon::parse($startDate)->startOfDay(),
                        \Illuminate\Support\Carbon::parse($endDate)->endOfDay()
                    ]);
                } else {
                    $query->whereBetween('updated_at', [$referenceDate->copy()->startOfWeek(), $referenceDate->copy()->endOfWeek()]);
                }
                break;
            case 'month':
                $query->whereMonth('updated_at', $referenceDate->month)
                      ->whereYear('updated_at', $referenceDate->year);
                break;
            case 'year':
                $query->whereYear('updated_at', $referenceDate->year);
                break;
            case 'day':
            default:
                $query->whereDate('updated_at', $referenceDate->toDateString());
                break;
        }

        $totalRevenue = (clone $query)->sum('total_price');
        $totalOrders = (clone $query)->count();

        $individualOrders = (clone $query)->where(function($q) {
            $q->whereNull('reservation_id')
              ->orWhereHas('reservation', function($sub) {
                  $sub->where('type', 'individual');
              });
        })->count();

        $groupOrders = (clone $query)->whereHas('reservation', function($q) {
            $q->where('type', 'group');
        })->count();

        return [
            'total_revenue' => (float)$totalRevenue,
            'total_orders' => $totalOrders,
            'individual_orders' => $individualOrders,
            'group_orders' => $groupOrders,
            'period' => $period
        ];
    }

    /**
     * getTodayRevenue
     * [WHY] Quick fetch for the dashboard summary.
     */
    public function getTodayRevenue()
    {
        return Order::where('status', 'completed')
            ->whereDate('updated_at', now()->toDateString())
            ->sum('total_price');
    }
}
