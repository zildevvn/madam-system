<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Table;
use App\Models\User;
use App\Models\BarPrintRequest;
use App\Events\DrinkPrintRequested;
use App\Services\OrderService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;

class BarPrinterTest extends TestCase
{
    use RefreshDatabase;

    public function test_checkout_new_order_with_drinks_creates_print_request_and_broadcasts_event()
    {
        Event::fake([DrinkPrintRequested::class]);

        $table = Table::create(['name' => 'Bàn 1', 'status' => 'empty', 'capacity' => 4]);
        $cat = \App\Models\Category::create(['name' => 'Menu', 'type' => 'food']);
        $drinkProduct = Product::create([
            'category_id' => $cat->id,
            'name' => 'Iced Milk Coffee',
            'name_vi' => 'Cà phê sữa đá',
            'price' => 30000,
            'type' => 'drink'
        ]);
        $foodProduct = Product::create([
            'category_id' => $cat->id,
            'name' => 'Fried Noodles',
            'name_vi' => 'Mì xào',
            'price' => 50000,
            'type' => 'food'
        ]);

        $orderService = app(OrderService::class);
        $order = $orderService->createOrder([
            'table_id' => $table->id,
            'order_type' => 'dine-in'
        ]);

        $checkoutItems = [
            [
                'product_id' => $drinkProduct->id,
                'quantity' => 2,
                'price' => 30000,
                'type' => 'drink',
                'note' => 'Ít ngọt'
            ],
            [
                'product_id' => $foodProduct->id,
                'quantity' => 1,
                'price' => 50000,
                'type' => 'food'
            ]
        ];

        $orderService->checkoutOrder($order->id, $checkoutItems);

        // Assert BarPrintRequest was created in database
        $this->assertDatabaseHas('bar_print_requests', [
            'order_id' => $order->id,
            'status' => 'pending'
        ]);

        $printReq = BarPrintRequest::where('order_id', $order->id)->first();
        $this->assertNotNull($printReq);
        $this->assertCount(1, $printReq->items); // Only the drink
        $this->assertEquals('Cà phê sữa đá', $printReq->items[0]['name_vi']);
        $this->assertEquals(2, $printReq->items[0]['quantity']);

        // Assert event was broadcasted
        Event::assertDispatched(DrinkPrintRequested::class, function ($event) use ($order) {
            return $event->orderId === $order->id && count($event->items) === 1;
        });
    }

    public function test_checkout_food_only_does_not_create_bar_print_request()
    {
        Event::fake([DrinkPrintRequested::class]);

        $table = Table::create(['name' => 'Bàn 2', 'status' => 'empty', 'capacity' => 4]);
        $cat = \App\Models\Category::create(['name' => 'Food Menu', 'type' => 'food']);
        $foodProduct = Product::create([
            'category_id' => $cat->id,
            'name' => 'Pho Bo',
            'name_vi' => 'Phở bò',
            'price' => 60000,
            'type' => 'food'
        ]);

        $orderService = app(OrderService::class);
        $order = $orderService->createOrder([
            'table_id' => $table->id,
            'order_type' => 'dine-in'
        ]);

        $checkoutItems = [
            [
                'product_id' => $foodProduct->id,
                'quantity' => 2,
                'price' => 60000,
                'type' => 'food'
            ]
        ];

        $orderService->checkoutOrder($order->id, $checkoutItems);

        $this->assertDatabaseMissing('bar_print_requests', [
            'order_id' => $order->id
        ]);

        Event::assertNotDispatched(DrinkPrintRequested::class);
    }

    public function test_bar_printer_api_pending_and_acknowledge()
    {
        $printReq = BarPrintRequest::create([
            'request_id' => 'test-req-123',
            'order_id' => 999,
            'table_name' => 'Bàn 5',
            'title' => 'PHIẾU PHA CHẾ',
            'items' => [['name' => 'Trà đào', 'quantity' => 1]],
            'status' => 'pending'
        ]);

        // 1. Test GET /api/bar-printer/pending
        $response = $this->getJson('/api/bar-printer/pending');
        $response->assertStatus(200);
        $response->assertJsonFragment(['request_id' => 'test-req-123']);

        // 2. Test POST /api/bar-printer/acknowledge (printed)
        $ackResponse = $this->postJson('/api/bar-printer/acknowledge', [
            'request_id' => 'test-req-123',
            'status' => 'printed'
        ]);
        $ackResponse->assertStatus(200);

        $printReq->refresh();
        $this->assertEquals('printed', $printReq->status);
        $this->assertNotNull($printReq->printed_at);
    }

    public function test_update_existing_order_with_increased_drinks_only_prints_delta()
    {
        Event::fake([DrinkPrintRequested::class]);

        $table = Table::create(['name' => 'Bàn 3', 'status' => 'empty', 'capacity' => 4]);
        $cat = \App\Models\Category::create(['name' => 'Menu 3', 'type' => 'drink']);
        $coffee = Product::create([
            'category_id' => $cat->id,
            'name' => 'Coffee',
            'name_vi' => 'Cà phê',
            'price' => 20000,
            'type' => 'drink'
        ]);
        $tea = Product::create([
            'category_id' => $cat->id,
            'name' => 'Peach Tea',
            'name_vi' => 'Trà đào',
            'price' => 25000,
            'type' => 'drink'
        ]);

        $orderService = app(OrderService::class);
        $order = $orderService->createOrder([
            'table_id' => $table->id,
            'order_type' => 'dine-in'
        ]);

        // Step 1: Initial checkout with 2 Coffees
        $orderService->checkoutOrder($order->id, [
            [
                'product_id' => $coffee->id,
                'quantity' => 2,
                'price' => 20000,
                'type' => 'drink'
            ]
        ]);

        // Clear print requests from initial order
        BarPrintRequest::truncate();

        // Step 2: Update order: Coffee increased 2 -> 3 (+1), and new Peach Tea added (1)
        $order->refresh();
        $initialItem = $order->items->first();

        $orderService->checkoutOrder($order->id, [
            [
                'order_item_id' => $initialItem->id,
                'product_id' => $coffee->id,
                'quantity' => 3, // +1 delta
                'price' => 20000,
                'type' => 'drink'
            ],
            [
                'product_id' => $tea->id,
                'quantity' => 1, // new drink
                'price' => 25000,
                'type' => 'drink'
            ]
        ]);

        $printReq = BarPrintRequest::where('order_id', $order->id)->latest('id')->first();
        $this->assertNotNull($printReq);
        $this->assertStringContainsString('Bill doi mon ban so', $printReq->title);
        $this->assertCount(2, $printReq->items);

        // Check coffee delta is 1
        $coffeeItem = collect($printReq->items)->firstWhere('product_id', $coffee->id);
        $this->assertNotNull($coffeeItem);
        $this->assertEquals(1, $coffeeItem['quantity']);

        // Check tea is 1
        $teaItem = collect($printReq->items)->firstWhere('product_id', $tea->id);
        $this->assertNotNull($teaItem);
        $this->assertEquals(1, $teaItem['quantity']);
    }

    public function test_table_move_creates_transfer_drink_print_request()
    {
        Event::fake([DrinkPrintRequested::class]);

        $tableA = Table::create(['name' => 'Bàn 10', 'status' => 'busy', 'capacity' => 4]);
        $tableB = Table::create(['name' => 'Bàn 11', 'status' => 'empty', 'capacity' => 4]);

        $cat = \App\Models\Category::create(['name' => 'Menu 4', 'type' => 'drink']);
        $coffee = Product::create([
            'category_id' => $cat->id,
            'name' => 'Coffee',
            'name_vi' => 'Cà phê',
            'price' => 20000,
            'type' => 'drink'
        ]);

        $orderService = app(OrderService::class);
        $order = $orderService->createOrder([
            'table_id' => $tableA->id,
            'order_type' => 'dine-in'
        ]);

        $orderService->checkoutOrder($order->id, [
            [
                'product_id' => $coffee->id,
                'quantity' => 2,
                'price' => 20000,
                'type' => 'drink'
            ]
        ]);

        BarPrintRequest::truncate();

        // Move table from 10 to 11
        $tableService = app(\App\Services\OrderTableService::class);
        $tableService->updateTable($order->id, $tableB->id);

        $printReq = BarPrintRequest::where('order_id', $order->id)->latest('id')->first();
        $this->assertNotNull($printReq);
        $this->assertStringContainsString('Bill Chuyen Ban', $printReq->title);
        $this->assertEquals('Bàn 11', $printReq->table_name);
        $this->assertCount(1, $printReq->items);
        $this->assertEquals(2, $printReq->items[0]['quantity']);
    }
}
