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
     * index
     * [WHY] Returns a paginated/filtered JSON list of orders for the preview table.
     */
    public function index(Request $request)
    {
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
     * [RULE] Uses cursor()-based lazy loading to stream row-by-row without loading the full
     *        result set into memory. Memory usage stays constant regardless of dataset size.
     * [RULE] Column headers, order grouping, and number formatting mirror the frontend
     *        OrderExportPage.jsx table exactly — order-level fields (Bàn, Giờ vào, Thu ngân,
     *        Tổng SL, Tổng thu, etc.) are only written on the first item row of each order.
     */
    public function export(Request $request)
    {
        // Eager-load relations so each chunk resolves them without N+1 queries.
        // We use get() with chunkById on the base query for memory-safe processing.
        $query = $this->buildQuery($request)->orderBy('orders.id', 'asc');

        $filename = 'orders_export_' . now()->format('Ymd_His') . '.csv';

        $httpHeaders = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            'Cache-Control' => 'no-cache, no-store',
            'Pragma' => 'no-cache',
        ];

        $callback = function () use ($query) {
            $handle = fopen('php://output', 'w');

            // UTF-8 BOM so Excel opens the file with correct encoding
            fwrite($handle, "\xEF\xBB\xBF");

            // ── Header row — Vietnamese labels matching OrderExportPage.jsx ────
            fputcsv($handle, [
                'STT',
                'No',
                'Table',
                'Arrival Time',
                'Printed',
                'Cashier',
                'Items',
                'Name VI',
                'Name',
                'QTY',
                'Total',
                'Cross Total QTY',
                'Cross Total Amount',
                'Total Due',
                'PHƯƠNG THỨC THANH TOÁN',
                '',
                '',
                '',
            ]);
            fputcsv($handle, [
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                'CN',
                'TM',
                'CK',
                'CT',
            ]);

            $stt = 1;

            // ── chunkById streams 500 orders at a time, keeping memory flat ───
            $query->chunkById(500, function ($orders) use ($handle, &$stt) {
                $orders->loadMissing([
                    'items.product:id,name,name_vi',
                    'table:id,name',
                    'cashier:id,name',
                    'payments',
                ]);

                foreach ($orders as $order) {
                    $items = $order->items ?? collect();


                    // ── Aggregates (mirrors frontend useMemo row expansion) ────
                    $crossTotalQty = $items->sum('quantity');
                    $crossTotalAmount = $items->sum(fn($i) => ($i->price ?? 0) * ($i->quantity ?? 0));
                    $totalDue = (float) ($order->total_price ?? 0);

                    $tableName = $order->table->name ?? ($order->merged_tables ?? '—');
                    $arrivalTime = $order->created_at
                        ? Carbon::parse($order->created_at)->format('d/m/Y H:i')
                        : '—';
                    $printedTime = $order->updated_at
                        ? Carbon::parse($order->updated_at)->format('d/m/Y H:i')
                        : '—';
                    $cashierName = $order->cashier->name ?? 'Admin';
                    $paymentMethodStr = self::formatPaymentMethod($order);

                    // ── STT increments once per order ────────────────────────
                    $orderStt = $stt++;

                    // ── Empty-item order — single placeholder row ─────────────
                    if ($items->isEmpty()) {
                        fputcsv($handle, [
                            $orderStt,
                            '#' . $order->id,
                            $tableName,
                            $arrivalTime,
                            $printedTime,
                            $cashierName,
                            '—',          // Món  — no item
                            '',           // Name VI
                            '',           // Name
                            '',           // SL   — blank (matches UI: item ? qty : '')
                            '',           // Thành tiền — blank
                            $crossTotalQty,
                            self::formatNumber($crossTotalAmount),
                            self::formatNumber($totalDue),
                            self::hasPaymentMethod($order, 'debt') ? 'X' : '',
                            self::hasPaymentMethod($order, 'cash') ? 'X' : '',
                            self::hasPaymentMethod($order, 'bank') ? 'X' : '',
                            self::hasPaymentMethod($order, 'card') ? 'X' : '',
                        ]);
                        continue;
                    }

                    // ── Per-item rows — isFirstItem grouping mirrors the UI ───
                    $isFirst = true;
                    foreach ($items as $item) {
                        $itemQty = $item->quantity ?? 0;
                        $itemTotal = ($item->price ?? 0) * $itemQty;
                        $nameVi = $item->product->name_vi ?? $item->name_vi ?? null;
                        $defaultName = $item->name ?? ($item->product->name ?? 'Unknown');
                        $itemName = $nameVi ? "{$nameVi} - {$defaultName}" : $defaultName;

                        if ($isFirst) {
                            // First item row: include all order-level fields
                            fputcsv($handle, [
                                $orderStt,
                                '#' . $order->id,   // No — e.g. "#1042"
                                $tableName,
                                $arrivalTime,
                                $printedTime,
                                $cashierName,
                                $itemName,
                                $nameVi ?: '',
                                $defaultName,
                                $itemQty,
                                self::formatNumber($itemTotal),
                                $crossTotalQty,
                                self::formatNumber($crossTotalAmount),
                                self::formatNumber($totalDue),
                                self::hasPaymentMethod($order, 'debt') ? 'X' : '',
                                self::hasPaymentMethod($order, 'cash') ? 'X' : '',
                                self::hasPaymentMethod($order, 'bank') ? 'X' : '',
                                self::hasPaymentMethod($order, 'card') ? 'X' : '',
                            ]);
                            $isFirst = false;
                        } else {
                            // Continuation rows: order-level fields are blank,
                            // matching the frontend "isFirstItemInOrder ? value : ''" pattern.
                            fputcsv($handle, [
                                $orderStt,
                                '',          // No — blank (UI shows ↳)
                                '',          // Bàn
                                '',          // Giờ vào
                                '',          // In lúc
                                '',          // Thu ngân
                                $itemName,
                                $nameVi ?: '',
                                $defaultName,
                                $itemQty,
                                self::formatNumber($itemTotal),
                                '',          // Tổng SL   — blank on non-first rows
                                '',          // Tổng tiền món
                                '',          // Tổng thu
                                '',          // CN — blank
                                '',          // TM — blank
                                '',          // CK — blank
                                '',          // CT — blank
                            ]);
                        }
                    }
                }
            }, 'orders.id', 'id');


            fclose($handle);
        };

        return response()->stream($callback, 200, $httpHeaders);
    }

    /**
     * cashiers
     * [WHY] Returns list of cashiers (users who have completed at least one order).
     */
    public function cashiers(Request $request)
    {
        $cashiers = User::select('users.id', 'users.name')
            ->join('orders', 'orders.cashier_id', '=', 'users.id')
            ->where('orders.status', 'completed')
            ->distinct()
            ->orderBy('users.name')
            ->get();

        return $this->success($cashiers);
    }


    // ─── Private Helpers ───────────────────────────────────────────────────────

    /**
     * formatNumber
     * [RULE] Shared formatting logic guarantees exact parity with formatPrice()
     *       which formats numbers with dot thousand-separators, no decimals for
     *       whole VND amounts (e.g. 1.234.567).
     */
    private static function formatNumber(float|int $value): string
    {
        return '="' . number_format($value, 0, ',', '.') . '"';
    }

    private static function formatPaymentMethod($order): string
    {
        if (!$order) {
            return '—';
        }

        $payments = $order->payments ?? collect();
        
        if ($payments->isNotEmpty()) {
            if ($payments->count() === 1) {
                $p = $payments->first();
                return self::getPaymentMethodLabel($p->payment_method);
            }
            
            $parts = [];
            foreach ($payments as $p) {
                $label = self::getPaymentMethodLabel($p->payment_method);
                $amount = number_format($p->amount, 0, ',', '.') . 'đ';
                $parts[] = "{$label} ({$amount})";
            }
            return implode(' + ', $parts);
        }

        $method = $order->payment_method;
        if ($method === 'split') {
            return 'Hỗn hợp';
        }
        return self::getPaymentMethodLabel($method);
    }

    private static function getPaymentMethodLabel(?string $method): string
    {
        switch (strtolower($method ?? '')) {
            case 'cash':
                return 'Tiền mặt';
            case 'bank':
                return 'Chuyển khoản';
            case 'card':
                return 'Cà thẻ';
            case 'debt':
                return 'Công nợ';
            case 'split':
                return 'Hỗn hợp';
            default:
                return $method ?? '—';
        }
    }

    private static function hasPaymentMethod($order, string $method): bool
    {
        if (!$order) {
            return false;
        }

        $payments = $order->payments ?? collect();
        if ($payments->isNotEmpty()) {
            return $payments->contains(function ($payment) use ($method) {
                return strtolower($payment->payment_method ?? '') === strtolower($method);
            });
        }

        return strtolower($order->payment_method ?? '') === strtolower($method);
    }

    private function buildQuery(Request $request)
    {
        $query = Order::with([
            'items',
            'items.product:id,name,name_vi',
            'table:id,name',
            'cashier:id,name',
            'payments',
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
}
