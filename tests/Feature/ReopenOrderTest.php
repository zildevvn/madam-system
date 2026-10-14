<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Table;
use App\Models\Reservation;
use App\Services\OrderPaymentService;

class ReopenOrderTest extends TestCase
{
    use RefreshDatabase;

    protected OrderPaymentService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = $this->app->make(OrderPaymentService::class);
    }

    /** @test */
    public function reopen_order_with_fixed_global_discount()
    {
        $order = Order::factory()->create([
            'status' => Order::STATUS_COMPLETED,
            'discount_type' => 'fixed',
            'discount_value' => 200,
            'subtotal' => 1000,
            'total_price' => 800,
        ]);

        $reopened = $this->service->reopenOrder($order->id);

        $this->assertEquals(Order::STATUS_PENDING, $reopened->status);
        $this->assertNull($reopened->discount_type);
        $this->assertEquals(0, $reopened->discount_value);
        $this->assertEquals(0, $reopened->discount_amount);
        $this->assertEquals(1000, $reopened->total_price);
    }

    /** @test */
    public function reopen_order_with_percent_global_discount()
    {
        $order = Order::factory()->create([
            'status' => Order::STATUS_COMPLETED,
            'discount_type' => 'percent',
            'discount_value' => 20,
            'subtotal' => 1500,
            'total_price' => 1200,
        ]);

        $reopened = $this->service->reopenOrder($order->id);

        $this->assertEquals(Order::STATUS_PENDING, $reopened->status);
        $this->assertNull($reopened->discount_type);
        $this->assertEquals(1500, $reopened->total_price);
    }

    /** @test */
    public function reopen_order_without_global_discount()
    {
        $order = Order::factory()->create([
            'status' => Order::STATUS_COMPLETED,
            'discount_type' => null,
            'discount_value' => 0,
            'subtotal' => 800,
            'total_price' => 800,
        ]);

        $reopened = $this->service->reopenOrder($order->id);
        $this->assertEquals(800, $reopened->total_price);
    }

    /** @test */
    public function reopen_order_preserves_item_discounts_and_restores_total()
    {
        $order = Order::factory()->create([
            'status' => Order::STATUS_COMPLETED,
            'discount_type' => 'fixed',
            'discount_value' => 100,
            'subtotal' => 900,
            'total_price' => 800,
        ]);

        $reopened = $this->service->reopenOrder($order->id);
        $this->assertEquals(900, $reopened->total_price);
    }

    /** @test */
    public function reopen_order_with_zero_total()
    {
        $order = Order::factory()->create([
            'status' => Order::STATUS_COMPLETED,
            'subtotal' => 0,
            'total_price' => 0,
            'discount_type' => null,
            'discount_value' => 0,
        ]);

        $reopened = $this->service->reopenOrder($order->id);
        $this->assertEquals(0, $reopened->total_price);
    }

    /** @test */
    public function reopen_order_with_null_subtotal_falls_back_to_current_total()
    {
        $order = Order::factory()->create([
            'status' => Order::STATUS_COMPLETED,
            'subtotal' => null,
            'total_price' => 750,
            'discount_type' => 'fixed',
            'discount_value' => 50,
        ]);

        $reopened = $this->service->reopenOrder($order->id);
        $this->assertEquals(750, $reopened->total_price);
    }

    /** @test */
    public function reopen_then_pay_again_does_not_reapply_global_discount()
    {
        $order = Order::factory()->create([
            'status' => Order::STATUS_COMPLETED,
            'discount_type' => 'fixed',
            'discount_value' => 200,
            'subtotal' => 1000,
            'total_price' => 800,
        ]);

        // Reopen
        $this->service->reopenOrder($order->id);

        // Complete again without providing a discount in payload
        $reopened = $order->fresh();
        $completed = $this->service->completeOrder($reopened->id, ['payment_method' => 'cash']);

        $this->assertEquals(1000, $completed->total_price);
        $this->assertNull($completed->discount_type);
    }

    /** @test */
    public function reopen_orders_in_merged_table_group()
    {
        $merged = '1-2-3';
        $orderA = Order::factory()->create([
            'status' => Order::STATUS_COMPLETED,
            'merged_tables' => $merged,
            'subtotal' => 500,
            'total_price' => 400,
        ]);
        $orderB = Order::factory()->create([
            'status' => Order::STATUS_COMPLETED,
            'merged_tables' => $merged,
            'subtotal' => 600,
            'total_price' => 500,
        ]);

        $this->service->reopenOrder($orderA->id);

        $orderA->refresh();
        $orderB->refresh();

        $this->assertEquals(Order::STATUS_PENDING, $orderA->status);
        $this->assertEquals(Order::STATUS_PENDING, $orderB->status);
        $this->assertEquals(500, $orderA->total_price);
        $this->assertEquals(600, $orderB->total_price);
    }
}
?>
