<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderItem;
use App\Events\OrderUpdated;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Traits\PriceCalculator;

class OrderSplitService
{
    use PriceCalculator;

    /**
     * splitItems
     * [WHY] Splits specific items from a source order into a new "sibling" order.
     * [RULE] Source order must not be completed. Items can belong to any order in a group.
     */
    public function splitItems($sourceOrderId, array $itemsToSplit)
    {
        $resultData = DB::transaction(function () use ($sourceOrderId, $itemsToSplit) {
            $sourceOrder = Order::findOrFail($sourceOrderId);

            if ($sourceOrder->status === 'completed') {
                throw new \Exception("Cannot split a completed order.");
            }

            $allowedOrderIds = $this->getAllowedOrderIds($sourceOrder);

            // [VALIDATION] Pre-validate all items before performing any mutations or creating new orders.
            // Aggregate quantities by order_item_id to prevent bypassing available quantity via duplicate IDs.
            $aggregatedQuantities = [];
            foreach ($itemsToSplit as $splitData) {
                $itemId = $splitData['order_item_id'] ?? null;
                $quantityToMove = $splitData['quantity'] ?? null;

                if (!is_numeric($itemId)) {
                    throw new \Exception("Invalid order item ID.");
                }

                if (!is_int($quantityToMove) || $quantityToMove < 1) {
                    throw new \Exception("Split quantity must be a positive integer.");
                }

                $itemId = (int) $itemId;
                $aggregatedQuantities[$itemId] = ($aggregatedQuantities[$itemId] ?? 0) + $quantityToMove;
            }

            $sourceItems = [];
            foreach ($aggregatedQuantities as $itemId => $totalQuantityToMove) {
                $sourceItem = OrderItem::with('order')->findOrFail($itemId);

                if (!in_array((int) $sourceItem->order_id, $allowedOrderIds, true)) {
                    throw new \Exception("Cannot split an item from an unrelated order.");
                }

                if ($sourceItem->order->status === 'completed') {
                    throw new \Exception("Cannot split an item from a completed order.");
                }

                if ($totalQuantityToMove > $sourceItem->quantity) {
                    throw new \Exception("Split quantity exceeds current item quantity.");
                }

                $sourceItems[] = [
                    'item' => $sourceItem,
                    'quantity' => $totalQuantityToMove
                ];
            }

            $parentOrderId = $sourceOrder->parent_order_id ?: $sourceOrder->id;

            // [WHY] Create a new sibling order inheriting the same metadata
            $newOrder = Order::create([
                'table_id' => $sourceOrder->table_id,
                'user_id' => $sourceOrder->user_id,
                'merged_tables' => null, // [WHY] Split bills are independent from the source merge grouping.
                'reservation_id' => $sourceOrder->reservation_id,
                'order_type' => $sourceOrder->order_type,
                'status' => $sourceOrder->status,
                'guest_count' => 1, // Default to 1 for the split-off portion
                'total_price' => 0,
                'parent_order_id' => $parentOrderId,
            ]);

            $affectedOrderIds = [$sourceOrderId];

            foreach ($sourceItems as $splitEntry) {
                $sourceItem = $splitEntry['item'];
                $quantityToMove = $splitEntry['quantity'];

                $affectedOrderIds[] = $sourceItem->order_id;

                if ($quantityToMove == $sourceItem->quantity) {
                    // [WHY] Move the entire item record to the new order
                    $sourceItem->update(['order_id' => $newOrder->id]);
                } else {
                    // Pre-split values for conservation check
                    $originalQuantity = $sourceItem->quantity;

                    // [WHY] Partial split: Reduce source quantity and create new record
                    $sourceItem->decrement('quantity', $quantityToMove);

                    $newOrderItem = OrderItem::create([
                        'order_id' => $newOrder->id,
                        'product_id' => $sourceItem->product_id,
                        'name' => $sourceItem->name,
                        'type' => $sourceItem->type,
                        'table_id' => $sourceItem->table_id,
                        'quantity' => $quantityToMove,
                        'price' => $sourceItem->price,
                        'note' => $sourceItem->note,
                        'status' => $sourceItem->status,
                        'source' => $sourceItem->source,
                        'discount' => $sourceItem->discount,
                        'discount_type' => $sourceItem->discount_type,
                        'reservation_item_id' => $sourceItem->reservation_item_id,
                        'sort_order' => $sourceItem->sort_order,
                    ]);

                    // Data conservation check
                    $originalValue = $this->calculateItemNetPrice($originalQuantity, $sourceItem->price, $sourceItem->discount, $sourceItem->discount_type);
                    $remainingValue = $this->calculateItemNetPrice($sourceItem->quantity, $sourceItem->price, $sourceItem->discount, $sourceItem->discount_type);
                    $splitValue = $this->calculateItemNetPrice($newOrderItem->quantity, $newOrderItem->price, $newOrderItem->discount, $newOrderItem->discount_type);

                    if (abs($originalValue - ($remainingValue + $splitValue)) > 0.01) {
                        Log::warning('Data conservation mismatch during partial item split.', [
                            'order_id' => $sourceOrderId,
                            'new_order_id' => $newOrder->id,
                            'source_item_id' => $sourceItem->id,
                            'new_item_id' => $newOrderItem->id,
                            'expected_value' => $originalValue,
                            'actual_value' => $remainingValue + $splitValue,
                            'difference' => $originalValue - ($remainingValue + $splitValue),
                        ]);
                    }
                }
            }

            // [WHY] Recalculate totals for all unique affected orders inside transaction
            foreach (array_unique($affectedOrderIds) as $id) {
                $o = Order::find($id);
                if ($o) {
                    $this->recalculateOrderTotal($o);
                }
            }

            $this->recalculateOrderTotal($newOrder);

            return [
                'newOrder' => $newOrder,
                'affectedOrderIds' => array_unique($affectedOrderIds)
            ];
        });

        $newOrder = $resultData['newOrder'];
        $uniqueAffectedIds = $resultData['affectedOrderIds'];

        // [WHY] Broadcast outside of the transaction
        foreach ($uniqueAffectedIds as $id) {
            $o = Order::find($id);
            if ($o) {
                $this->broadcastUpdate($o, 'order_updated');
            }
        }

        $this->broadcastUpdate($newOrder, 'order_created');

        return [
            'source_order' => Order::find($sourceOrderId)?->fresh(['items.product', 'childOrders.items.product']),
            'new_order' => $newOrder->fresh(['items.product'])
        ];
    }

    private function recalculateOrderTotal(Order $order)
    {
        // Calculate total price using net price per item (considering discount and discount type)
        $total = 0;
        foreach ($order->items as $item) {
            $itemNet = $this->calculateItemNetPrice(
                $item->quantity,
                $item->price,
                $item->discount ?? 0,
                $item->discount_type ?? 'fixed'
            );
            $total += $itemNet;
        }
        $order->total_price = $total;
        $order->save();
    }

    private function broadcastUpdate(Order $order, $type)
    {
        try {
            $order->load(['items.product', 'table:id,name', 'server:id,name', 'cashier:id,name']);
            broadcast(new OrderUpdated($order, $type));
        } catch (\Exception $e) {
            Log::error('Broadcast failed during order split: ' . $e->getMessage());
        }
    }

    /**
     * mergeBack
     * [WHY] Reverts a split order by moving all its items back to its parent order.
     */
    public function mergeBack($splitOrderId)
    {
        $resultData = DB::transaction(function () use ($splitOrderId) {
            $splitOrder = Order::with('items')->findOrFail($splitOrderId);

            if (!in_array($splitOrder->status, ['draft', 'pending', 'processing'])) {
                throw new \Exception("Cannot merge an order that is " . $splitOrder->status);
            }

            if (!$splitOrder->parent_order_id) {
                throw new \Exception("Cannot merge a main order. Only split orders can be merged back.");
            }

            $originalOrder = Order::findOrFail($splitOrder->parent_order_id);

            if (!in_array($originalOrder->status, ['draft', 'pending', 'processing'])) {
                throw new \Exception("Cannot merge back into an order that is " . $originalOrder->status);
            }

            // Move all items
            foreach ($splitOrder->items as $item) {
                $item->update(['order_id' => $originalOrder->id]);
            }

            // Mark split order as merged
            $splitOrder->update(['status' => 'merged', 'total_price' => 0]);

            $this->recalculateOrderTotal($originalOrder);

            return [
                'splitOrder' => $splitOrder,
                'originalOrder' => $originalOrder
            ];
        });

        // Broadcast the updates
        $this->broadcastUpdate($resultData['originalOrder'], 'order_updated');
        
        // Broadcast the removal of the split order
        // Use 'order_updated' or 'order_deleted' depending on frontend expectation,
        // but 'order_updated' with 'merged' status should be handled safely or optimistically removed.
        $this->broadcastUpdate($resultData['splitOrder'], 'order_updated');

        return [
            'merged_order' => $resultData['splitOrder']->fresh(),
            'original_order' => $resultData['originalOrder']->fresh(['items.product', 'childOrders.items.product'])
        ];
    }

    // calculateItemNetPrice is now provided by App\Traits\PriceCalculator

    /**
     * Determine all order IDs that are legitimately related to the source order
     * and eligible to contribute items to this split operation.
     */
    protected function getAllowedOrderIds(Order $sourceOrder): array
    {
        $allowedIds = [(int) $sourceOrder->id];

        // 1. Sibling split orders and parent order
        if ($sourceOrder->parent_order_id) {
            $allowedIds[] = (int) $sourceOrder->parent_order_id;
            $siblingIds = Order::where('parent_order_id', $sourceOrder->parent_order_id)
                ->whereIn('status', ['draft', 'pending', 'processing'])
                ->pluck('id')
                ->toArray();
            $allowedIds = array_merge($allowedIds, $siblingIds);
        } else {
            // Child split orders of this source order
            $childIds = Order::where('parent_order_id', $sourceOrder->id)
                ->whereIn('status', ['draft', 'pending', 'processing'])
                ->pluck('id')
                ->toArray();
            $allowedIds = array_merge($allowedIds, $childIds);
        }

        // 2. Merged tables group: Only orders that share the exact same merged_tables group
        if ($sourceOrder->merged_tables) {
            $mergedOrderIds = Order::where('merged_tables', $sourceOrder->merged_tables)
                ->whereIn('status', ['draft', 'pending', 'processing'])
                ->pluck('id')
                ->toArray();
            $allowedIds = array_merge($allowedIds, $mergedOrderIds);
        }

        // 3. Group reservation: Only orders that belong to a unified group reservation
        if ($sourceOrder->reservation_id) {
            $sourceOrder->loadMissing('reservation');
            if ($sourceOrder->reservation && $sourceOrder->reservation->type === 'group') {
                $reservationOrderIds = Order::where('reservation_id', $sourceOrder->reservation_id)
                    ->whereIn('status', ['draft', 'pending', 'processing'])
                    ->pluck('id')
                    ->toArray();
                $allowedIds = array_merge($allowedIds, $reservationOrderIds);
            }
        }

        return array_values(array_unique(array_map('intval', $allowedIds)));
    }
}
