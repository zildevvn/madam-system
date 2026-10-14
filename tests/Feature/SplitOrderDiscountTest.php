<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Table;
use App\Models\Product;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Category;
use App\Services\OrderService;
use App\Services\OrderSplitService;
use App\Services\OrderPaymentService;
use App\Services\OrderTableService;
use Illuminate\Foundation\Testing\RefreshDatabase;

class SplitOrderDiscountTest extends TestCase
{
    use RefreshDatabase;

    protected OrderService $orderService;
    protected OrderSplitService $splitService;
    protected Table $table;
    protected Category $category;
    protected Product $product;
    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $paymentService = app(OrderPaymentService::class);
        $tableService = app(OrderTableService::class);
        $this->splitService = app(OrderSplitService::class);
        $this->orderService = new OrderService($paymentService, $tableService, $this->splitService);

        $this->table = Table::create(['name' => 'Bàn 1', 'status' => 'busy']);
        $this->category = Category::create(['name' => 'Food', 'type' => 'food']);
        $this->product = Product::create([
            'name' => 'Burger',
            'price' => 10000,
            'category_id' => $this->category->id,
            'type' => 'food'
        ]);
        $this->user = User::factory()->create(['role' => 'cashier']);
    }

    /**
     * Case 1: Split an item with a fixed discount per unit.
     */
    public function test_split_fixed_discount_item_preserves_total_price()
    {
        $order = Order::create([
            'table_id' => $this->table->id,
            'status' => 'pending',
            'total_price' => 0,
        ]);

        // Item with fixed discount 2000 per unit (20% of price for easy math)
        $item = OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $this->product->id,
            'quantity' => 2,
            'price' => 10000,
            'discount' => 2000,
            'discount_type' => 'fixed',
            'status' => 'pending',
        ]);

        // Refresh order total using service method (normally called on create/update)
        $order->total_price = $this->orderService->recalculateOrderTotal($order);
        $order->save();

        $this->assertEquals(16000, $order->total_price); // (2*10000) - (2*2000) = 16000

        // Split one quantity to a new order
        $result = $this->splitService->splitItems($order->id, [
            ['order_item_id' => $item->id, 'quantity' => 1]
        ]);
        $newOrder = $result['new_order'];

        $order->refresh();
        $newOrder->refresh();

        $this->assertEquals(8000, $order->total_price); // remaining 1 * (10000-2000)
        $this->assertEquals(8000, $newOrder->total_price);
    }

    /**
     * Case 2: Split an item with a percentage discount.
     */
    public function test_split_percent_discount_item_preserves_total_price()
    {
        $order = Order::create([
            'table_id' => $this->table->id,
            'status' => 'pending',
            'total_price' => 0,
        ]);

        $item = OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $this->product->id,
            'quantity' => 3,
            'price' => 10000,
            'discount' => 10, // 10 percent
            'discount_type' => 'percent',
            'status' => 'pending',
        ]);

        $this->orderService->recalculateOrderTotal($order);
        $order->refresh();
        // Gross 30000, 10% discount = 3000, net = 27000
        $this->assertEquals(27000, $order->total_price);

        // Split 2 units
        $result = $this->splitService->splitItems($order->id, [
            ['order_item_id' => $item->id, 'quantity' => 2]
        ]);
        $newOrder = $result['new_order'];
        $order->refresh();
        $newOrder->refresh();

        // Source: 1 unit net = 10000 - 10% = 9000
        $this->assertEquals(9000, $order->total_price);
        // New order: 2 units net = 20000 - 20% = 18000
        $this->assertEquals(18000, $newOrder->total_price);
    }

    /**
     * Case 3: Split an item without any discount.
     */
    public function test_split_item_without_discount_keeps_gross_total()
    {
        $order = Order::create([
            'table_id' => $this->table->id,
            'status' => 'pending',
            'total_price' => 0,
        ]);

        $item = OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $this->product->id,
            'quantity' => 2,
            'price' => 10000,
            'discount' => 0,
            'discount_type' => 'fixed',
            'status' => 'pending',
        ]);

        $this->orderService->recalculateOrderTotal($order);
        $order->refresh();
        $this->assertEquals(20000, $order->total_price);

        $result = $this->splitService->splitItems($order->id, [
            ['order_item_id' => $item->id, 'quantity' => 1]
        ]);
        $newOrder = $result['new_order'];
        $order->refresh();
        $newOrder->refresh();

        $this->assertEquals(10000, $order->total_price);
        $this->assertEquals(10000, $newOrder->total_price);
    }

    /**
     * Case 4: Merge back a split order that contains a discounted item.
     */
    public function test_merge_back_preserves_discounted_item_total()
    {
        $order = Order::create([
            'table_id' => $this->table->id,
            'status' => 'pending',
            'total_price' => 0,
        ]);

        $item = OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $this->product->id,
            'quantity' => 3,
            'price' => 10000,
            'discount' => 10,
            'discount_type' => 'percent',
            'status' => 'pending',
        ]);

        $this->orderService->recalculateOrderTotal($order);
        $order->refresh();
        $this->assertEquals(27000, $order->total_price);

        // Split 2 units to a new order
        $result = $this->splitService->splitItems($order->id, [
            ['order_item_id' => $item->id, 'quantity' => 2]
        ]);
        $splitOrder = $result['new_order'];
        $order->refresh();
        $splitOrder->refresh();
        $this->assertEquals(9000, $order->total_price);
        $this->assertEquals(18000, $splitOrder->total_price);

        // Merge back
        $this->splitService->mergeBack($splitOrder->id);
        $order->refresh();
        $this->assertEquals(27000, $order->total_price);
    }

    /**
     * Case 5: Ensure total price before and after split+merge returns to original value for fixed discount.
     */
    public function test_total_price_consistency_fixed_discount()
    {
        $order = Order::create([
            'table_id' => $this->table->id,
            'status' => 'pending',
            'total_price' => 0,
        ]);

        $item = OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $this->product->id,
            'quantity' => 4,
            'price' => 15000,
            'discount' => 3000,
            'discount_type' => 'fixed',
            'status' => 'pending',
        ]);

        $this->orderService->recalculateOrderTotal($order);
        $originalTotal = $order->fresh()->total_price;

        // Split 2 units
        $result = $this->splitService->splitItems($order->id, [
            ['order_item_id' => $item->id, 'quantity' => 2]
        ]);
        $splitOrder = $result['new_order'];
        // Merge back
        $this->splitService->mergeBack($splitOrder->id);
        $finalTotal = $order->fresh()->total_price;

        $this->assertEquals($originalTotal, $finalTotal);
    }
}
