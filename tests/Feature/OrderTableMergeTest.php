<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Table;
use App\Models\Order;
use App\Models\Product;
use App\Models\Category;
use App\Models\OrderItem;
use App\Services\OrderTableService;
use Illuminate\Foundation\Testing\RefreshDatabase;

class OrderTableMergeTest extends TestCase
{
    use RefreshDatabase;

    protected $orderTableService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->orderTableService = $this->app->make(OrderTableService::class);
    }

    /** @test */
    public function test_move_table_to_empty_table()
    {
        // Create a category
        $category = Category::create([
            'name' => 'Nước uống',
            'type' => 'drink'
        ]);

        // Create two tables
        $table1 = Table::create(['name' => 'Bàn 1', 'status' => 'busy']);
        $table2 = Table::create(['name' => 'Bàn 2', 'status' => 'empty']);

        // Create a product
        $product = Product::create([
            'name' => 'Cà phê đá',
            'price' => 20000,
            'type' => 'drink',
            'category_id' => $category->id
        ]);

        // Create an active order on Table 1
        $order = Order::create([
            'table_id' => $table1->id,
            'status' => 'pending',
            'guest_count' => 2,
            'total_price' => 20000
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'table_id' => $table1->id,
            'product_id' => $product->id,
            'name' => $product->name,
            'type' => $product->type,
            'quantity' => 1,
            'price' => $product->price
        ]);

        // Move Table 1 to Table 2 (which is empty)
        $result = $this->orderTableService->updateTable($order->id, $table2->id);

        // Assert order's table ID is updated
        $this->assertEquals($table2->id, $result->table_id);

        // Assert table statuses are updated
        $this->assertEquals('empty', $table1->fresh()->status);
        $this->assertEquals('busy', $table2->fresh()->status);
    }

    /** @test */
    public function test_merge_table_with_existing_order()
    {
        // Create a category
        $category = Category::create([
            'name' => 'Nước uống',
            'type' => 'drink'
        ]);

        // Create two tables
        $table1 = Table::create(['name' => 'Bàn 1', 'status' => 'busy']);
        $table2 = Table::create(['name' => 'Bàn 2', 'status' => 'busy']);

        // Create products
        $product1 = Product::create(['name' => 'Cà phê sữa', 'price' => 25000, 'type' => 'drink', 'category_id' => $category->id]);
        $product2 = Product::create(['name' => 'Trà đào', 'price' => 30000, 'type' => 'drink', 'category_id' => $category->id]);

        // Create an active order on Table 1
        $order1 = Order::create([
            'table_id' => $table1->id,
            'status' => 'pending',
            'guest_count' => 2,
            'total_price' => 25000,
            'order_note' => 'Không đá'
        ]);

        OrderItem::create([
            'order_id' => $order1->id,
            'table_id' => $table1->id,
            'product_id' => $product1->id,
            'name' => $product1->name,
            'type' => $product1->type,
            'quantity' => 1,
            'price' => $product1->price
        ]);

        // Create an active order on Table 2
        $order2 = Order::create([
            'table_id' => $table2->id,
            'status' => 'pending',
            'guest_count' => 3,
            'total_price' => 30000,
            'order_note' => 'Ít ngọt'
        ]);

        OrderItem::create([
            'order_id' => $order2->id,
            'table_id' => $table2->id,
            'product_id' => $product2->id,
            'name' => $product2->name,
            'type' => $product2->type,
            'quantity' => 1,
            'price' => $product2->price
        ]);

        // Move Table 1 to Table 2 (occupied) - should trigger merge & transfer
        $result = $this->orderTableService->updateTable($order1->id, $table2->id);

        // Assert target order now has both items
        $this->assertEquals(2, OrderItem::where('order_id', $order2->id)->count());
        
        // Assert guest count is combined
        $order2 = $order2->fresh();
        $this->assertEquals(5, $order2->guest_count);

        // Assert notes are merged
        $this->assertEquals('Ít ngọt | Không đá', $order2->order_note);

        // Assert target order total price is recalculated correctly (25000 + 30000)
        $this->assertEquals(55000, $order2->total_price);

        // Assert source order becomes cancelled with 0 total_price
        $order1 = $order1->fresh();
        $this->assertEquals('cancelled', $order1->status);
        $this->assertEquals(0, $order1->total_price);
        $this->assertNull($order1->merged_tables);

        // Assert Table 1 (source table) immediately becomes empty/available
        $this->assertEquals('empty', $table1->fresh()->status);

        // Assert Table 2 (destination table) remains busy
        $this->assertEquals('busy', $table2->fresh()->status);
    }
}
