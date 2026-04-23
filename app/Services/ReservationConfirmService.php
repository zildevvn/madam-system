<?php

namespace App\Services;

use App\Models\Reservation;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Support\Facades\DB;

class ReservationConfirmService
{
    /**
     * [WHY] Confirms a group reservation, creating the necessary orders exactly like the existing flow.
     * [RULE] Converts pre-ordered items into order items collectively shared across the merged orders.
     */
    public function confirmGroupReservation(Reservation $reservation, array $tableIds, $staffId = null)
    {
        return DB::transaction(function () use ($reservation, $tableIds, $staffId) {
            // [WHY] Mark reservation as confirmed and save staff assignment
            $reservation->update([
                'status' => 'confirmed',
                'staff_id' => $staffId
            ]);

            // [WHY] Sort table ids to make it deterministic (e.g., lowest ID is main order)
            sort($tableIds);

            $mainTableId = collect($tableIds)->first();
            $orders = [];

            $mergedTablesString = count($tableIds) > 1 ? implode('-', $tableIds) : null;

            // [WHY] Load existing active orders outside the loop to avoid N+1 queries
            $existingOrders = Order::whereIn('table_id', $tableIds)
                ->whereIn('status', ['pending', 'processing'])
                ->get()
                ->keyBy('table_id');

            // [WHY] Create standard orders for ALL assigned tables
            // [WHY] Create ONE standard order for the combined group
            if ($existingOrders->has($mainTableId)) {
                $mainOrder = $existingOrders->get($mainTableId);
                
                // [WHY] Update to link to reservation if not linked
                if (!$mainOrder->reservation_id || $mainOrder->merged_tables !== $mergedTablesString || $mainOrder->user_id !== $staffId) {
                    $mainOrder->update([
                        'reservation_id' => $reservation->id,
                        'merged_tables' => $mergedTablesString,
                        'user_id' => $staffId
                    ]);
                }
            } else {
                $mainOrder = Order::create([
                    'table_id' => $mainTableId,
                    'reservation_id' => $reservation->id,
                    'merged_tables' => $mergedTablesString,
                    'user_id' => $staffId,
                    'status' => 'pending',
                    'subtotal' => 0,
                    'total_price' => 0,
                ]);
            }

            // [WHY] Convert reservation_items -> order_items
            // [RULE] If editing an existing reservation that already has an order, 
            // only sync the items that haven't been sent yet.
            $existingReservationItemIds = $mainOrder->items()
                ->where('source', 'reservation')
                ->whereNotNull('reservation_item_id')
                ->pluck('reservation_item_id')
                ->toArray();

            $orderItemsToInsert = [];
            $now = now();
            
            // [WHY] Filter only for genuinely NEW reservation items (prevents kitchen duplicates on edit)
            $newItems = $reservation->items->filter(function($item) use ($existingReservationItemIds) {
                return !in_array($item->id, $existingReservationItemIds);
            });

            foreach ($newItems as $resItem) {
                $orderItemsToInsert[] = [
                    'order_id' => $mainOrder->id,
                    'product_id' => null, 
                    'name' => $resItem->name,
                    'type' => $resItem->type ?? 'food', 
                    'table_id' => null, 
                    'quantity' => $resItem->quantity,
                    'price' => $resItem->price,
                    'status' => 'pending', 
                    'source' => 'reservation', 
                    'reservation_item_id' => $resItem->id,
                    'created_at' => $now,
                    'updated_at' => $now
                ];
            }

            if (!empty($orderItemsToInsert)) {
                OrderItem::insert($orderItemsToInsert);
            }

            // [WHY] Always recalculate the full order totals including existing and new items
            $totalPrice = $mainOrder->items()->sum(DB::raw('price * quantity'));

            // Always update order totals to stay in sync
            $mainOrder->update([
                'total_price' => $totalPrice,
                'subtotal' => $totalPrice
            ]);

            // [WHY] Trigger real-time data push to Kitchen and Bill systems
            // [RULE] If new items were added, broadcast as 'order_created' to trigger 
            // sound notifications and highlights in the kitchen/bar systems.
            $action = $newItems->isNotEmpty() ? 'order_created' : 'order_updated';

            try {
                if ($mainOrder) {
                    event(new \App\Events\OrderUpdated($mainOrder, $action));
                }
            } catch (\Exception $e) {
                \Log::warning("Real-time broadcast failed during reservation confirmation: " . $e->getMessage());
            }

            return [$mainTableId => $mainOrder];
        });
    }
}
