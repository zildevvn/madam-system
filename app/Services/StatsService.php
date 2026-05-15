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

        $fixedExpenses = (float) (clone $fixedQuery)->sum('amount');
        $variableExpenses = (float) (clone $variableQuery)->sum('amount');

        // 3. Item Statistics (Top & Bottom Sellers)
        $subQuery = DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->where('orders.status', 'completed')
            ->select('order_items.product_id', 'order_items.quantity', 'order_items.price');

        // Apply same time filters as revenue to the SUBQUERY
        switch ($period) {
            case 'week':
                if ($startDate && $endDate) {
                    $subQuery->whereBetween('orders.updated_at', [
                        \Illuminate\Support\Carbon::parse($startDate)->startOfDay(),
                        \Illuminate\Support\Carbon::parse($endDate)->endOfDay()
                    ]);
                } else {
                    $subQuery->whereBetween('orders.updated_at', [$referenceDate->copy()->startOfWeek(), $referenceDate->copy()->endOfWeek()]);
                }
                break;
            case 'month':
                $subQuery->whereMonth('orders.updated_at', $referenceDate->month)
                    ->whereYear('orders.updated_at', $referenceDate->year);
                break;
            case 'year':
                $subQuery->whereYear('orders.updated_at', $referenceDate->year);
                break;
            case 'day':
            default:
                $subQuery->whereDate('orders.updated_at', $referenceDate->toDateString());
                break;
        }

        $itemQuery = DB::table('products')
            ->leftJoinSub($subQuery, 'oi', function ($join) {
                $join->on('products.id', '=', 'oi.product_id');
            })
            ->select(
                'products.name',
                DB::raw('COALESCE(SUM(oi.quantity), 0) as total_quantity'),
                DB::raw('COALESCE(SUM(oi.price * oi.quantity), 0) as total_sales')
            )
            ->groupBy('products.id', 'products.name');

        $topItems = (clone $itemQuery)->orderByDesc('total_quantity')->orderBy('products.name')->limit(10)->get();
        $bottomItems = (clone $itemQuery)->orderBy('total_quantity')->orderBy('products.name')->limit(10)->get();
        $totalItemsCount = DB::table('products')->count();

        return [
            'total_revenue' => (float) $stats->total_revenue,
            'total_orders' => (int) $stats->total_orders,
            'individual_orders' => (int) $stats->individual_orders,
            'group_orders' => (int) $stats->group_orders,
            'cash_revenue' => (float) $stats->cash_revenue,
            'bank_revenue' => (float) $stats->bank_revenue,
            'card_revenue' => (float) $stats->card_revenue,
            'debt_revenue' => (float) $stats->debt_revenue,
            'total_expenses' => $fixedExpenses + $variableExpenses,
            'fixed_expenses' => $fixedExpenses,
            'variable_expenses' => $variableExpenses,
            // [WHY] Selecting only required fields as per README Rule 21.
            'fixed_items' => $fixedQuery->select('id', 'amount', 'date', 'description', 'category')->orderBy('date', 'desc')->get(),
            'variable_items' => $variableQuery->select('id', 'amount', 'date', 'description', 'category', 'created_at')->orderBy('date', 'desc')->get(),
            'top_items' => $topItems,
            'bottom_items' => $bottomItems,
            'total_items_count' => $totalItemsCount,
            // [RULE] Legacy values kept for backward compatibility with older components if any.
            'fixed_expenses_month' => (float) Expense::where('type', 'fixed')->whereMonth('date', now()->month)->whereYear('date', now()->year)->sum('amount'),
            'variable_expenses_day' => (float) Expense::where('type', 'variable')->whereDate('date', now()->toDateString())->sum('amount'),
            'period' => $period
        ];
    }

    public function getItemSalesStats($period = 'day', $date = null, $startDate = null, $endDate = null, $type = 'top')
    {
        $referenceDate = $date ? \Illuminate\Support\Carbon::parse($date) : now();

        $subQuery = DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->where('orders.status', 'completed')
            ->select('order_items.product_id', 'order_items.quantity', 'order_items.price');

        switch ($period) {
            case 'week':
                if ($startDate && $endDate) {
                    $subQuery->whereBetween('orders.updated_at', [
                        \Illuminate\Support\Carbon::parse($startDate)->startOfDay(),
                        \Illuminate\Support\Carbon::parse($endDate)->endOfDay()
                    ]);
                } else {
                    $subQuery->whereBetween('orders.updated_at', [$referenceDate->copy()->startOfWeek(), $referenceDate->copy()->endOfWeek()]);
                }
                break;
            case 'month':
                $subQuery->whereMonth('orders.updated_at', $referenceDate->month)
                    ->whereYear('orders.updated_at', $referenceDate->year);
                break;
            case 'year':
                $subQuery->whereYear('orders.updated_at', $referenceDate->year);
                break;
            case 'day':
            default:
                $subQuery->whereDate('orders.updated_at', $referenceDate->toDateString());
                break;
        }

        $itemQuery = DB::table('products')
            ->leftJoinSub($subQuery, 'oi', function ($join) {
                $join->on('products.id', '=', 'oi.product_id');
            })
            ->select(
                'products.name',
                DB::raw('COALESCE(SUM(oi.quantity), 0) as total_quantity'),
                DB::raw('COALESCE(SUM(oi.price * oi.quantity), 0) as total_sales')
            )
            ->groupBy('products.id', 'products.name');

        if ($type === 'bottom') {
            $itemQuery->orderBy('total_quantity', 'asc');
        } else {
            $itemQuery->orderBy('total_quantity', 'desc');
        }

        return $itemQuery->orderBy('products.name')->get();
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
