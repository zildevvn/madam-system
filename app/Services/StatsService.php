<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Expense;
use App\Models\Reservation;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

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
        $referenceDate = $date ? Carbon::parse($date) : now();

        switch ($period) {
            case 'week':
                if ($startDate && $endDate) {
                    $query->whereBetween('orders.updated_at', [
                        Carbon::parse($startDate)->startOfDay(),
                        Carbon::parse($endDate)->endOfDay()
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
            ->where(function($q) {
                $q->whereNull('reservations.id')
                  ->orWhere('reservations.status', '!=', Reservation::STATUS_CANCELLED);
            })
            ->selectRaw("
                COALESCE(SUM(orders.total_price), 0) as total_revenue,
                
                COUNT(DISTINCT CASE 
                    WHEN reservations.type = 'group' THEN CONCAT('res_', orders.reservation_id)
                    WHEN orders.merged_tables IS NOT NULL THEN CONCAT('merge_', orders.merged_tables, '_', UNIX_TIMESTAMP(orders.updated_at))
                    ELSE orders.id 
                END) as total_orders,
                
                COUNT(DISTINCT CASE 
                    WHEN orders.reservation_id IS NULL OR reservations.type = 'individual' THEN 
                        CASE WHEN orders.merged_tables IS NOT NULL THEN CONCAT('merge_', orders.merged_tables, '_', UNIX_TIMESTAMP(orders.updated_at))
                        ELSE orders.id END
                END) as individual_orders,
                
                COUNT(DISTINCT CASE WHEN reservations.type = 'group' THEN orders.reservation_id END) as group_orders,
                
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
                        Carbon::parse($startDate)->startOfDay(),
                        Carbon::parse($endDate)->endOfDay()
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
        $referenceDate = $date ? Carbon::parse($date) : now();

        $subQuery = DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->where('orders.status', 'completed')
            ->select('order_items.product_id', 'order_items.quantity', 'order_items.price');

        switch ($period) {
            case 'week':
                if ($startDate && $endDate) {
                    $subQuery->whereBetween('orders.updated_at', [
                        Carbon::parse($startDate)->startOfDay(),
                        Carbon::parse($endDate)->endOfDay()
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

    /**
     * getEmployeePerformance
     * [WHY] Returns performance statistics for restaurant employees and sellers.
     * [RULE] Avoids double-counting and aggregation errors via optimized subqueries.
     */
    public function getEmployeePerformance($period = 'today', $startDate = null, $endDate = null)
    {
        $referenceDate = now();

        if ($startDate && $endDate) {
            $start = Carbon::parse($startDate)->startOfDay();
            $end = Carbon::parse($endDate)->endOfDay();
        } else {
            switch ($period) {
                case 'week':
                    $start = $referenceDate->copy()->startOfWeek();
                    $end = $referenceDate->copy()->endOfWeek();
                    break;
                case 'month':
                    $start = $referenceDate->copy()->startOfMonth();
                    $end = $referenceDate->copy()->endOfMonth();
                    break;
                case 'today':
                default:
                    $start = $referenceDate->copy()->startOfDay();
                    $end = $referenceDate->copy()->endOfDay();
                    break;
            }
        }

        // 1. Restaurant Employees Performance (where role !== 'seller')
        $restaurantStats = DB::table('users')
            ->where('users.role', '!=', 'seller')
            ->where('users.status', 'active')
            ->leftJoinSub(
                DB::table('orders')
                    ->where('status', 'completed')
                    ->whereBetween('updated_at', [$start, $end])
                    ->select(
                        'user_id',
                        DB::raw('COUNT(id) as orders_count'),
                        DB::raw('SUM(total_price) as total_revenue'),
                        DB::raw('SUM(guest_count) as total_guests')
                    )
                    ->groupBy('user_id'),
                'o',
                'users.id',
                '=',
                'o.user_id'
            )
            ->select(
                'users.id',
                'users.name',
                'users.email',
                'users.photo',
                'users.role',
                DB::raw('COALESCE(o.orders_count, 0) as orders_count'),
                DB::raw('COALESCE(o.total_revenue, 0) as total_revenue'),
                DB::raw('COALESCE(o.total_guests, 0) as total_guests')
            )
            ->orderByDesc('orders_count')
            ->get();

        // 2. Seller Employees Performance (where role === 'seller')
        $resItemsSub = DB::table('reservation_items')
            ->select('reservation_id', DB::raw('SUM(price * quantity) as items_revenue'))
            ->groupBy('reservation_id');

        $resSub = DB::table('reservations')
            ->where('reservations.status', '!=', Reservation::STATUS_CANCELLED)
            ->whereBetween('reservation_date', [$start->toDateString(), $end->toDateString()])
            ->leftJoinSub($resItemsSub, 'ri', 'reservations.id', '=', 'ri.reservation_id')
            ->select(
                DB::raw('COALESCE(
                    reservations.staff_id,
                    (SELECT user_id FROM reservation_histories WHERE reservation_id = reservations.id AND action = "created" LIMIT 1),
                    reservations.updated_by
                ) as seller_id'),
                DB::raw('COUNT(reservations.id) as reservations_count'),
                DB::raw('SUM(reservations.number_of_guests) as total_guests'),
                DB::raw('SUM(COALESCE(ri.items_revenue, 0)) as total_revenue')
            )
            ->groupBy(DB::raw('COALESCE(
                reservations.staff_id,
                (SELECT user_id FROM reservation_histories WHERE reservation_id = reservations.id AND action = "created" LIMIT 1),
                reservations.updated_by
            )'));

        $sellerStats = DB::table('users')
            ->leftJoinSub(
                $resSub,
                'r',
                'users.id',
                '=',
                'r.seller_id'
            )
            ->where(function ($q) {
                $q->where('users.role', '=', 'seller')
                    ->orWhere('r.reservations_count', '>', 0);
            })
            ->where('users.status', 'active')
            ->select(
                'users.id',
                'users.name',
                'users.email',
                'users.photo',
                'users.role',
                DB::raw('COALESCE(r.reservations_count, 0) as reservations_count'),
                DB::raw('COALESCE(r.total_guests, 0) as total_guests'),
                DB::raw('COALESCE(r.total_revenue, 0) as total_revenue')
            )
            ->orderByDesc('reservations_count')
            ->get();

        return [
            'restaurant' => $restaurantStats,
            'seller' => $sellerStats,
            'filter' => [
                'period' => $period,
                'start_date' => $start->toDateString(),
                'end_date' => $end->toDateString()
            ]
        ];
    }

    /**
     * getReservationStats
     * [WHY] Compiles monthly reservation revenue, top companies, and company comparisons.
     */
    public function getReservationStats($monthStr)
    {
        if (!preg_match('/^\d{4}-\d{2}$/', $monthStr)) {
            $monthStr = now()->format('Y-m');
        }

        $selectedMonthStart = Carbon::parse($monthStr . '-01')->startOfMonth();
        $selectedMonthEnd = $selectedMonthStart->copy()->endOfMonth();

        $prevMonthStart = $selectedMonthStart->copy()->subMonth()->startOfMonth();
        $prevMonthEnd = $prevMonthStart->copy()->endOfMonth();

        $selectedStartStr = $selectedMonthStart->toDateString();
        $selectedEndStr = $selectedMonthEnd->toDateString();
        $prevStartStr = $prevMonthStart->toDateString();
        $prevEndStr = $prevMonthEnd->toDateString();

        // 1. Build subquery to compute the individual revenue for each reservation
        $reservationRevenues = DB::table('reservations')
            ->leftJoin('reservation_items', 'reservations.id', '=', 'reservation_items.reservation_id')
            ->select(
                'reservations.id',
                'reservations.company_name',
                'reservations.number_of_guests',
                'reservations.reservation_date',
                'reservations.type',
                DB::raw('COALESCE(SUM(reservation_items.price * reservation_items.quantity), 0) as revenue')
            )
            ->where('reservations.status', '!=', Reservation::STATUS_CANCELLED)
            ->whereBetween('reservations.reservation_date', [$prevStartStr, $selectedEndStr])
            ->groupBy(
                'reservations.id',
                'reservations.company_name',
                'reservations.number_of_guests',
                'reservations.reservation_date',
                'reservations.type'
            );

        // 2. Query summary statistics for the selected month at database-level
        $summary = DB::query()
            ->fromSub($reservationRevenues, 'r')
            ->select(
                DB::raw("COALESCE(SUM(CASE WHEN r.reservation_date >= '{$selectedStartStr}' AND r.reservation_date <= '{$selectedEndStr}' THEN r.revenue ELSE 0 END), 0) as total_revenue"),
                DB::raw("SUM(CASE WHEN r.reservation_date >= '{$selectedStartStr}' AND r.reservation_date <= '{$selectedEndStr}' THEN 1 ELSE 0 END) as total_reservations"),
                DB::raw("COALESCE(SUM(CASE WHEN r.reservation_date >= '{$selectedStartStr}' AND r.reservation_date <= '{$selectedEndStr}' THEN r.number_of_guests ELSE 0 END), 0) as total_guests"),
                DB::raw("COUNT(DISTINCT CASE WHEN r.reservation_date >= '{$selectedStartStr}' AND r.reservation_date <= '{$selectedEndStr}' AND r.company_name IS NOT NULL AND r.company_name != '' THEN r.company_name END) as active_companies_count")
            )
            ->first();

        // 2b. Query group summary statistics for both selected and previous month
        $groupSummary = DB::query()
            ->fromSub($reservationRevenues, 'r')
            ->select(
                // Selected month
                DB::raw("COALESCE(SUM(CASE WHEN r.reservation_date >= '{$selectedStartStr}' AND r.reservation_date <= '{$selectedEndStr}' AND r.type = 'group' THEN r.revenue ELSE 0 END), 0) as total_revenue_this_month"),
                DB::raw("COALESCE(SUM(CASE WHEN r.reservation_date >= '{$selectedStartStr}' AND r.reservation_date <= '{$selectedEndStr}' AND r.type = 'group' THEN r.number_of_guests ELSE 0 END), 0) as total_guests_this_month"),
                DB::raw("COUNT(DISTINCT CASE WHEN r.reservation_date >= '{$selectedStartStr}' AND r.reservation_date <= '{$selectedEndStr}' AND r.type = 'group' AND r.company_name IS NOT NULL AND r.company_name != '' THEN r.company_name END) as active_companies_this_month"),
                DB::raw("COALESCE(SUM(CASE WHEN r.reservation_date >= '{$selectedStartStr}' AND r.reservation_date <= '{$selectedEndStr}' AND r.type = 'individual' THEN r.number_of_guests ELSE 0 END), 0) as total_individual_guests_this_month"),

                // Previous month
                DB::raw("COALESCE(SUM(CASE WHEN r.reservation_date >= '{$prevStartStr}' AND r.reservation_date <= '{$prevEndStr}' AND r.type = 'group' THEN r.revenue ELSE 0 END), 0) as total_revenue_last_month"),
                DB::raw("COALESCE(SUM(CASE WHEN r.reservation_date >= '{$prevStartStr}' AND r.reservation_date <= '{$prevEndStr}' AND r.type = 'group' THEN r.number_of_guests ELSE 0 END), 0) as total_guests_last_month"),
                DB::raw("COUNT(DISTINCT CASE WHEN r.reservation_date >= '{$prevStartStr}' AND r.reservation_date <= '{$prevEndStr}' AND r.type = 'group' AND r.company_name IS NOT NULL AND r.company_name != '' THEN r.company_name END) as active_companies_last_month"),
                DB::raw("COALESCE(SUM(CASE WHEN r.reservation_date >= '{$prevStartStr}' AND r.reservation_date <= '{$prevEndStr}' AND r.type = 'individual' THEN r.number_of_guests ELSE 0 END), 0) as total_individual_guests_last_month")
            )
            ->first();

        // Query top group company of the selected month
        $topGroupCompanyRaw = DB::query()
            ->fromSub($reservationRevenues, 'r')
            ->select(
                'r.company_name',
                DB::raw("SUM(CASE WHEN r.reservation_date >= '{$selectedStartStr}' AND r.reservation_date <= '{$selectedEndStr}' AND r.type = 'group' THEN r.revenue ELSE 0 END) as revenue"),
                DB::raw("SUM(CASE WHEN r.reservation_date >= '{$selectedStartStr}' AND r.reservation_date <= '{$selectedEndStr}' AND r.type = 'group' THEN 1 ELSE 0 END) as reservations_count"),
                DB::raw("SUM(CASE WHEN r.reservation_date >= '{$selectedStartStr}' AND r.reservation_date <= '{$selectedEndStr}' AND r.type = 'group' THEN r.number_of_guests ELSE 0 END) as guests_count")
            )
            ->whereNotNull('r.company_name')
            ->where('r.company_name', '!=', '')
            ->groupBy('r.company_name')
            ->orderByDesc('revenue')
            ->first();

        $topGroupCompany = null;
        if ($topGroupCompanyRaw && (float) $topGroupCompanyRaw->revenue > 0) {
            $topGroupCompany = [
                'company_name' => $topGroupCompanyRaw->company_name,
                'revenue' => (float) $topGroupCompanyRaw->revenue,
                'reservations_count' => (int) $topGroupCompanyRaw->reservations_count,
                'guests_count' => (int) $topGroupCompanyRaw->guests_count
            ];
        }

        // 3. Query aggregated company statistics directly at database-level
        $companyStats = DB::query()
            ->fromSub($reservationRevenues, 'r')
            ->select(
                'r.company_name',
                DB::raw("SUM(CASE WHEN r.reservation_date >= '{$selectedStartStr}' AND r.reservation_date <= '{$selectedEndStr}' THEN r.revenue ELSE 0 END) as revenue_this_month"),
                DB::raw("SUM(CASE WHEN r.reservation_date >= '{$prevStartStr}' AND r.reservation_date <= '{$prevEndStr}' THEN r.revenue ELSE 0 END) as revenue_last_month"),
                DB::raw("SUM(CASE WHEN r.reservation_date >= '{$selectedStartStr}' AND r.reservation_date <= '{$selectedEndStr}' THEN 1 ELSE 0 END) as res_count_this_month"),
                DB::raw("SUM(CASE WHEN r.reservation_date >= '{$prevStartStr}' AND r.reservation_date <= '{$prevEndStr}' THEN 1 ELSE 0 END) as res_count_last_month"),
                DB::raw("SUM(CASE WHEN r.reservation_date >= '{$selectedStartStr}' AND r.reservation_date <= '{$selectedEndStr}' THEN r.number_of_guests ELSE 0 END) as guest_count_this_month"),
                DB::raw("SUM(CASE WHEN r.reservation_date >= '{$prevStartStr}' AND r.reservation_date <= '{$prevEndStr}' THEN r.number_of_guests ELSE 0 END) as guest_count_last_month")
            )
            ->whereNotNull('r.company_name')
            ->where('r.company_name', '!=', '')
            ->groupBy('r.company_name')
            ->get();

        // 4. Map top companies of the month
        $selectedCompanies = $companyStats
            ->filter(fn($row) => $row->revenue_this_month > 0 || $row->res_count_this_month > 0)
            ->map(function ($row) {
                return [
                    'company_name' => $row->company_name,
                    'reservations_count' => (int) $row->res_count_this_month,
                    'guests_count' => (int) $row->guest_count_this_month,
                    'revenue' => (float) $row->revenue_this_month
                ];
            })
            ->sortByDesc('revenue')
            ->values();

        $topCompany = $selectedCompanies->first() ?: null;

        // 5. Map MoM company comparisons
        $companyComparison = $companyStats->map(function ($row) {
            $revenueThisMonth = (float) $row->revenue_this_month;
            $revenueLastMonth = (float) $row->revenue_last_month;
            $revenueDifference = $revenueThisMonth - $revenueLastMonth;

            $resCountThisMonth = (int) $row->res_count_this_month;
            $resCountLastMonth = (int) $row->res_count_last_month;
            $resCountDifference = $resCountThisMonth - $resCountLastMonth;

            $guestCountThisMonth = (int) $row->guest_count_this_month;
            $guestCountLastMonth = (int) $row->guest_count_last_month;
            $guestCountDifference = $guestCountThisMonth - $guestCountLastMonth;

            $growthPercentage = 0.0;
            if ($revenueLastMonth == 0.0) {
                if ($revenueThisMonth > 0.0) {
                    $growthPercentage = 100.0;
                } elseif ($revenueThisMonth < 0.0) {
                    $growthPercentage = -100.0;
                } else {
                    $growthPercentage = 0.0;
                }
            } else {
                $growthPercentage = ($revenueDifference / abs($revenueLastMonth)) * 100.0;
            }

            return [
                'company_name' => $row->company_name,
                'revenue_this_month' => $revenueThisMonth,
                'revenue_last_month' => $revenueLastMonth,
                'revenue_difference' => $revenueDifference,
                'reservation_count_this_month' => $resCountThisMonth,
                'reservation_count_last_month' => $resCountLastMonth,
                'reservation_count_difference' => $resCountDifference,
                'guest_count_this_month' => $guestCountThisMonth,
                'guest_count_last_month' => $guestCountLastMonth,
                'guest_count_difference' => $guestCountDifference,
                'growth_percentage' => round($growthPercentage, 2)
            ];
        })->sortByDesc('revenue_this_month')->values();

        return [
            'summary' => [
                'total_revenue' => (float) ($summary->total_revenue ?? 0),
                'total_reservations' => (int) ($summary->total_reservations ?? 0),
                'total_guests' => (int) ($summary->total_guests ?? 0),
                'active_companies_count' => (int) ($summary->active_companies_count ?? 0),
                'top_company' => $topCompany
            ],
            'group_summary' => [
                'guests' => $this->calculateGrowth(
                    (int) ($groupSummary->total_guests_this_month ?? 0),
                    (int) ($groupSummary->total_guests_last_month ?? 0)
                ),
                'individual_guests' => $this->calculateGrowth(
                    (int) ($groupSummary->total_individual_guests_this_month ?? 0),
                    (int) ($groupSummary->total_individual_guests_last_month ?? 0)
                ),
                'revenue' => $this->calculateGrowth(
                    (float) ($groupSummary->total_revenue_this_month ?? 0),
                    (float) ($groupSummary->total_revenue_last_month ?? 0)
                ),
                'active_companies' => $this->calculateGrowth(
                    (int) ($groupSummary->active_companies_this_month ?? 0),
                    (int) ($groupSummary->active_companies_last_month ?? 0)
                ),
                'top_company' => $topGroupCompany
            ],
            'top_companies' => $selectedCompanies->all(),
            'company_comparison' => $companyComparison->all(),
            'month' => $monthStr
        ];
    }

    private function calculateGrowth($current, $previous)
    {
        $difference = $current - $previous;
        $growthPercentage = 0.0;
        if ($previous == 0.0) {
            if ($current > 0.0) {
                $growthPercentage = 100.0;
            } elseif ($current < 0.0) {
                $growthPercentage = -100.0;
            } else {
                $growthPercentage = 0.0;
            }
        } else {
            $growthPercentage = ($difference / abs($previous)) * 100.0;
        }
        return [
            'current' => $current,
            'previous' => $previous,
            'difference' => $difference,
            'growth_percentage' => round($growthPercentage, 2)
        ];
    }
}
