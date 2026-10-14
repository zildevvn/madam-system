<?php

namespace Database\Factories;

use App\Models\Order;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Order>
 */
class OrderFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'table_id' => \App\Models\Table::factory(),
            'reservation_id' => \App\Models\Reservation::factory(),
            'user_id' => null,
            'cashier_id' => null,
            'merged_tables' => null,
            'order_type' => 'dine_in',
            'status' => \App\Models\Order::STATUS_PENDING,
            'is_printed' => false,
            'printed_at' => null,
            'print_count' => 0,
            'subtotal' => 0,
            'total_price' => 0,
            'discount_type' => null,
            'discount_value' => 0,
            'discount_amount' => 0,
            'payment_method' => null,
            'cashier_note' => null,
            'order_note' => null,
            'guest_count' => 1,
            'parent_order_id' => null,
            'completed_at' => null,
        ];
    }
}
