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
    protected $paymentService;
    protected $tableService;
    protected $splitService;

    // [WHY] Initialize with specialized sub-services for modularity.
    public function __construct(OrderPaymentService $paymentService, OrderTableService $tableService, OrderSplitService $splitService)
    {
        $this->paymentService = $paymentService;
        $this->tableService = $tableService;
        $this->splitService = $splitService;
    }

    // [WHY] Get active order to display on tablet/pos
    // [RULE] Eager load only required fields for performance
    public function getActiveOrder($tableId)
    {
        return Order::where('table_id', $tableId)
            ->whereIn('status', ['draft', 'pending', 'processing'])
            ->where(function ($query) {
                $query->whereDoesntHave('reservation')
                    ->orWhereHas('reservation', function ($q) {
                        $q->where('type', '!=', 'group');
                    });
            })
            ->with([
                'items.product' => function ($query) {
                    $query->select('id', 'name', 'price', 'type');
                },
                'table:id,name',
                'server:id,name',
                'cashier:id,name'
            ])
            ->latest()
            ->first();
    }

    // [WHY] Fetch full details for a specific order
    public function getOrder($id)
    {
        return Order::with([
            'items.product' => function ($query) {
                $query->select('id', 'name', 'price', 'type');
            },
            'table:id,name',
            'server:id,name',
            'cashier:id,name'
        ])->findOrFail($id);
    }

    // [WHY] Delete orders that were never finalized
    public function cancelOrder($id)
    {
        $order = Order::find($id);
        if ($order && $order->status === 'draft') {
            $order->delete();
            return true;
        }
        return false;
    }

    // [WHY] Cleanup abandoned draft orders to keep the system tidy
    // [RULE] Drafts older than 10 minutes are considered abandoned
    public function cleanupDrafts()
    {
        Order::where('status', 'draft')
            ->where('created_at', '<', now()->subMinutes(10))
            ->delete();
    }

    // [WHY] Initialize a new order session
    public function createOrder(array $data)
    {
        $order = new Order();
        $order->table_id = $data['table_id'] ?? null;
        $order->user_id = $data['user_id'] ?? null;
        $order->merged_tables = $data['merged_tables'] ?? null;
        $order->order_type = $data['order_type'] ?? 'dine-in';
        $order->status = 'draft';
        $order->guest_count = $data['guest_count'] ?? 1;
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
    public function checkoutOrder($orderId, array $items, $mergedTables = null, $orderNote = null, $guestCount = null)
    {
        $result = DB::transaction(function () use ($orderId, $items, $mergedTables, $orderNote, $guestCount) {
            $order = Order::findOrFail($orderId);
            $totalPrice = 0;

            // [WHY] Identify all orders in the merge group to prevent item duplication.
            // If we only look at the primary order, items belonging to other tables in the merge
            // would be treated as "new" and cloned into the primary order, while also remaining
            // in their original orders.
            $mergedString = $mergedTables ?? $order->merged_tables;
            $tableIds = $mergedString ? explode('-', $mergedString) : [$order->table_id];
            
            $involvedOrderIds = Order::whereIn('table_id', $tableIds)
                ->whereIn('status', ['draft', 'pending', 'processing'])
                ->pluck('id')
                ->toArray();

            $existingItems = OrderItem::whereIn('order_id', $involvedOrderIds)->get();
            $existingItemsById = $existingItems->keyBy('id');
            $existingItemsByProduct = $existingItems->groupBy('product_id');

            $productIds = collect($items)->pluck('product_id')->toArray();
            $productTypes = Product::whereIn('id', $productIds)->pluck('type', 'id');

            $handledItemIds = [];

            foreach ($items as $itemData) {
                $productId = $itemData['product_id'];
                $orderItemId = $itemData['order_item_id'] ?? null;

                // [WHY] Try to find the item by its specific ID first (most accurate).
                // Fallback to finding by product_id if it's a new item or from an older client.
                $orderItem = $orderItemId ? $existingItemsById->get($orderItemId) : null;

                if (!$orderItem && !$orderItemId) {
                    // Legacy/Draft fallback: find first available item for this product that hasn't been handled
                    $potentialMatches = $existingItemsByProduct->get($productId);
                    if ($potentialMatches) {
                        $orderItem = $potentialMatches->first(fn($item) => !in_array($item->id, $handledItemIds));
                    }
                }

                $productType = $productTypes->get($productId);
                if (!$productType) {
                    Log::warning("Order item checkout: Product ID {$productId} has no type defined. Defaulting to 'food'.");
                    $productType = 'food';
                }

                if ($orderItem) {
                    $handledItemIds[] = $orderItem->id;
                    $orderItem->order_id = $orderId;
                    $orderItem->quantity = $itemData['quantity'];
                    $orderItem->table_id = $itemData['table_id'] ?? $order->table_id;
                    if (array_key_exists('note', $itemData)) {
                        $orderItem->note = $itemData['note'];
                    }
                } else {
                    $product = Product::find($productId);
                    $orderItem = OrderItem::create([
                        'order_id' => $orderId,
                        'product_id' => $productId,
                        'name' => $product?->name ?? 'Unknown Product',
                        'type' => $productType,
                        'table_id' => $itemData['table_id'] ?? $order->table_id,
                        'quantity' => $itemData['quantity'],
                        'price' => $itemData['price'],
                        'note' => $itemData['note'] ?? null,
                        'status' => 'pending'
                    ]);
                    $handledItemIds[] = $orderItem->id;
                }

                $discount = $itemData['discount'] ?? 0;
                $discountType = $itemData['discount_type'] ?? 'fixed';
                $itemGross = $orderItem->price * $orderItem->quantity;
                $itemDiscountAmount = 0;

                if ($discount > 0) {
                    if ($discountType === 'percent') {
                        $itemDiscountAmount = ($itemGross * $discount) / 100;
                    } else {
                        $itemDiscountAmount = $discount * $orderItem->quantity;
                    }
                }

                $orderItem->discount = $discount;
                $orderItem->discount_type = $discountType;
                $orderItem->save();

                $totalPrice += ($itemGross - $itemDiscountAmount);
            }

            // [WHY] Delete only the items that were NOT handled in the loop above.
            // This correctly removes specific rows while preserving duplicates of the same product.
            OrderItem::where('order_id', $orderId)
                ->whereNotIn('id', $handledItemIds)
                ->delete();

            $wasDraft = $order->status === 'draft';
            $order->update([
                'total_price' => $totalPrice,
                'status' => 'pending',
                'merged_tables' => $mergedTables ?? $order->merged_tables,
                'order_note' => $orderNote ?? $order->order_note,
                'guest_count' => $guestCount ?? $order->guest_count
            ]);

            if ($mergedTables) {
                $ids = explode('-', $mergedTables);
                Order::whereIn('table_id', $ids)
                    ->whereIn('status', ['draft', 'pending', 'processing'])
                    ->update(['merged_tables' => $mergedTables]);

                Table::whereIn('id', $ids)->update(['status' => 'busy']);
            } else if ($order->table_id) {
                Table::where('id', $order->table_id)->update(['status' => 'busy']);
            }

            return ['order' => $order, 'wasDraft' => $wasDraft];
        });

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

        try {
            broadcast(new OrderUpdated($order, 'item_status_updated'));
        } catch (\Exception $e) {
            Log::error('Broadcast failed during item status update: ' . $e->getMessage());
        }

        return $order;
    }

    // [WHY] Dedicated endpoint to save the order-level staff note without requiring a full re-checkout.
    public function updateOrderNote($orderId, string $note)
    {
        $order = Order::findOrFail($orderId);
        $order->order_note = $note;
        $order->save();

        $order->load([
            'items.product:id,name,price,type',
            'table:id,name',
            'server:id,name',
            'cashier:id,name'
        ]);

        try {
            broadcast(new OrderUpdated($order, 'order_updated'));
        } catch (\Exception $e) {
            Log::error('Broadcast failed during order note update: ' . $e->getMessage());
        }

        return $order;
    }

    public function updateGuestCount($orderId, int $count)
    {
        $order = Order::findOrFail($orderId);
        $order->guest_count = $count;
        $order->save();

        $order->load([
            'items.product:id,name,price,type',
            'table:id,name',
            'server:id,name',
            'cashier:id,name'
        ]);

        try {
            broadcast(new OrderUpdated($order, 'order_updated'));
        } catch (\Exception $e) {
            Log::error('Broadcast failed during guest count update: ' . $e->getMessage());
        }

        return $order;
    }

    // --- Delegated Methods ---

    public function completeOrder($orderId, $data)
    {
        return $this->paymentService->completeOrder($orderId, $data);
    }

    public function reopenOrder($orderId)
    {
        return $this->paymentService->reopenOrder($orderId);
    }

    public function updatePayment($orderId, $data)
    {
        return $this->paymentService->updatePayment($orderId, $data);
    }

    public function getHistory($limit = 20, $date = null)
    {
        return $this->paymentService->getHistory($limit, $date);
    }

    public function updateTable($orderId, $newTableId)
    {
        return $this->tableService->updateTable($orderId, $newTableId);
    }

    public function splitItems($orderId, array $items)
    {
        return $this->splitService->splitItems($orderId, $items);
    }
}
