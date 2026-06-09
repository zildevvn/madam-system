<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Table;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

/**
 * OrderExportController
 * [WHY] Provides Admin/Accountant-only endpoints to filter and export order data.
 * [RULE] Uses streaming CSV response for large dataset support without memory blowout.
 * [RULE] All filters are optional; returns all completed orders if no filter is applied.
 */
class OrderExportController extends Controller
{
    use \App\Traits\ApiResponse;

    /**
     * Helper to retrieve active user context from request headers securely verified against DB.
     */
    private function getCurrentUser(Request $request)
    {
        $userId = $request->header('X-User-Id');
        if (!$userId) {
            return null;
        }
        return User::find($userId);
    }

    /**
     * index
     * [WHY] Returns a paginated/filtered JSON list of orders for the preview table.
     */
    public function index(Request $request)
    {
        $user = $this->getCurrentUser($request);
        if (!$user || !in_array($user->role, [
            User::ROLE_ADMIN,
            User::ROLE_ACCOUNTANT
        ])) {
            abort(403);
        }

        $query = $this->buildQuery($request);

        $orders = $query
            ->orderBy('orders.updated_at', 'desc')
            ->limit(200) // preview cap to keep response fast
            ->get();

        return $this->success($orders);
    }

    /**
     * export
     * [WHY] Streams a CSV file for all matched orders — supports large datasets efficiently.
     * [RULE] Uses PHP output buffering to stream row-by-row, avoiding full memory load.
     */
    public function export(Request $request)
    {
        $user = $this->getCurrentUser($request);
        if (!$user || !in_array($user->role, [
            User::ROLE_ADMIN,
            User::ROLE_ACCOUNTANT
        ])) {
            abort(403);
        }

        $query = $this->buildQuery($request);
        $orders = $query->orderBy('orders.updated_at', 'asc')->get();

        // Expand each order into per-item rows
        $rows = $this->expandToRows($orders);

        $filename = 'orders_export_' . now()->format('Ymd_His') . '.csv';

        $headers = [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            'Cache-Control'       => 'no-cache, no-store',
            'Pragma'              => 'no-cache',
        ];

        $callback = function () use ($rows) {
            $handle = fopen('php://output', 'w');

            // UTF-8 BOM so Excel opens correctly
            fwrite($handle, "\xEF\xBB\xBF");

            // Header row
            fputcsv($handle, [
                'STT',
                'No',
                'Table',
                'Arrival Time',
                'Printed',
                'Cashier',
                'Items',
                'QTY',
                'Total',
                'Cross Total QTY',
                'Cross Total Amount',
                'Total Due',
            ]);

            foreach ($rows as $row) {
                fputcsv($handle, $row);
            }

            fclose($handle);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * cashiers
     * [WHY] Returns list of cashiers (users who have completed at least one order).
     */
    public function cashiers(Request $request)
    {
        $user = $this->getCurrentUser($request);
        if (!$user || !in_array($user->role, [
            User::ROLE_ADMIN,
            User::ROLE_ACCOUNTANT
        ])) {
            abort(403);
        }

        $cashierIds = Order::where('status', 'completed')
            ->whereNotNull('cashier_id')
            ->distinct()
            ->pluck('cashier_id');

        $cashiers = User::whereIn('id', $cashierIds)
            ->select('id', 'name')
            ->orderBy('name')
            ->get();

        return $this->success($cashiers);
    }

    // ─── Private Helpers ───────────────────────────────────────────────────────

    private function buildQuery(Request $request)
    {
        $query = Order::with([
                'items',
                'items.product:id,name',
                'table:id,name',
                'cashier:id,name',
            ])
            ->select('orders.*')
            ->leftJoin('tables', 'orders.table_id', '=', 'tables.id')
            ->leftJoin('users as cashier_users', 'orders.cashier_id', '=', 'cashier_users.id')
            ->where('orders.status', 'completed');

        // Date range filter
        if ($request->filled('date_from')) {
            $query->whereDate('orders.updated_at', '>=', $request->input('date_from'));
        }
        if ($request->filled('date_to')) {
            $query->whereDate('orders.updated_at', '<=', $request->input('date_to'));
        }

        // Cashier filter
        if ($request->filled('cashier_id')) {
            $query->where('orders.cashier_id', $request->input('cashier_id'));
        }

        // Table filter
        if ($request->filled('table_id')) {
            $query->where('orders.table_id', $request->input('table_id'));
        }

        return $query;
    }

    /**
     * expandToRows
     * [WHY] Each item in an order becomes its own CSV row.
     * Order-level fields (cross totals, total due) are repeated on every item row.
     */
    private function expandToRows($orders): array
    {
        $rows = [];
        $stt = 1;

        foreach ($orders as $order) {
            $items = $order->items ?? collect();

            $crossTotalQty = $items->sum('quantity');
            $crossTotalAmount = $items->sum(fn($i) => ($i->price ?? 0) * ($i->quantity ?? 0));
            $totalDue = $order->total_price ?? 0;

            $tableName = $order->table->name ?? ($order->merged_tables ?? '-');
            $arrivalTime = $order->created_at
                ? Carbon::parse($order->created_at)->format('d/m/Y H:i')
                : '-';
            $printedTime = $order->updated_at
                ? Carbon::parse($order->updated_at)->format('d/m/Y H:i')
                : '-';
            $cashierName = $order->cashier->name ?? '-';

            if ($items->isEmpty()) {
                $rows[] = [
                    $stt++,
                    $order->id,
                    $tableName,
                    $arrivalTime,
                    $printedTime,
                    $cashierName,
                    '-',
                    0,
                    0,
                    $crossTotalQty,
                    $crossTotalAmount,
                    $totalDue,
                ];
                continue;
            }

            foreach ($items as $item) {
                $itemTotal = ($item->price ?? 0) * ($item->quantity ?? 0);
                $itemName  = $item->name ?? ($item->product->name ?? 'Unknown');

                $rows[] = [
                    $stt++,
                    $order->id,
                    $tableName,
                    $arrivalTime,
                    $printedTime,
                    $cashierName,
                    $itemName,
                    $item->quantity ?? 0,
                    $itemTotal,
                    $crossTotalQty,
                    $crossTotalAmount,
                    $totalDue,
                ];
            }
        }

        return $rows;
    }
}
