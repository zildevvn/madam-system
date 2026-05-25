<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Table;
use App\Services\OrderService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderQuantityUpdateTest extends TestCase
{
    use RefreshDatabase;

    public function test_order_quantity_increase_calculates_total_price_correctly()
    {
        // 1. Create table, category, and product
        $table = Table::create(['name' => 'Table 1', 'status' => 'busy']);
        $category = Category::create([
            'name' => 'Beverages',
            'type' => 'drink'
        ]);
        $product = Product::create([
            'name' => 'Coffee',
            'price' => 10000,
            'type' => 'drink',
            'category_id' => $category->id
        ]);

        // 2. Create an order with 2 coffees
        $order = Order::create([
            'table_id' => $table->id,
            'status' => 'pending',
            'total_price' => 20000
        ]);

        $orderItem = OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'name' => 'Coffee',
            'type' => 'drink',
            'table_id' => $table->id,
            'quantity' => 2,
            'price' => 10000,
            'status' => 'pending'
        ]);

        // 3. Resolve OrderService and call checkoutOrder to increase Coffee quantity to 3
        $orderService = app(OrderService::class);
        $orderService->checkoutOrder($order->id, [
            [
                'product_id' => $product->id,
                'order_item_id' => $orderItem->id,
                'name' => 'Coffee',
                'type' => 'drink',
                'quantity' => 3,
                'price' => 10000,
                'note' => '',
                'discount' => 0,
                'discount_type' => 'fixed',
                'table_id' => $table->id
            ]
        ]);

        // 4. Assertions
        $order->refresh();
        
        // The order should now have exactly 2 order items in the database
        // One with quantity 2 (original) and one with quantity 1 (new split item)
        $items = OrderItem::where('order_id', $order->id)->get();
        $this->assertCount(2, $items);
        $this->assertEquals([2, 1], $items->pluck('quantity')->sort()->reverse()->values()->all());

        // [CRITICAL] The total price of the order must include both items (30,000đ)
        $this->assertEquals(30000, $order->total_price);
    }
}
