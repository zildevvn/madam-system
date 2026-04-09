<?php

namespace App\Services;

use App\Models\Product;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Table;
use App\Events\OrderUpdated;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class OrderService
{
    // [WHY] Get active order to display on tablet/pos
    // [RULE] Only status: draft, pending, processing are considered active
    // [RULE] Eager load only required fields for performance
    public function getActiveOrder($tableId)
    {
        return Order::where('table_id', $tableId)
            ->whereIn('status', ['draft', 'pending', 'processing'])
            ->with([
                'items.product' => function($query) {
                    $query->select('id', 'name', 'price', 'type');
                },
                'table:id,name', 
                'server:id,name', 
                'cashier:id,name'
            ])
            ->first();
    }

    // [WHY] Fetch full details for a specific order
    // [RULE] Use findOrFail to catch missing orders early
    public function getOrder($id)
    {
        return Order::with([
            'items.product' => function($query) {
                $query->select('id', 'name', 'price', 'type');
            },
            'table:id,name', 
            'server:id,name', 
            'cashier:id,name'
        ])->findOrFail($id);
    }

    // [WHY] Delete orders that were never finalized
    // [RULE] Only 'draft' orders can be deleted
    public function cancelOrder($id)
    {
        $order = Order::find($id);
        if ($order && $order->status === 'draft') {
            $order->delete();
            return true;
        }
        return false;
    }


    public function cleanupDrafts()
    {
        Order::where('status', 'draft')
            ->where('created_at', '<', now()->subMinutes(10))
            ->delete();
    }

    // [WHY] Initialize a new order session
    // [RULE] Default status is 'draft'
    // [NOTE] items are empty on creation
    public function createOrder(array $data)
    {
        $order = new Order();
        $order->table_id = $data['table_id'] ?? null;
        $order->user_id = $data['user_id'] ?? null;
        $order->merged_tables = $data['merged_tables'] ?? null;
        $order->order_type = $data['order_type'] ?? 'dine-in';
        $order->status = 'draft';
        $order->total_price = 0;
        $order->save();

        return $order->load([
            'items.product:id,name,price', 
            'table:id,name', 
            'server:id,name', 
            'cashier:id,name'
        ]);
    }

    // [WHY] Submit kitchen order and sync items
    // [RULE] Transactional safety for items and status updates
    // [RULE] No N+1 queries by pre-fetching existing items and types
    public function checkoutOrder($orderId, array $items, $mergedTables = null)
    {
        $result = DB::transaction(function () use ($orderId, $items, $mergedTables) {
            $order = Order::findOrFail($orderId);
            $totalPrice = 0;

            // [PERF] PRE-FETCH all existing items for this order in ONE query
            $existingItems = OrderItem::where('order_id', $orderId)
                ->get()
                ->keyBy('product_id');

            // [PERF] Pre-fetch product types for items
            $productIds = collect($items)->pluck('product_id')->toArray();
            $productTypes = Product::whereIn('id', $productIds)->pluck('type', 'id');

            foreach ($items as $itemData) {
                $productId = $itemData['product_id'];
                $orderItem = $existingItems->get($productId);
                $productType = $productTypes->get($productId);

                if ($orderItem) {
                    // [RULE] OVERWRITE quantity instead of accumulating
                    $orderItem->quantity = $itemData['quantity'];
                    $orderItem->table_id = $itemData['table_id'] ?? $order->table_id;
                    if (array_key_exists('note', $itemData)) {
                        $orderItem->note = $itemData['note'];
                    }
                    
                    // [BUSINESS] If it's a drink and was pending, move to served (to skip Bar page)
                    if ($productType === 'drink' && $orderItem->status === 'pending') {
                        $orderItem->status = 'served';
                    }
                    
                    $orderItem->save();
                } else {
                    $orderItem = OrderItem::create([
                        'order_id' => $orderId,
                        'product_id' => $productId,
                        'table_id' => $itemData['table_id'] ?? $order->table_id,
                        'quantity' => $itemData['quantity'],
                        'price' => $itemData['price'],
                        'note' => $itemData['note'] ?? null,
                        'status' => $productType === 'drink' ? 'served' : 'pending'
                    ]);
                }

                $totalPrice += ($orderItem->price * $orderItem->quantity);
            }

            // [RULE] Cleanup orphaned items
            $itemProductIds = collect($items)->pluck('product_id')->toArray();
            OrderItem::where('order_id', $orderId)
                ->whereNotIn('product_id', $itemProductIds)
                ->delete();

            $wasDraft = $order->status === 'draft';
            $order->update([
                'total_price' => $totalPrice,
                'status' => 'pending',
                'merged_tables' => $mergedTables ?? $order->merged_tables
            ]);

            if ($order->table_id) {
                Table::where('id', $order->table_id)->update(['status' => 'busy']);
            }

            return ['order' => $order, 'wasDraft' => $wasDraft];
        });


        // [WHY] Broadcast AFTER transaction commits to avoid race conditions
        try {
            $orderObj = $result['order'];
            $orderObj->load(['items.product:id,name,price,type', 'table:id,name', 'server:id,name', 'cashier:id,name']);
            broadcast(new OrderUpdated($orderObj, $result['wasDraft'] ? 'order_created' : 'order_updated'));
        } catch (\Exception $e) {
            Log::error('Broadcast failed during checkout: ' . $e->getMessage());
        }

        return $orderObj;
    }

    // [WHY] Update progress of a specific item
    // [RULE] Updates trigger realtime events for Kitchen/Bar/Waiter
    public function updateItemStatus($itemId, $status)
    {
        $item = OrderItem::findOrFail($itemId);
        $item->status = $status;
        $item->save();

        $order = $item->order;
        $order->load([
            'items.product:id,name,price', 
            'table:id,name', 
            'server:id,name', 
            'cashier:id,name'
        ]);

        // [REALTIME] Broadcast the update
        try {
            broadcast(new OrderUpdated($order, 'item_status_updated'));
        } catch (\Exception $e) {
            Log::error('Broadcast failed during item status update: ' . $e->getMessage());
        }

        return $order;
    }

    // [WHY] Close order and release tables
    // [RULE] Handles merged tables by finalizing all orders in the group
    // [RULE] Transactional safety for payment data
    public function completeOrder($orderId, $data)
    {
        $result = DB::transaction(function () use ($orderId, $data) {
            $order = Order::findOrFail($orderId);

            // [WHY] Identify all involved table IDs in the merge group
            $involvedTableIds = [$order->table_id];
            if ($order->merged_tables) {
                $mergedIds = explode('-', $order->merged_tables);
                $involvedTableIds = array_merge($involvedTableIds, $mergedIds);
            }
            $involvedTableIds = array_unique(array_filter($involvedTableIds));

            // [CALC] 1. Calculate discount for the primary order
            $subtotal = $order->total_price;
            $discountType = $data['discount_type'] ?? null;
            $discountValue = $data['discount_value'] ?? 0;
            $discountAmount = 0;

            if ($discountType === 'percent') {
                $discountAmount = floor(($subtotal * $discountValue) / 100);
            } elseif ($discountType === 'fixed') {
                $discountAmount = $discountValue;
            }
            
            // [RULE] Ensure discount doesn't exceed subtotal
            $discountAmount = min($subtotal, $discountAmount);
            $finalPrice = $subtotal - $discountAmount;

            // [WHY] 2. Finalize all active orders for these tables with the same payment info
            Order::whereIn('table_id', $involvedTableIds)
                ->whereIn('status', ['draft', 'pending', 'processing'])
                ->update([
                    'status' => 'completed',
                    'subtotal' => $subtotal,
                    'discount_type' => $discountType,
                    'discount_value' => $discountValue,
                    'discount_amount' => $discountAmount,
                    'total_price' => $finalPrice,
                    'payment_method' => $data['payment_method'] ?? null,
                    'cashier_id' => $data['cashier_id'] ?? null,
                ]);

            // [WHY] 2. Free all tables in the group
            if (!empty($involvedTableIds)) {
                Table::whereIn('id', $involvedTableIds)->update(['status' => 'empty']);
            }

            return $order;
        });

        $result->load([
            'items.product:id,name,price,type', 
            'table:id,name', 
            'server:id,name', 
            'cashier:id,name'
        ]);

        try {
            // [REALTIME] Broadcast so other views (StaffOrder, Kitchen) reflect table is now empty
            broadcast(new OrderUpdated($result, 'order_updated'));
        } catch (\Exception $e) {
            Log::error('Broadcast failed during order completion: ' . $e->getMessage());
        }

        return $result;
    }

    // [WHY] Transfer order from one table to another
    // [RULE] Correctly updates both old and new table statuses
    public function updateTable($orderId, $newTableId)
    {
        $order = Order::findOrFail($orderId);
        $oldTableId = $order->table_id;

        $result = DB::transaction(function () use ($order, $newTableId, $oldTableId) {
            $order->update(['table_id' => $newTableId]);

            // [WHY] Update new table status
            Table::where('id', $newTableId)->update(['status' => 'busy']);

            // [WHY] Update old table status ONLY if no other active orders remain
            if ($oldTableId) {
                $stillBusy = Order::where('table_id', $oldTableId)
                    ->whereIn('status', ['pending', 'processing', 'draft'])
                    ->where('id', '!=', $order->id)
                    ->exists();

                if (!$stillBusy) {
                    Table::where('id', $oldTableId)->update(['status' => 'empty']);
                }
            }

            return $order;
        });

        $result->load(['items.product:id,name,price,type', 'table:id,name']);

        try {
            broadcast(new OrderUpdated($result, 'order_updated'));
        } catch (\Exception $e) {
            Log::error('Broadcast failed during table update: ' . $e->getMessage());
        }

        return $result;
    }
}