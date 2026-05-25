<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Table;
use App\Services\OrderTableService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderTableMergeTest extends TestCase
{
    use RefreshDatabase;

    private $category;
    private $productA;
    private $productB;

    protected function setUp(): void
    {
        parent::setUp();

        $this->category = Category::create([
            'name' => 'Beverages',
            'type' => 'drink'
        ]);

        $this->productA = Product::create([
            'name' => 'Coffee',
            'price' => 10000,
            'type' => 'drink',
            'category_id' => $this->category->id
        ]);

        $this->productB = Product::create([
            'name' => 'Green Tea',
            'price' => 12000,
            'type' => 'drink',
            'category_id' => $this->category->id
        ]);
    }

    public function test_simple_table_move_to_empty_table()
    {
        $tableA = Table::create(['name' => 'Table A', 'status' => 'busy']);
        $tableB = Table::create(['name' => 'Table B', 'status' => 'empty']);

        $orderA = Order::create([
            'table_id' => $tableA->id,
            'status' => 'pending',
            'total_price' => 10000
        ]);

        $itemA = OrderItem::create([
            'order_id' => $orderA->id,
            'product_id' => $this->productA->id,
            'name' => 'Coffee',
            'type' => 'drink',
            'table_id' => $tableA->id,
            'quantity' => 1,
            'price' => 10000,
            'status' => 'pending'
        ]);

        $service = app(OrderTableService::class);
        $result = $service->updateTable($orderA->id, $tableB->id);

        $tableA->refresh();
        $tableB->refresh();
        $orderA->refresh();
        $itemA->refresh();

        // Table A is now empty, Table B is busy
        $this->assertEquals('empty', $tableA->status);
        $this->assertEquals('busy', $tableB->status);

        // Order is now on Table B
        $this->assertEquals($tableB->id, $orderA->table_id);
        $this->assertEquals($tableB->id, $itemA->table_id);
    }

    public function test_merge_table_with_existing_orders()
    {
        $tableA = Table::create(['name' => 'Table A', 'status' => 'busy']);
        $tableB = Table::create(['name' => 'Table B', 'status' => 'busy']);

        // Order on Table A (Coffee x 2, Guest Count 2)
        $orderA = Order::create([
            'table_id' => $tableA->id,
            'status' => 'pending',
            'guest_count' => 2,
            'total_price' => 20000,
            'order_note' => 'Note A'
        ]);

        OrderItem::create([
            'order_id' => $orderA->id,
            'product_id' => $this->productA->id,
            'name' => 'Coffee',
            'type' => 'drink',
            'table_id' => $tableA->id,
            'quantity' => 2,
            'price' => 10000,
            'status' => 'pending'
        ]);

        // Order on Table B (Coffee x 1, Green Tea x 1, Guest Count 3)
        $orderB = Order::create([
            'table_id' => $tableB->id,
            'status' => 'processing',
            'guest_count' => 3,
            'total_price' => 22000,
            'order_note' => 'Note B'
        ]);

        OrderItem::create([
            'order_id' => $orderB->id,
            'product_id' => $this->productA->id,
            'name' => 'Coffee',
            'type' => 'drink',
            'table_id' => $tableB->id,
            'quantity' => 1,
            'price' => 10000,
            'status' => 'pending'
        ]);

        OrderItem::create([
            'order_id' => $orderB->id,
            'product_id' => $this->productB->id,
            'name' => 'Green Tea',
            'type' => 'drink',
            'table_id' => $tableB->id,
            'quantity' => 1,
            'price' => 12000,
            'status' => 'pending'
        ]);

        $service = app(OrderTableService::class);
        $result = $service->updateTable($orderA->id, $tableB->id);

        $tableA->refresh();
        $tableB->refresh();
        $orderB->refresh();

        // 1. Table A is now empty, Table B is busy
        $this->assertEquals('empty', $tableA->status);
        $this->assertEquals('busy', $tableB->status);

        // 2. Source order on Table A is deleted
        $this->assertNull(Order::find($orderA->id));

        // 3. Guest count and order notes are combined
        $this->assertEquals(5, $orderB->guest_count);
        $this->assertStringContainsString('Note A', $orderB->order_note);
        $this->assertStringContainsString('Note B', $orderB->order_note);

        // 4. Status is prioritized (processing > pending)
        $this->assertEquals('processing', $orderB->status);

        // 5. Coffee quantity is merged (2 from A + 1 from B = 3 coffees)
        $coffeeItem = OrderItem::where('order_id', $orderB->id)
            ->where('product_id', $this->productA->id)
            ->first();
        $this->assertEquals(3, $coffeeItem->quantity);

        // 6. Green Tea is transferred unchanged
        $teaItem = OrderItem::where('order_id', $orderB->id)
            ->where('product_id', $this->productB->id)
            ->first();
        $this->assertEquals(1, $teaItem->quantity);

        // 7. Total price is correctly recalculated
        // 3 Coffees (30,000) + 1 Green Tea (12,000) = 42,000
        $this->assertEquals(42000, $orderB->total_price);
    }
}
