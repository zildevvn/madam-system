<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Expense;
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

        // Calculate Expenses for the same period
        $expenseQuery = Expense::query();
        switch ($period) {
            case 'week':
                if ($startDate && $endDate) {
                    $expenseQuery->whereBetween('date', [$startDate, $endDate]);
                } else {
                    $expenseQuery->whereBetween('date', [$referenceDate->copy()->startOfWeek()->toDateString(), $referenceDate->copy()->endOfWeek()->toDateString()]);
                }
                break;
            case 'month':
                $expenseQuery->whereMonth('date', $referenceDate->month)
                             ->whereYear('date', $referenceDate->year);
                break;
            case 'year':
                $expenseQuery->whereYear('date', $referenceDate->year);
                break;
            case 'day':
            default:
                $expenseQuery->whereDate('date', $referenceDate->toDateString());
                break;
        }

        $expenseStats = $expenseQuery->selectRaw("
            COALESCE(SUM(amount), 0) as total_expenses,
            COALESCE(SUM(CASE WHEN type = 'fixed' THEN amount ELSE 0 END), 0) as fixed_expenses,
            COALESCE(SUM(CASE WHEN type = 'variable' THEN amount ELSE 0 END), 0) as variable_expenses
        ")->first();

        return [
            'total_revenue' => (float)$stats->total_revenue,
            'total_orders' => (int)$stats->total_orders,
            'individual_orders' => (int)$stats->individual_orders,
            'group_orders' => (int)$stats->group_orders,
            'total_expenses' => (float)$expenseStats->total_expenses,
            'fixed_expenses' => (float)$expenseStats->fixed_expenses,
            'variable_expenses' => (float)$expenseStats->variable_expenses,
            // [WHY] Specialized operational metrics and itemized lists requested by the user.
            'fixed_expenses_month' => (float)Expense::where('type', 'fixed')->whereMonth('date', now()->month)->whereYear('date', now()->year)->sum('amount'),
            'variable_expenses_day' => (float)Expense::where('type', 'variable')->whereDate('date', now()->toDateString())->sum('amount'),
            'fixed_items_month' => Expense::where('type', 'fixed')->whereMonth('date', now()->month)->whereYear('date', now()->year)->orderBy('date', 'desc')->get(),
            'variable_items_day' => Expense::where('type', 'variable')->whereDate('date', now()->toDateString())->orderBy('created_at', 'desc')->get(),
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
