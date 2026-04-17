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
            ->where(function($query) {
                // [RULE] Exclude group reservations from individual ordering flow
                // This ensures "extras" are created as separate orders
                $query->whereDoesntHave('reservation')
                    ->orWhereHas('reservation', function($q) {
                        $q->where('type', '!=', 'group');
                    });
            })
            ->with([
                'items.product' => function($query) {
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
                
                // [ERROR CHECKING] Ensure we have a valid product type for status assignment
                if (!$productType) {
                    Log::warning("Order item checkout: Product ID {$productId} has no type defined. Defaulting to 'food'.");
                    $productType = 'food';
                }

                if ($orderItem) {
                    // [RULE] OVERWRITE quantity instead of accumulating
                    $orderItem->quantity = $itemData['quantity'];
                    $orderItem->table_id = $itemData['table_id'] ?? $order->table_id;
                    if (array_key_exists('note', $itemData)) {
                        $orderItem->note = $itemData['note'];
                    }
                    
                    // [BUSINESS] Standardized behavior: All items start as pending to ensure they appear on Bar/Kitchen monitors
                    // Previously, drinks were auto-served here, which we have now removed to support Bar tracking.
                    
                    $orderItem->save();
                } else {
                    $orderItem = OrderItem::create([
                        'order_id' => $orderId,
                        'product_id' => $productId,
                        'table_id' => $itemData['table_id'] ?? $order->table_id,
                        'quantity' => $itemData['quantity'],
                        'price' => $itemData['price'],
                        'note' => $itemData['note'] ?? null,
                        'status' => 'pending'
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

            // [WHY] Identify all active orders that should be completed together as a group
            $relatedOrders = Order::whereIn('status', ['pending', 'processing', 'draft'])
                ->where(function($query) use ($order, $involvedTableIds) {
                    $query->whereIn('table_id', $involvedTableIds);
                    if ($order->reservation_id) {
                        $query->orWhere('reservation_id', $order->reservation_id);
                    }
                })
                ->get();

            // [CALC] 1. Calculate combined subtotal across all related orders
            $groupSubtotal = $relatedOrders->sum('total_price');
            $discountType = $data['discount_type'] ?? null;
            $discountValue = $data['discount_value'] ?? 0;
            $groupDiscountAmount = 0;

            if ($discountType === 'percent') {
                $groupDiscountAmount = floor(($groupSubtotal * $discountValue) / 100);
            } elseif ($discountType === 'fixed') {
                $groupDiscountAmount = $discountValue;
            }
            
            // [RULE] Ensure discount doesn't exceed subtotal
            $groupDiscountAmount = min($groupSubtotal, $groupDiscountAmount);

            // [WHY] 2. Finalize ALL related orders
            foreach ($relatedOrders as $o) {
                $isPrimary = $o->id == $orderId;
                
                // [RULE] Standardized completion data
                $updateData = [
                    'status' => 'completed',
                    'payment_method' => $data['payment_method'] ?? null,
                    'cashier_id' => $data['cashier_id'] ?? null,
                    'cashier_note' => $data['cashier_note'] ?? $o->cashier_note,
                    'subtotal' => $o->total_price,
                    'reservation_id' => $order->reservation_id,
                    'merged_tables' => $order->merged_tables,
                ];

                if ($isPrimary) {
                    // [RULE] Primary order carries the full group discount data
                    $updateData['discount_type'] = $discountType;
                    $updateData['discount_value'] = $discountValue;
                    $updateData['discount_amount'] = $groupDiscountAmount;
                    $updateData['total_price'] = $o->total_price - $groupDiscountAmount;
                } else {
                    // [RULE] Secondary orders are completed with 0 individual discount
                    $updateData['discount_type'] = null;
                    $updateData['discount_value'] = 0;
                    $updateData['discount_amount'] = 0;
                    $updateData['total_price'] = $o->total_price;
                }

                $o->update($updateData);
            }

            // [WHY] 3. Free tables ONLY if no more active orders remain
            // Since we just completed all related orders, we check again for any outliers
            foreach ($involvedTableIds as $tId) {
                $stillBusy = Order::where('table_id', $tId)
                    ->whereIn('status', ['draft', 'pending', 'processing'])
                    ->exists();

                if (!$stillBusy) {
                    Table::where('id', $tId)->update(['status' => 'empty']);
                }
            }

            // [WHY] 4. Update reservation status if it's a group reservation
            if ($order->reservation_id) {
                $reservation = \App\Models\Reservation::find($order->reservation_id);
                if ($reservation && $reservation->type === 'group') {
                    $reservation->update(['status' => 'completed']);
                }
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

            // [REALTIME] Broadcast reservation update so ReservationList can filter it out instantly
            if ($result->reservation_id) {
                $reservation = \App\Models\Reservation::find($result->reservation_id);
                if ($reservation && $reservation->type === 'group') {
                    broadcast(new \App\Events\ReservationUpdated($reservation, 'updated'));
                }
            }
        } catch (\Exception $e) {
            Log::error('Broadcast failed during order completion: ' . $e->getMessage());
        }

        return $result;
    }

    // [WHY] Fetch completed orders for the History panel
    public function getHistory($limit = 20)
    {
        return Order::with(['items.product:id,name,price,type', 'table:id,name', 'server:id,name', 'cashier:id,name', 'reservation'])
            ->where('status', 'completed')
            ->orderBy('updated_at', 'desc')
            ->orderBy('id', 'desc')
            ->limit($limit)
            ->get();
    }

    // [WHY] Revert a completed order to pending state
    // [RULE] Updates table status to busy
    public function reopenOrder($orderId)
    {
        $result = DB::transaction(function () use ($orderId) {
            $order = Order::findOrFail($orderId);
            
            // [WHY] Identify all involved table IDs in the merge group
            $involvedTableIds = [$order->table_id];
            if ($order->merged_tables) {
                $mergedIds = explode('-', $order->merged_tables);
                $involvedTableIds = array_merge($involvedTableIds, $mergedIds);
            }
            $involvedTableIds = array_unique(array_filter($involvedTableIds));

            // [WHY] Find all orders that were completed together as part of this group
            $relatedOrders = Order::where('status', 'completed')
                ->where(function($query) use ($order, $involvedTableIds) {
                    $query->whereIn('table_id', $involvedTableIds);
                    if ($order->reservation_id) {
                        $query->orWhere('reservation_id', $order->reservation_id);
                    }
                })
                // Rule: Ensure we only reopen orders that are logically linked (same merge string or reservation)
                ->where(function($query) use ($order) {
                    if ($order->merged_tables) {
                        $query->where('merged_tables', $order->merged_tables);
                    }
                    if ($order->reservation_id) {
                        $query->orWhere('reservation_id', $order->reservation_id);
                    }
                })
                ->get();

            foreach ($relatedOrders as $o) {
                // [WHY] Check if table is already busy with ANOTHER active order (not part of this group)
                if ($o->table_id) {
                    $isTableOccupied = Order::where('table_id', $o->table_id)
                        ->whereIn('status', ['pending', 'processing', 'draft'])
                        ->exists();
                    
                    if ($isTableOccupied) {
                        throw new \Exception("Cannot reopen order: Table {$o->table_id} is currently occupied by another active order.");
                    }
                }

                $o->update([
                    'status' => 'pending',
                    'payment_method' => null,
                    'cashier_id' => null,
                    'discount_type' => null,
                    'discount_value' => 0,
                    'discount_amount' => 0
                ]);

                if ($o->table_id) {
                    \App\Models\Table::where('id', $o->table_id)->update(['status' => 'busy']);
                }
            }

            // [WHY] Handle group reservation state revert
            if ($order->reservation_id) {
                $reservation = \App\Models\Reservation::find($order->reservation_id);
                if ($reservation && $reservation->status === 'completed') {
                    $reservation->update(['status' => 'confirmed']);
                }
            }

            return $order;
        });

        $result->load(['items.product:id,name,price,type', 'table:id,name', 'server:id,name', 'cashier:id,name']);

        try {
            broadcast(new \App\Events\OrderUpdated($result, 'order_updated'));
            if ($result->reservation_id) {
                $reservation = \App\Models\Reservation::find($result->reservation_id);
                if ($reservation) {
                    broadcast(new \App\Events\ReservationUpdated($reservation, 'updated'));
                }
            }
        } catch (\Exception $e) {
            \Log::error('Broadcast failed during order reopen: ' . $e->getMessage());
        }

        return $result;
    }

    // [WHY] Update payment record for a completed order
    public function updatePayment($orderId, $data)
    {
        $order = Order::findOrFail($orderId);
        
        // [WHY] Identify all involved table IDs in the merge group
        $involvedTableIds = [$order->table_id];
        if ($order->merged_tables) {
            $mergedIds = explode('-', $order->merged_tables);
            $involvedTableIds = array_merge($involvedTableIds, $mergedIds);
        }
        $involvedTableIds = array_unique(array_filter($involvedTableIds));

        // [WHY] Find all orders that were completed together as part of this group
        $relatedOrders = Order::where('status', 'completed')
            ->where(function($query) use ($order, $involvedTableIds) {
                $query->whereIn('table_id', $involvedTableIds);
                if ($order->reservation_id) {
                    $query->orWhere('reservation_id', $order->reservation_id);
                }
            })
            // Rule: Ensure we only update orders that are logically linked
            ->where(function($query) use ($order) {
                if ($order->merged_tables) {
                    $query->where('merged_tables', $order->merged_tables);
                }
                if ($order->reservation_id) {
                    $query->orWhere('reservation_id', $order->reservation_id);
                }
            })
            ->get();

        // [CALC] 1. Calculate combined subtotal across all related orders
        // Use subtotal if available, otherwise reconstruct from total_price + discount_amount
        $groupSubtotal = $relatedOrders->sum(function($o) {
            return $o->subtotal ?? ($o->total_price + $o->discount_amount);
        });

        $discountType = $data['discount_type'] ?? $order->discount_type;
        $discountValue = $data['discount_value'] ?? $order->discount_value;
        $groupDiscountAmount = 0;

        if ($discountType === 'percent') {
            $groupDiscountAmount = floor(($groupSubtotal * $discountValue) / 100);
        } elseif ($discountType === 'fixed') {
            $groupDiscountAmount = $discountValue;
        }
        
        $groupDiscountAmount = min($groupSubtotal, $groupDiscountAmount);

        // [WHY] 2. Update ALL related orders
        foreach ($relatedOrders as $o) {
            $isPrimary = $o->id == $orderId;
            
            $updateData = [
                'payment_method' => $data['payment_method'] ?? $o->payment_method,
                'cashier_note' => $data['cashier_note'] ?? $o->cashier_note,
            ];

            if ($isPrimary) {
                $updateData['discount_type'] = $discountType;
                $updateData['discount_value'] = $discountValue;
                $updateData['discount_amount'] = $groupDiscountAmount;
                $updateData['total_price'] = ($o->subtotal ?? $o->total_price) - $groupDiscountAmount;
            } else {
                $updateData['discount_type'] = null;
                $updateData['discount_value'] = 0;
                $updateData['discount_amount'] = 0;
                $updateData['total_price'] = ($o->subtotal ?? $o->total_price);
            }

            $o->update($updateData);
        }

        $order->load(['items.product:id,name,price,type', 'table:id,name', 'server:id,name', 'cashier:id,name']);
        
        try {
            broadcast(new \App\Events\OrderUpdated($order, 'order_updated'));
        } catch (\Exception $e) {
            \Log::error('Broadcast failed during payment update: ' . $e->getMessage());
        }

        return $order;
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