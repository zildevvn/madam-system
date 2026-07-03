<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Table;
use App\Models\Product;
use App\Models\Order;
use App\Services\OrderService;
use App\Services\OrderSplitService;
use App\Services\OrderPaymentService;
use App\Services\OrderTableService;
use Illuminate\Foundation\Testing\RefreshDatabase;

class SplitOrderAddItemsTest extends TestCase
{
    use RefreshDatabase;

    protected $orderService;
    protected $splitService;
    protected $table;
    protected $staff;
    protected $product1;
    protected $product2;

    protected $category;

    protected function setUp(): void
    {
        parent::setUp();
        
        $paymentService = app(OrderPaymentService::class);
        $tableService = app(OrderTableService::class);
        $this->splitService = app(OrderSplitService::class);
        $this->orderService = new OrderService($paymentService, $tableService, $this->splitService);
        
        $this->staff = User::factory()->create(['role' => 'staff']);
        $this->table = Table::create(['name' => 'Table 1', 'status' => 'available']);
        
        $this->category = \App\Models\Category::create(['name' => 'Drinks', 'type' => 'drink']);
        
        $this->product1 = Product::create(['name' => 'Coffee', 'price' => 30000, 'category_id' => $this->category->id, 'type' => 'drink']);
        $this->product2 = Product::create(['name' => 'Tea', 'price' => 20000, 'category_id' => $this->category->id, 'type' => 'drink']);
    }

    public function test_single_active_order_returns_one_item()
    {
        // Scenario a: Table has only one active order and has not been split
        $order = Order::create([
            'table_id' => $this->table->id,
            'status' => 'pending',
            'total_price' => 50000,
        ]);

        $activeOrders = $this->orderService->getActiveOrder($this->table->id);
        
        $this->assertCount(1, $activeOrders);
        $this->assertEquals($order->id, $activeOrders[0]->id);
    }

    public function test_adding_items_to_split_order_recalculates_only_that_order()
    {
        // Scenario b: Table has one main order plus two split orders
        $mainOrder = Order::create([
            'table_id' => $this->table->id,
            'status' => 'pending',
            'total_price' => 0,
        ]);

        // Create a split order 1
        $splitOrder1 = Order::create([
            'table_id' => $this->table->id,
            'status' => 'pending',
            'parent_order_id' => $mainOrder->id,
            'total_price' => 0,
        ]);

        // Create a split order 2
        $splitOrder2 = Order::create([
            'table_id' => $this->table->id,
            'status' => 'pending',
            'parent_order_id' => $mainOrder->id,
            'total_price' => 0,
        ]);

        // Verify active orders returns all 3
        $activeOrders = $this->orderService->getActiveOrder($this->table->id);
        $this->assertCount(3, $activeOrders);
        // Main order should be first
        $this->assertNull($activeOrders[0]->parent_order_id);

        // Add an item to split order 1 using checkoutOrder
        $this->orderService->checkoutOrder($splitOrder1->id, [
            [
                'product_id' => $this->product1->id,
                'quantity' => 2,
                'price' => $this->product1->price,
            ]
        ]);

        $mainOrder->refresh();
        $splitOrder1->refresh();
        $splitOrder2->refresh();

        // Verify total_price is recalculated ONLY for the selected split order
        $this->assertEquals(0, $mainOrder->total_price);
        $this->assertEquals(60000, $splitOrder1->total_price);
        $this->assertEquals(0, $splitOrder2->total_price);

        // Verify the other orders remain unchanged
        $this->assertCount(0, $mainOrder->items);
        $this->assertCount(1, $splitOrder1->items);
        $this->assertCount(0, $splitOrder2->items);
    }
}
