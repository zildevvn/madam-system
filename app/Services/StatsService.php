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
        $query = Order::where('orders.status', 'completed');
        $referenceDate = $date ? \Illuminate\Support\Carbon::parse($date) : now();

        switch ($period) {
            case 'week':
                if ($startDate && $endDate) {
                    $query->whereBetween('orders.updated_at', [
                        \Illuminate\Support\Carbon::parse($startDate)->startOfDay(),
                        \Illuminate\Support\Carbon::parse($endDate)->endOfDay()
                    ]);
                } else {
                    $query->whereBetween('orders.updated_at', [$referenceDate->copy()->startOfWeek(), $referenceDate->copy()->endOfWeek()]);
                }
                break;
            case 'month':
                $query->whereMonth('orders.updated_at', $referenceDate->month)
                      ->whereYear('orders.updated_at', $referenceDate->year);
                break;
            case 'year':
                $query->whereYear('orders.updated_at', $referenceDate->year);
                break;
            case 'day':
            default:
                $query->whereDate('orders.updated_at', $referenceDate->toDateString());
                break;
        }

        $stats = $query->leftJoin('reservations', 'orders.reservation_id', '=', 'reservations.id')
            ->selectRaw("
                COALESCE(SUM(orders.total_price), 0) as total_revenue,
                COUNT(orders.id) as total_orders,
                COUNT(CASE WHEN orders.reservation_id IS NULL OR reservations.type = 'individual' THEN 1 END) as individual_orders,
                COUNT(CASE WHEN reservations.type = 'group' THEN 1 END) as group_orders
            ")
            ->first();

        return [
            'total_revenue' => (float)$stats->total_revenue,
            'total_orders' => (int)$stats->total_orders,
            'individual_orders' => (int)$stats->individual_orders,
            'group_orders' => (int)$stats->group_orders,
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
