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
    public function confirmGroupReservation(Reservation $reservation, array $tableIds, $userId = null)
    {
        return DB::transaction(function () use ($reservation, $tableIds, $userId) {
            // [WHY] Mark reservation as confirmed
            $reservation->update(['status' => 'confirmed']);

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
            foreach ($tableIds as $tableId) {
                if ($existingOrders->has($tableId)) {
                    // [NOTE] Safety check, usually tables should be free, but POS is dynamic
                    $order = $existingOrders->get($tableId);
                    
                    // [WHY] Update to link to reservation if not linked
                    if (!$order->reservation_id || $order->merged_tables !== $mergedTablesString) {
                        $order->update([
                            'reservation_id' => $reservation->id,
                            'merged_tables' => $mergedTablesString
                        ]);
                    }
                } else {
                    $order = Order::create([
                        'table_id' => $tableId,
                        'reservation_id' => $reservation->id,
                        'merged_tables' => $mergedTablesString,
                        'user_id' => $userId,
                        'status' => 'pending',
                        'subtotal' => 0,
                        'total_price' => 0,
                    ]);
                }

                $orders[$tableId] = $order;
            }

            // [WHY] Convert reservation_items -> order_items
            // [RULE] We generate an array to do a bulk insert, avoiding N+1 INSERTS
            $mainOrder = $orders[$mainTableId];
            $orderItemsToInsert = [];
            $now = now();
            
            foreach ($reservation->items as $resItem) {
                // [NOTE] table_id is intentionally null to denote collective/shared items in checkout GUI
                $orderItemsToInsert[] = [
                    'order_id' => $mainOrder->id,
                    'product_id' => $resItem->product_id,
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

            return $orders;
        });
    }
}
