<?php

namespace App\Http\Resources\API\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,

            'table_id' => $this->table_id,
            'reservation_id' => $this->reservation_id,
            'user_id' => $this->user_id,
            'cashier_id' => $this->cashier_id,

            'merged_tables' => $this->merged_tables,
            'order_type' => $this->order_type,
            'status' => $this->status,

            'is_printed' => $this->is_printed,
            'printed_at' => $this->printed_at,
            'print_count' => $this->print_count,

            'subtotal' => $this->subtotal,
            'total_price' => $this->total_price,

            'discount_type' => $this->discount_type,
            'discount_value' => $this->discount_value,
            'discount_amount' => $this->discount_amount,

            'payment_method' => $this->payment_method,

            'cashier_note' => $this->cashier_note,
            'order_note' => $this->order_note,

            'guest_count' => $this->guest_count,

            'parent_order_id' => $this->parent_order_id,

            'completed_at' => $this->completed_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,

            /*
             * Relationships
             */
            'table' => $this->whenLoaded(
                'table',
                fn() => $this->table
                    ? [
                        'id' => $this->table->id,
                        'name' => $this->table->name,
                    ]
                    : null
            ),

            'reservation' => $this->whenLoaded(
                'reservation',
                fn() => $this->reservation
                    ? [
                        'id' => $this->reservation->id,
                        'lead_name' => $this->reservation->lead_name,
                        'phone' => $this->reservation->phone,
                    ]
                    : null
            ),

            'items' => $this->whenLoaded(
                'items',
                fn() => $this->items
            ),

            'payments' => $this->whenLoaded(
                'payments',
                fn() => $this->payments
            ),

            'parent_order' => $this->whenLoaded(
                'parentOrder',
                fn() => $this->parentOrder
                    ? [
                        'id' => $this->parentOrder->id,
                        'parent_order_id' => $this->parentOrder->parent_order_id,
                        'status' => $this->parentOrder->status,
                    ]
                    : null
            ),

            'child_orders' => $this->whenLoaded(
                'childOrders',
                fn() => $this->childOrders->map(
                    fn($child) => [
                        'id' => $child->id,
                        'parent_order_id' => $child->parent_order_id,
                        'status' => $child->status,
                    ]
                )->values()
            ),
        ];
    }
}