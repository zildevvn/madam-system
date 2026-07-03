<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Table;
use App\Models\Product;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Category;
use App\Models\Reservation;
use App\Services\OrderService;
use App\Services\OrderSplitService;
use App\Services\OrderPaymentService;
use App\Services\OrderTableService;
use Illuminate\Foundation\Testing\RefreshDatabase;

class SplitOrderMergeBackTest extends TestCase
{
    use RefreshDatabase;

    protected $orderService;
    protected $splitService;
    protected $paymentService;
    protected $table;
    protected $staff;
    protected $product1;
    protected $product2;
    protected $category;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->paymentService = app(OrderPaymentService::class);
        $tableService = app(OrderTableService::class);
        $this->splitService = app(OrderSplitService::class);
        $this->orderService = new OrderService($this->paymentService, $tableService, $this->splitService);
        
        $this->staff = User::factory()->create(['role' => 'staff']);
        $this->table = Table::create(['name' => 'Table 1', 'status' => 'available']);
        
        $this->category = Category::create(['name' => 'Drinks', 'type' => 'drink']);
        
        $this->product1 = Product::create(['name' => 'Coffee', 'price' => 30000, 'category_id' => $this->category->id, 'type' => 'drink']);
        $this->product2 = Product::create(['name' => 'Tea', 'price' => 20000, 'category_id' => $this->category->id, 'type' => 'drink']);
    }

    public function test_successful_merge_when_both_orders_are_pending()
    {
        $mainOrder = Order::create(['table_id' => $this->table->id, 'status' => 'pending', 'total_price' => 20000]);
        $splitOrder = Order::create(['table_id' => $this->table->id, 'status' => 'pending', 'parent_order_id' => $mainOrder->id, 'total_price' => 30000]);

        OrderItem::create(['order_id' => $mainOrder->id, 'product_id' => $this->product2->id, 'quantity' => 1, 'price' => 20000]);
        $splitItem = OrderItem::create(['order_id' => $splitOrder->id, 'product_id' => $this->product1->id, 'quantity' => 1, 'price' => 30000]);

        $this->splitService->mergeBack($splitOrder->id);

        $mainOrder->refresh();
        $splitOrder->refresh();

        $this->assertEquals('merged', $splitOrder->status);
        $this->assertEquals(50000, $mainOrder->total_price);
        $this->assertCount(2, $mainOrder->items);
        
        $splitItem->refresh();
        $this->assertEquals($mainOrder->id, $splitItem->order_id);
    }

    public function test_merge_is_blocked_when_split_order_is_completed()
    {
        $mainOrder = Order::create(['table_id' => $this->table->id, 'status' => 'pending', 'total_price' => 20000]);
        $splitOrder = Order::create(['table_id' => $this->table->id, 'status' => 'completed', 'parent_order_id' => $mainOrder->id, 'total_price' => 30000]);

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage("Cannot merge an order that is completed");

        $this->splitService->mergeBack($splitOrder->id);
    }

    public function test_merge_is_blocked_when_original_order_is_completed()
    {
        $mainOrder = Order::create(['table_id' => $this->table->id, 'status' => 'completed', 'total_price' => 20000]);
        $splitOrder = Order::create(['table_id' => $this->table->id, 'status' => 'pending', 'parent_order_id' => $mainOrder->id, 'total_price' => 30000]);

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage("Cannot merge back into an order that is completed");

        $this->splitService->mergeBack($splitOrder->id);
    }

    public function test_duplicate_products_quantities_not_combined()
    {
        $mainOrder = Order::create(['table_id' => $this->table->id, 'status' => 'pending', 'total_price' => 30000]);
        $splitOrder = Order::create(['table_id' => $this->table->id, 'status' => 'pending', 'parent_order_id' => $mainOrder->id, 'total_price' => 60000]);

        $item1 = OrderItem::create(['order_id' => $mainOrder->id, 'product_id' => $this->product1->id, 'quantity' => 1, 'price' => 30000]);
        $item2 = OrderItem::create(['order_id' => $splitOrder->id, 'product_id' => $this->product1->id, 'quantity' => 2, 'price' => 30000]);

        $this->splitService->mergeBack($splitOrder->id);

        $mainOrder->refresh();
        
        $this->assertCount(2, $mainOrder->items); // Two separate rows
        $this->assertEquals(90000, $mainOrder->total_price);
        
        $item1->refresh();
        $item2->refresh();
        
        $this->assertEquals(1, $item1->quantity);
        $this->assertEquals(2, $item2->quantity);
    }

    public function test_group_reservation_sibling_check_after_merge()
    {
        $reservation = Reservation::create([
            'type' => 'group',
            'table_ids' => [$this->table->id],
            'lead_name' => 'Group',
            'phone' => '123',
            'reservation_date' => '2026-07-01',
            'reservation_time' => '10:00:00'
        ]);

        $mainOrder = Order::create(['table_id' => $this->table->id, 'status' => 'pending', 'total_price' => 20000, 'reservation_id' => $reservation->id]);
        $splitOrder = Order::create(['table_id' => $this->table->id, 'status' => 'pending', 'parent_order_id' => $mainOrder->id, 'total_price' => 30000, 'reservation_id' => $reservation->id]);

        // Merge back the split order
        $this->splitService->mergeBack($splitOrder->id);
        
        $splitOrder->refresh();
        $this->assertEquals('merged', $splitOrder->status);

        // Call getRelatedOrders via paymentService. Since it is group reservation, if we pass $mainOrder, it finds all.
        // But since splitOrder is merged, it should not be returned.
        // Wait, getRelatedOrders might fetch all orders for the reservation! Let's verify it ignores 'merged'.
        
        $relatedOrders = $this->paymentService->getRelatedOrders($mainOrder, [], ['draft', 'pending', 'processing']);
        $relatedIds = $relatedOrders->pluck('id')->toArray();
        
        $this->assertContains($mainOrder->id, $relatedIds);
        $this->assertNotContains($splitOrder->id, $relatedIds);
    }
}
