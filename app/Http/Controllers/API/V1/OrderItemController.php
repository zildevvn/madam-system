<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\API\V1\OrderItemBulkDestroyRequest;
use App\Http\Resources\API\V1\OrderItemResource;
use App\Models\Order;
use App\Traits\PriceCalculator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class OrderItemController extends Controller
{
    use PriceCalculator;

    /**
     * GET /api/v1/orders/{order}/items
     *
     * List all items belonging to a specific cash order.
     */
    public function index(Order $order): AnonymousResourceCollection
    {
        // Enforce cash-only restriction for External API V1
        abort_unless($order->payment_method === 'cash', 404);

        $items = $order->items()
            ->with('product:id,name,name_vi,price,type')
            ->orderBy('sort_order', 'asc')
            ->orderBy('id', 'asc')
            ->get();

        return OrderItemResource::collection($items);
    }

    /**
     * DELETE /api/v1/orders/{order}/items
     *
     * Selectively delete one or multiple items belonging to this order.
     * Supports partial deletion: valid items belonging to this order are deleted,
     * while foreign/invalid IDs are reported in 'not_found_ids'.
     *
     * Request body:
     * { "item_ids": [101, 102] } or { "ids": [101, 102] }
     */
    public function bulkDestroy(
        Order $order,
        OrderItemBulkDestroyRequest $request
    ): JsonResponse {
        // Enforce cash-only restriction for External API V1
        abort_unless($order->payment_method === 'cash', 404);

        $requestedIds = array_map('intval', $request->validated('item_ids'));

        // Strictly scope to items belonging to this order
        $matchingItems = $order->items()
            ->whereIn('id', $requestedIds)
            ->get();

        $deletedIds = $matchingItems->pluck('id')
            ->map(fn($id) => (int) $id)
            ->values()
            ->all();

        $notFoundIds = array_values(
            array_diff($requestedIds, $deletedIds)
        );

        if (empty($deletedIds)) {
            return response()->json([
                'success' => false,
                'message' => 'No matching items found for this order.',
                'deleted_ids' => [],
                'deleted_count' => 0,
                'not_found_ids' => $notFoundIds,
            ], 404);
        }

        DB::transaction(function () use ($order, $deletedIds) {
            $order->items()->whereIn('id', $deletedIds)->delete();
            $this->recalculateOrderTotals($order);
        });

        // Refresh model to read updated financial totals
        $order->refresh();

        return response()->json([
            'success' => true,
            'message' => count($deletedIds) . ' item(s) deleted successfully.',
            'order_id' => (int) $order->id,
            'deleted_ids' => $deletedIds,
            'deleted_count' => count($deletedIds),
            'not_found_ids' => $notFoundIds,
            'order_summary' => [
                'subtotal' => (int) $order->subtotal,
                'discount_type' => $order->discount_type,
                'discount_value' => $order->discount_value,
                'discount_amount' => (int) $order->discount_amount,
                'total_price' => (int) $order->total_price,
                'remaining_items_count' => $order->items()->count(),
            ],
        ]);
    }

    /**
     * Recalculate subtotal, discount_amount, and total_price of the order
     * based on remaining items, mirroring existing Madam System business logic,
     * and synchronize single cash payment record if present.
     */
    private function recalculateOrderTotals(Order $order): void
    {
        // 1. Capture old total_price before modification
        $oldTotalPrice = (int) $order->total_price;

        $remainingItems = $order->items()->get();

        $itemsNetTotal = 0;
        foreach ($remainingItems as $item) {
            $itemsNetTotal += $this->calculateItemNetPrice(
                (int) $item->quantity,
                (int) $item->price,
                (float) ($item->discount ?? 0),
                $item->discount_type ?? 'fixed'
            );
        }

        $orderDiscountAmount = 0;
        if ($order->discount_type === 'percent' && (float) $order->discount_value > 0) {
            $orderDiscountAmount = (int) floor(($itemsNetTotal * (float) $order->discount_value) / 100);
        } elseif ($order->discount_type === 'fixed' && (float) $order->discount_value > 0) {
            $orderDiscountAmount = (int) $order->discount_value;
        }

        $orderDiscountAmount = min($itemsNetTotal, $orderDiscountAmount);
        $finalOrderPrice = max(0, $itemsNetTotal - $orderDiscountAmount);

        $order->subtotal = (int) $itemsNetTotal;
        $order->discount_amount = (int) $orderDiscountAmount;
        $order->total_price = (int) $finalOrderPrice;
        $order->save();

        // 2. Synchronize order payments under approved business rules
        $this->syncOrderPayments($order, $oldTotalPrice, (int) $finalOrderPrice);
    }

    /**
     * Synchronize order_payments according to approved business rules:
     * - If order has 0 payments: keep current behavior; do NOT automatically create payments.
     * - If order has exactly 1 payment with payment_method 'cash': synchronize amount to new total_price.
     * - If order has multiple payments (> 1) or abnormal payments: do NOT alter payments blindly; log warning for audit.
     */
    private function syncOrderPayments(Order $order, int $oldTotalPrice, int $newTotalPrice): void
    {
        $payments = $order->payments()->get();
        $paymentsCount = $payments->count();

        // Case 1: Order has no payment records -> Keep current behavior, do not create payment
        if ($paymentsCount === 0) {
            return;
        }

        // Case 2: Order has exactly one payment
        if ($paymentsCount === 1) {
            $singlePayment = $payments->first();

            if ($singlePayment->payment_method === 'cash') {
                $singlePayment->amount = $newTotalPrice;
                $singlePayment->save();

                Log::info("External API: Synchronized cash payment for order #{$order->id} from {$oldTotalPrice} to {$newTotalPrice}.");
                return;
            }

            // Abnormal/non-cash single payment on a cash order: do not alter blindly, log warning
            Log::warning("External API: Order #{$order->id} has single payment with method '{$singlePayment->payment_method}' instead of 'cash', payment amount untouched.");
            return;
        }

        // Case 3: Order has multiple payments (> 1) -> Do not alter payments blindly, log warning for manual confirmation
        Log::warning("External API: Order #{$order->id} has multiple payments ({$paymentsCount}), skipped automatic payment update on item deletion.");
    }
}
