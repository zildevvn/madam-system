<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderItem;
use App\Events\OrderUpdated;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class OrderSplitService
{
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
            ]);

            $affectedOrderIds = [$sourceOrderId];

            foreach ($itemsToSplit as $splitData) {
                $itemId = $splitData['order_item_id'];
                $quantityToMove = $splitData['quantity'];

                // [WHY] Find the item globally to allow splitting from any order in a consolidated group.
                $sourceItem = OrderItem::with('order')->findOrFail($itemId);

                if ($sourceItem->order->status === 'completed') {
                    throw new \Exception("Cannot split an item from a completed order.");
                }

                if ($quantityToMove > $sourceItem->quantity) {
                    throw new \Exception("Split quantity exceeds current item quantity.");
                }

                $affectedOrderIds[] = $sourceItem->order_id;

                if ($quantityToMove == $sourceItem->quantity) {
                    // [WHY] Move the entire item record to the new order
                    $sourceItem->update(['order_id' => $newOrder->id]);
                } else {
                    // [WHY] Partial split: Reduce source quantity and create new record
                    $sourceItem->decrement('quantity', $quantityToMove);

                    OrderItem::create([
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
                    ]);
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
            'source_order' => Order::find($sourceOrderId)?->fresh(['items.product']),
            'new_order' => $newOrder->fresh(['items.product'])
        ];
    }

    private function recalculateOrderTotal(Order $order)
    {
        $order->total_price = $order->items()->sum(DB::raw('quantity * price'));
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
}
