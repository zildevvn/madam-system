<?php

namespace App\Services;

use App\Models\Reservation;
use App\Models\Order;

class ReservationBillService
{
    /**
     * Generates a structured bill display for a group reservation.
     * It segregates items by their source to fulfilling the billing requirement:
     * - Pre-ordered Items (items from the reservation)
     * - Table X (items ordered ad-hoc during the meal)
     */
    public function getGroupBill(Reservation $reservation)
    {
        // 1. Fetch all orders tied to this reservation
        $orders = Order::with(['items.product', 'table'])
            ->where('reservation_id', $reservation->id)
            ->get();

        $billData = [
            'reservation_id' => $reservation->id,
            'lead_name' => $reservation->lead_name,
            'company_name' => $reservation->company_name,
            'total_amount' => 0,
            'pre_ordered_items' => [],
            'table_orders' => []
        ];

        // 2. Process and route each item into its correct display bucket
        foreach ($orders as $order) {
            $tableName = $order->table ? $order->table->name : 'Unknown Table';
            
            $tableData = [
                'table_name' => $tableName,
                'items' => []
            ];

            foreach ($order->items as $item) {
                // Determine item name securely
                $itemName = $item->product ? $item->product->name : 'Unknown Product';
                $itemTotal = $item->price * $item->quantity;

                // Add to the global reservation grand total
                $billData['total_amount'] += $itemTotal;

                if ($item->source === 'reservation') {
                    // This item was part of the original reservation booking
                    // We group it globally under 'Pre-ordered Items'
                    $billData['pre_ordered_items'][] = [
                        'id' => $item->id,
                        'name' => $itemName,
                        'quantity' => $item->quantity,
                        'price' => $item->price,
                        'total' => $itemTotal
                    ];
                } else {
                    // This item was ordered during the meal by standard POS flow
                    // We group it under its specific table
                    $tableData['items'][] = [
                        'id' => $item->id,
                        'name' => $itemName,
                        'quantity' => $item->quantity,
                        'price' => $item->price,
                        'total' => $itemTotal
                    ];
                }
            }

            // Only append the table section if they actually ordered normal items.
            // If a table just sat down and only ate the pre-ordered food, 
            // the schema keeps the table section clean.
            if (count($tableData['items']) > 0) {
                $billData['table_orders'][] = $tableData;
            }
        }

        return $billData;
    }
}
