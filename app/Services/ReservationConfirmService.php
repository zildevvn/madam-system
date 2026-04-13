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
            // [RULE] We generate an array to do a bulk insert, avoiding N+1 INSERTS
            $orderItemsToInsert = [];
            $now = now();
            $totalPrice = $mainOrder->total_price;
            
            foreach ($reservation->items as $resItem) {
                $orderItemsToInsert[] = [
                    'order_id' => $mainOrder->id,
                    'product_id' => null, // [WHY] IDs removed as per user request
                    'name' => $resItem->name,
                    'type' => $resItem->type ?? 'food', // [WHY] Use type from reservation item
                    'table_id' => null, 
                    'quantity' => $resItem->quantity,
                    'price' => $resItem->price,
                    'status' => 'pending', 
                    'source' => 'reservation', 
                    'reservation_item_id' => $resItem->id,
                    'created_at' => $now,
                    'updated_at' => $now
                ];
                $totalPrice += ($resItem->price * $resItem->quantity);
            }

            if (!empty($orderItemsToInsert)) {
                OrderItem::insert($orderItemsToInsert);
                $mainOrder->update([
                    'total_price' => $totalPrice,
                    'subtotal' => $totalPrice
                ]);
            }

            // [WHY] Trigger real-time data push to Kitchen and Bill systems
            if ($mainOrder) {
                event(new \App\Events\OrderUpdated($mainOrder, 'order_created'));
            }

            return [$mainTableId => $mainOrder];
        });
    }
}
