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
                COUNT(CASE WHEN reservations.type = 'group' THEN 1 END) as group_orders,
                COALESCE(SUM(CASE WHEN orders.payment_method = 'cash' THEN orders.total_price ELSE 0 END), 0) as cash_revenue,
                COALESCE(SUM(CASE WHEN orders.payment_method = 'bank' THEN orders.total_price ELSE 0 END), 0) as bank_revenue,
                COALESCE(SUM(CASE WHEN orders.payment_method = 'card' THEN orders.total_price ELSE 0 END), 0) as card_revenue,
                COALESCE(SUM(CASE WHEN orders.payment_method = 'debt' THEN orders.total_price ELSE 0 END), 0) as debt_revenue
            ")
            ->first();

        // [RULE] Fixed expenses only respond to Month and Year filters.
        // [RULE] Variable expenses respond to all filters (Day, Week, Month, Year).
        
        // 1. Variable Expenses Query (Responds to all filters)
        $variableQuery = Expense::where('type', 'variable');
        switch ($period) {
            case 'week':
                if ($startDate && $endDate) {
                    $variableQuery->whereBetween('date', [$startDate, $endDate]);
                } else {
                    $variableQuery->whereBetween('date', [$referenceDate->copy()->startOfWeek()->toDateString(), $referenceDate->copy()->endOfWeek()->toDateString()]);
                }
                break;
            case 'month':
                $variableQuery->whereMonth('date', $referenceDate->month)
                              ->whereYear('date', $referenceDate->year);
                break;
            case 'year':
                $variableQuery->whereYear('date', $referenceDate->year);
                break;
            case 'day':
            default:
                $variableQuery->whereDate('date', $referenceDate->toDateString());
                break;
        }

        // 2. Fixed Expenses Query (Responds to all filters)
        $fixedQuery = Expense::where('type', 'fixed');
        switch ($period) {
            case 'week':
                if ($startDate && $endDate) {
                    $fixedQuery->whereBetween('date', [$startDate, $endDate]);
                } else {
                    $fixedQuery->whereBetween('date', [$referenceDate->copy()->startOfWeek()->toDateString(), $referenceDate->copy()->endOfWeek()->toDateString()]);
                }
                break;
            case 'month':
                $fixedQuery->whereMonth('date', $referenceDate->month)
                           ->whereYear('date', $referenceDate->year);
                break;
            case 'year':
                $fixedQuery->whereYear('date', $referenceDate->year);
                break;
            case 'day':
            default:
                $fixedQuery->whereDate('date', $referenceDate->toDateString());
                break;
        }

        $fixedExpenses = (float)(clone $fixedQuery)->sum('amount');
        $variableExpenses = (float)(clone $variableQuery)->sum('amount');

        return [
            'total_revenue' => (float)$stats->total_revenue,
            'total_orders' => (int)$stats->total_orders,
            'individual_orders' => (int)$stats->individual_orders,
            'group_orders' => (int)$stats->group_orders,
            'cash_revenue' => (float)$stats->cash_revenue,
            'bank_revenue' => (float)$stats->bank_revenue,
            'card_revenue' => (float)$stats->card_revenue,
            'debt_revenue' => (float)$stats->debt_revenue,
            'total_expenses' => $fixedExpenses + $variableExpenses,
            'fixed_expenses' => $fixedExpenses,
            'variable_expenses' => $variableExpenses,
            'fixed_items' => $fixedQuery->orderBy('date', 'desc')->get(),
            'variable_items' => $variableQuery->orderBy('date', 'desc')->get(),
            // [RULE] Keep legacy values for backward compatibility
            'fixed_expenses_month' => (float)Expense::where('type', 'fixed')->whereMonth('date', now()->month)->whereYear('date', now()->year)->sum('amount'),
            'variable_expenses_day' => (float)Expense::where('type', 'variable')->whereDate('date', now()->toDateString())->sum('amount'),
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
