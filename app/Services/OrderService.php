<?php

namespace App\Services;

use App\Models\Product;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Table;
use App\Models\Reservation;
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

    // [WHY] Get active orders to display on tablet/pos
    // [RULE] Eager load only required fields for performance
    public function getActiveOrder($tableId)
    {
        $orders = Order::where('table_id', $tableId)
            ->whereIn('status', ['draft', 'pending', 'processing'])
            ->where(function ($query) {
                $query->whereDoesntHave('reservation')
                    ->orWhereHas('reservation', function ($q) {
                        $q->where('type', '!=', 'group');
                    });
            })
            ->with([
                'items.product' => function ($query) {
                    $query->select('id', 'name', 'name_vi', 'price', 'type');
                },
                'childOrders.items.product' => function ($query) {
                    $query->select('id', 'name', 'name_vi', 'price', 'type');
                },
                'table:id,name',
                'server:id,name',
                'cashier:id,name'
            ])
            ->orderByRaw('parent_order_id IS NOT NULL, id ASC')
            ->get();

        return $orders;
    }

    // [WHY] Fetch full details for a specific order
    public function getOrder($id)
    {
        return Order::with([
            'items.product' => function ($query) {
                $query->select('id', 'name', 'name_vi', 'price', 'type');
            },
            'childOrders.items.product' => function ($query) {
                $query->select('id', 'name', 'name_vi', 'price', 'type');
            },
            'parentOrder.items.product' => function ($query) {
                $query->select('id', 'name', 'name_vi', 'price', 'type');
            },
            'table:id,name',
            'server:id,name',
            'cashier:id,name'
        ])->findOrFail($id);
    }

    // [WHY] Delete draft orders or cancel pending/processing orders
    public function cancelOrder($id, array $data = [])
    {
        $order = Order::with('reservation')->find($id);
        if (!$order) return false;

        if ($order->status === 'draft') {
            $order->delete();
            return true;
        }

        if (in_array($order->status, ['pending', 'processing'])) {
            $result = DB::transaction(function() use ($order, $data) {
                // Find all related orders (merged or grouped)
                $involvedTableIds = $this->paymentService->getInvolvedTableIds($order);
                $relatedOrders = $this->paymentService->getRelatedOrders($order, $involvedTableIds, ['pending', 'processing', 'draft'], $data);

                foreach ($relatedOrders as $o) {
                    $o->status = 'cancelled';
                    $o->save();
                }

                // Free up the tables
                foreach ($involvedTableIds as $tId) {
                    $stillBusy = Order::where('table_id', $tId)
                        ->whereIn('status', ['draft', 'pending', 'processing'])
                        ->exists();

                    if (!$stillBusy) {
                        Table::where('id', $tId)->update(['status' => 'available']);
                    }
                }

                if ($order->reservation_id) {
                    $reservation = Reservation::find($order->reservation_id);
                    if ($reservation && $reservation->status === Reservation::STATUS_SEATED) {
                        $reservation->update(['status' => Reservation::STATUS_CONFIRMED]);
                    }
                }

                return $order;
            });

            try {
                broadcast(new OrderUpdated($result, 'order_updated'));
            } catch (\Exception $e) {
                Log::error('Broadcast failed during order cancellation: ' . $e->getMessage());
            }

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
            'items.product:id,name,name_vi,price',
            'table:id,name',
            'server:id,name',
            'cashier:id,name'
        ]);
    }

    // [WHY] Submit kitchen order and sync items
    public function checkoutOrder($orderId, array $items, $mergedTables = null, $orderNote = null, $guestCount = null, $userId = null)
    {
        $result = DB::transaction(function () use ($orderId, $items, $mergedTables, $orderNote, $guestCount, $userId) {
            $order = Order::findOrFail($orderId);
            $totalPrice = 0;

            // [WHY] Identify all orders in the merge group to prevent item duplication.
            // If we only look at the primary order, items belonging to other tables in the merge
            // would be treated as "new" and cloned into the primary order, while also remaining
            // in their original orders.
            // [FIX] CRITICAL: If this order is a split child (has parent_order_id), scope
            // $involvedOrderIds to ONLY itself. Split children are independent; looking at
            // all table orders would include the parent's items in $existingItems, and the
            // product-based fallback lookup could accidentally steal parent items by setting
            // $orderItem->order_id = $orderId on a parent item.
            if ($order->parent_order_id) {
                $involvedOrderIds = [$order->id];
            } else {
                $mergedString = $mergedTables ?? $order->merged_tables;
                $tableIds = $mergedString ? explode('-', $mergedString) : [$order->table_id];
                
                // [FIX] Exclude split child orders (those with parent_order_id) from the
                // involved set. Split children have their own checkout flow and must not
                // be interfered with during a parent/merged table checkout.
                $involvedOrderIds = Order::whereIn('table_id', $tableIds)
                    ->whereIn('status', ['draft', 'pending', 'processing'])
                    ->whereNull('parent_order_id')
                    ->pluck('id')
                    ->toArray();
                // Always include the order itself in case it was filtered out
                if (!in_array($order->id, $involvedOrderIds)) {
                    $involvedOrderIds[] = $order->id;
                }
            }

            $existingItems = OrderItem::whereIn('order_id', $involvedOrderIds)->orderBy('sort_order')->get();
            $existingItemsById = $existingItems->keyBy('id');
            $existingItemsByProduct = $existingItems->groupBy('product_id');

            $productIds = collect($items)->pluck('product_id')->filter()->toArray();
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
                    if (!is_null($productId)) {
                        $potentialMatches = $existingItemsByProduct->get($productId);
                        if ($potentialMatches) {
                            $orderItem = $potentialMatches->first(fn($item) => !in_array($item->id, $handledItemIds));
                        }
                    }
                }

                $productType = null;
                if (!is_null($productId)) {
                    $productType = $productTypes->get($productId);
                }
                if (!$productType) {
                    $productType = $itemData['type'] ?? 'food';
                }

                if ($orderItem) {
                    $handledItemIds[] = $orderItem->id;
                    $orderItem->order_id = $orderId;
                    
                    $quantityDiff = $itemData['quantity'] - $orderItem->quantity;
                    
                    if ($quantityDiff > 0) {
                        // [WHY] If the user increased the quantity of an ALREADY ORDERED item,
                        // we MUST NOT just update the quantity. Because the item might already be 
                        // 'processing' or 'completed' and just updating quantity won't trigger 
                        // the kitchen to make the new items!
                        // Instead, we split the added quantity into a NEW 'pending' order item.
                        $newOrderItem = $orderItem->replicate();
                        $newOrderItem->quantity = $quantityDiff;
                        $newOrderItem->status = 'pending';
                        if (array_key_exists('note', $itemData)) {
                            $newOrderItem->note = $itemData['note'];
                        }
                        
                        // Recalculate discount for the new order item
                        $discount = $itemData['discount'] ?? 0;
                        $discountType = $itemData['discount_type'] ?? 'fixed';
                        $newItemGross = $newOrderItem->price * $newOrderItem->quantity;
                        $newItemDiscountAmount = 0;
                        if ($discount > 0) {
                            if ($discountType === 'percent') {
                                $newItemDiscountAmount = ($newItemGross * $discount) / 100;
                            } else {
                                $newItemDiscountAmount = $discount * $newOrderItem->quantity;
                            }
                        }
                        $newOrderItem->discount = $discount;
                        $newOrderItem->discount_type = $discountType;
                        $newOrderItem->save();
                        
                        $handledItemIds[] = $newOrderItem->id;
                        
                        // [FIX] Add the newly replicated item's price (net of item discount) to the order total
                        $totalPrice += ($newItemGross - $newItemDiscountAmount);
                        
                        // Subtract the new item's price from total (since the old item loop recalculates its own)
                        // Wait, the main loop recalculates the ORIGINAL item using $itemData['quantity']
                        // which is the SUM of old + new. So we MUST update the original item's quantity back to old!
                        // No, the original item stays at its OLD quantity.
                        $itemData['quantity'] = $orderItem->quantity; 
                        
                        if (array_key_exists('note', $itemData)) {
                            $orderItem->note = $itemData['note'];
                        }
                    } else {
                        // Quantity decreased or stayed the same, just update
                        $orderItem->quantity = $itemData['quantity'];
                        if (array_key_exists('note', $itemData)) {
                            $orderItem->note = $itemData['note'];
                        }
                    }

                    $orderItem->table_id = $itemData['table_id'] ?? $order->table_id;
                    if (is_null($orderItem->product_id)) {
                        $orderItem->name = $itemData['name'] ?? $orderItem->name ?? 'Custom Item';
                        $orderItem->type = $productType;
                    }
                } else {
                    $product = $productId ? Product::find($productId) : null;
                    $maxSortOrder = OrderItem::where('order_id', $orderId)->max('sort_order') ?? 0;
                    $orderItem = OrderItem::create([
                        'order_id' => $orderId,
                        'product_id' => $productId,
                        'name' => $productId ? ($product?->name ?? 'Unknown Product') : ($itemData['name'] ?? 'Custom Item'),
                        'type' => $productType,
                        'table_id' => $itemData['table_id'] ?? $order->table_id,
                        'quantity' => $itemData['quantity'],
                        'price' => $itemData['price'],
                        'note' => $itemData['note'] ?? null,
                        'status' => 'pending',
                        'sort_order' => $maxSortOrder + 1
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
            $updateData = [
                'total_price' => $totalPrice,
                'status' => 'pending',
                'merged_tables' => $mergedTables ?? $order->merged_tables,
                'order_note' => $orderNote ?? $order->order_note,
                'guest_count' => $guestCount ?? $order->guest_count
            ];
            if (!$order->user_id && $userId) {
                $updateData['user_id'] = $userId;
            }
            $order->update($updateData);

            if ($mergedTables) {
                $ids = explode('-', $mergedTables);
                // [WHY] Set total_price = 0 for secondary orders to prevent duplicated revenue when StatsService aggregates them.
                // The primary order ($orderId) contains the full consolidated total_price.
                Order::whereIn('table_id', $ids)
                    ->where('id', '!=', $orderId)
                    ->whereIn('status', ['draft', 'pending', 'processing'])
                    ->update(['merged_tables' => $mergedTables, 'total_price' => 0]);
                
                // Ensure primary order also gets the merged_tables string explicitly updated if missing
                Order::where('id', $orderId)->update(['merged_tables' => $mergedTables]);

                Table::whereIn('id', $ids)->update(['status' => 'busy']);
            } else if ($order->table_id) {
                Table::where('id', $order->table_id)->update(['status' => 'busy']);
            }

            return ['order' => $order, 'wasDraft' => $wasDraft];
        });

        try {
            $orderObj = $result['order'];
            $orderObj->load(['items.product:id,name,name_vi,price,type', 'table:id,name', 'server:id,name', 'cashier:id,name']);
            broadcast(new OrderUpdated($orderObj, $result['wasDraft'] ? 'order_created' : 'order_updated'));
        } catch (\Exception $e) {
            Log::error('Broadcast failed during checkout: ' . $e->getMessage());
        }

        return $orderObj;
    }

    // [WHY] Update progress of a specific item
    public function updateItemStatus($itemId, $status, $quantity = null)
    {
        $item = OrderItem::findOrFail($itemId);
        
        if ($quantity && $quantity < $item->quantity) {
            // Replicate for the newly served portion
            $servedItem = $item->replicate();
            $servedItem->quantity = $quantity;
            $servedItem->status = $status;
            $servedItem->save();

            // Explicitly preserve original timestamps for the new row
            // to prevent the frontend from treating it as a newly added order.
            OrderItem::where('id', $servedItem->id)->update([
                'created_at' => $item->created_at,
                'updated_at' => $item->updated_at
            ]);
            
            // Keep original item for the remaining portion
            $item->quantity = $item->quantity - $quantity;
            // $item->status stays the same
            $item->save();
        } else {
            $item->status = $status;
            $item->save();
        }

        $order = $item->order;
        $order->load([
            'items.product:id,name,name_vi,price',
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
            'items.product:id,name,name_vi,price,type',
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
            'items.product:id,name,name_vi,price,type',
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

    public function markAsPrinted($orderId, array $siblingOrderIds = [])
    {
        $orderIds = array_merge([$orderId], $siblingOrderIds);

        DB::transaction(function () use ($orderIds) {
            // [FIX] Use raw DB::table() queries instead of Eloquent to prevent auto-touching
            // updated_at. The history view filters by whereDate('updated_at', $date), so any
            // Eloquent update/increment would re-date historical bills to today, causing them
            // to disappear from their original date when printing an old invoice.
            DB::table('orders')->whereIn('id', $orderIds)->update([
                'is_printed' => true,
                'printed_at' => now()
            ]);
            DB::table('orders')->whereIn('id', $orderIds)->increment('print_count');
        });

        $order = Order::findOrFail($orderId);
        $order->load([
            'items.product:id,name,name_vi,price,type',
            'table:id,name',
            'server:id,name',
            'cashier:id,name'
        ]);

        try {
            broadcast(new OrderUpdated($order, 'order_updated'));
        } catch (\Exception $e) {
            Log::error('Broadcast failed during mark as printed: ' . $e->getMessage());
        }

        return $order;
    }
}
