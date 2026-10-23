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

        // 2. Claim request to obtain fencing claim_token
        $claimRes = $this->postJson('/api/bar-printer/claim', [
            'request_id' => 'test-req-123',
        ]);
        $claimRes->assertStatus(200);
        $claimToken = $claimRes->json('data.claim_token');
        $this->assertNotEmpty($claimToken);

        // 3. Test POST /api/bar-printer/acknowledge (printed) with valid claim_token
        $ackResponse = $this->postJson('/api/bar-printer/acknowledge', [
            'request_id' => 'test-req-123',
            'claim_token' => $claimToken,
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

    public function test_claim_pending_request_succeeds_and_returns_claim_token()
    {
        $printReq = BarPrintRequest::create([
            'request_id' => 'claim-test-001',
            'order_id' => 101,
            'table_name' => 'Bàn 1',
            'title' => 'PHIẾU PHA CHẾ',
            'items' => [['name' => 'Cà phê', 'quantity' => 1]],
            'status' => 'pending'
        ]);

        $response = $this->postJson('/api/bar-printer/claim', [
            'request_id' => 'claim-test-001'
        ]);

        $response->assertStatus(200);
        $response->assertJsonFragment([
            'status' => 'printing',
            'request_id' => 'claim-test-001'
        ]);

        $claimToken = $response->json('data.claim_token');
        $this->assertNotEmpty($claimToken);
        $this->assertIsString($claimToken);

        $printReq->refresh();
        $this->assertEquals('printing', $printReq->status);
        $this->assertNotNull($printReq->claimed_at);
        $this->assertEquals($claimToken, $printReq->claim_token);
    }

    public function test_concurrent_claim_rejected_with_409()
    {
        $printReq = BarPrintRequest::create([
            'request_id' => 'claim-test-002',
            'order_id' => 102,
            'table_name' => 'Bàn 2',
            'title' => 'PHIẾU PHA CHẾ',
            'items' => [['name' => 'Trà vải', 'quantity' => 2]],
            'status' => 'printing',
            'claimed_at' => now(),
            'claim_token' => 'active-token-123'
        ]);

        // Second device/tab attempts to claim the same request while active
        $response = $this->postJson('/api/bar-printer/claim', [
            'request_id' => 'claim-test-002'
        ]);

        $response->assertStatus(409);
        $response->assertJsonFragment([
            'status' => 'claimed_by_another_station'
        ]);
    }

    public function test_claim_already_printed_request_rejected_with_409()
    {
        $printReq = BarPrintRequest::create([
            'request_id' => 'claim-test-003',
            'order_id' => 103,
            'table_name' => 'Bàn 3',
            'title' => 'PHIẾU PHA CHẾ',
            'items' => [['name' => 'Nước ép cam', 'quantity' => 1]],
            'status' => 'printed',
            'printed_at' => now()
        ]);

        $response = $this->postJson('/api/bar-printer/claim', [
            'request_id' => 'claim-test-003'
        ]);

        $response->assertStatus(409);
        $response->assertJsonFragment([
            'status' => 'already_printed'
        ]);
    }

    public function test_station_a_superseded_by_station_b_after_stale_acknowledge_a_rejected_b_accepted()
    {
        // 1. Station A claims request at T=0
        $printReq = BarPrintRequest::create([
            'request_id' => 'fencing-test-001',
            'order_id' => 105,
            'table_name' => 'Bàn 5',
            'title' => 'PHIẾU PHA CHẾ',
            'items' => [['name' => 'Bạc xỉu', 'quantity' => 1]],
            'status' => 'pending'
        ]);

        $resA = $this->postJson('/api/bar-printer/claim', [
            'request_id' => 'fencing-test-001'
        ]);
        $resA->assertStatus(200);
        $tokenA = $resA->json('data.claim_token');
        $this->assertNotEmpty($tokenA);

        // 2. Request becomes stale (claimed > 120s ago)
        $printReq->update([
            'claimed_at' => now()->subSeconds(130),
            'updated_at' => now()->subSeconds(130)
        ]);

        // 3. Station B comes in and claims the stale request
        $resB = $this->postJson('/api/bar-printer/claim', [
            'request_id' => 'fencing-test-001'
        ]);
        $resB->assertStatus(200);
        $tokenB = $resB->json('data.claim_token');
        $this->assertNotEmpty($tokenB);
        $this->assertNotEquals($tokenA, $tokenB);

        // 4. Station A lagged behind (e.g. slow spooler) and now tries to acknowledge with tokenA
        $ackA = $this->postJson('/api/bar-printer/acknowledge', [
            'request_id' => 'fencing-test-001',
            'claim_token' => $tokenA,
            'status' => 'printed'
        ]);

        // Station A's acknowledge must be REJECTED because tokenA was superseded by tokenB
        $ackA->assertStatus(409);
        $ackA->assertJsonFragment([
            'status' => 'claim_superseded'
        ]);

        // Verify status in DB was not overwritten by Station A
        $printReq->refresh();
        $this->assertEquals('printing', $printReq->status);
        $this->assertEquals($tokenB, $printReq->claim_token);

        // 5. Station B finishes printing and acknowledges with tokenB
        $ackB = $this->postJson('/api/bar-printer/acknowledge', [
            'request_id' => 'fencing-test-001',
            'claim_token' => $tokenB,
            'status' => 'printed'
        ]);

        // Station B's acknowledge must SUCCEED
        $ackB->assertStatus(200);

        $printReq->refresh();
        $this->assertEquals('printed', $printReq->status);
        $this->assertNotNull($printReq->printed_at);
    }

    public function test_acknowledge_missing_or_invalid_token_is_rejected()
    {
        $printReq = BarPrintRequest::create([
            'request_id' => 'token-validation-test',
            'order_id' => 106,
            'table_name' => 'Bàn 6',
            'title' => 'PHIẾU PHA CHẾ',
            'items' => [['name' => 'Trà xanh', 'quantity' => 1]],
            'status' => 'printing',
            'claimed_at' => now(),
            'claim_token' => 'valid-uuid-token'
        ]);

        // 1. Missing claim_token -> 422 Unprocessable Content
        $resMissing = $this->postJson('/api/bar-printer/acknowledge', [
            'request_id' => 'token-validation-test',
            'status' => 'printed'
        ]);
        $resMissing->assertStatus(422);

        // 2. Wrong claim_token -> 409 Conflict (claim_superseded)
        $resWrong = $this->postJson('/api/bar-printer/acknowledge', [
            'request_id' => 'token-validation-test',
            'claim_token' => 'wrong-token-value',
            'status' => 'printed'
        ]);
        $resWrong->assertStatus(409);
        $resWrong->assertJsonFragment([
            'status' => 'claim_superseded'
        ]);

        // Status remains unchanged
        $printReq->refresh();
        $this->assertEquals('printing', $printReq->status);
    }

    public function test_claim_stale_printing_request_succeeds_after_120s_timeout()
    {
        // Request was claimed 130 seconds ago by a station that crashed
        $printReq = BarPrintRequest::create([
            'request_id' => 'claim-test-004',
            'order_id' => 104,
            'table_name' => 'Bàn 4',
            'title' => 'PHIẾU PHA CHẾ',
            'items' => [['name' => 'Sinh tố xoài', 'quantity' => 1]],
            'status' => 'printing',
            'claimed_at' => now()->subSeconds(130),
            'updated_at' => now()->subSeconds(130),
            'claim_token' => 'crashed-station-token'
        ]);

        // New station comes in to rescue the stale request
        $response = $this->postJson('/api/bar-printer/claim', [
            'request_id' => 'claim-test-004'
        ]);

        $response->assertStatus(200);
        $response->assertJsonFragment([
            'status' => 'printing',
            'request_id' => 'claim-test-004'
        ]);

        $printReq->refresh();
        $this->assertEquals('printing', $printReq->status);
        $this->assertNotEquals('crashed-station-token', $printReq->claim_token);
        $this->assertTrue($printReq->claimed_at->gt(now()->subSeconds(5)));
    }

    public function test_get_pending_requests_includes_stale_printing_requests()
    {
        // 1. Fresh pending
        BarPrintRequest::create([
            'request_id' => 'pending-fresh',
            'order_id' => 201,
            'table_name' => 'Bàn 1',
            'items' => [['name' => 'Trà sen', 'quantity' => 1]],
            'status' => 'pending'
        ]);

        // 2. Active printing (claimed 10s ago) - should NOT be included
        BarPrintRequest::create([
            'request_id' => 'printing-active',
            'order_id' => 202,
            'table_name' => 'Bàn 2',
            'items' => [['name' => 'Trà đào', 'quantity' => 1]],
            'status' => 'printing',
            'claimed_at' => now()->subSeconds(10),
            'claim_token' => 'active-token'
        ]);

        // 3. Stale printing (claimed 130s ago) - SHOULD be included for recovery
        BarPrintRequest::create([
            'request_id' => 'printing-stale',
            'order_id' => 203,
            'table_name' => 'Bàn 3',
            'items' => [['name' => 'Cà phê đen', 'quantity' => 1]],
            'status' => 'printing',
            'claimed_at' => now()->subSeconds(130),
            'claim_token' => 'stale-token'
        ]);

        $response = $this->getJson('/api/bar-printer/pending');
        $response->assertStatus(200);

        $returnedReqIds = collect($response->json('data'))->pluck('request_id')->toArray();
        $this->assertContains('pending-fresh', $returnedReqIds);
        $this->assertContains('printing-stale', $returnedReqIds);
        $this->assertNotContains('printing-active', $returnedReqIds);
    }

    public function test_reprint_creates_distinct_request_linked_to_original_order()
    {
        \Illuminate\Support\Facades\Event::fake([\App\Events\DrinkPrintRequested::class]);

        $originalReq = BarPrintRequest::create([
            'request_id' => 'pr-original-107',
            'order_id' => 107,
            'table_name' => 'Bàn 7',
            'title' => 'PHIẾU PHA CHẾ',
            'items' => [['name' => 'Matcha Latte', 'quantity' => 1]],
            'status' => 'printed',
            'printed_at' => now()->subMinutes(10),
            'claim_token' => 'old-token'
        ]);

        $response = $this->postJson('/api/bar-printer/reprint/' . $originalReq->id);

        $response->assertStatus(200);

        // Verify original request remains printed and untouched
        $originalReq->refresh();
        $this->assertEquals('printed', $originalReq->status);
        $this->assertEquals('pr-original-107', $originalReq->request_id);

        // Verify a new distinct request was created
        $newReq = BarPrintRequest::where('order_id', 107)->where('status', 'pending')->first();
        $this->assertNotNull($newReq);
        $this->assertNotEquals('pr-original-107', $newReq->request_id);
        $this->assertStringStartsWith('pr-rep-107-', $newReq->request_id);
        $this->assertEquals($originalReq->items, $newReq->items);

        // Verify DrinkPrintRequested event was broadcast with the new request_id
        \Illuminate\Support\Facades\Event::assertDispatched(\App\Events\DrinkPrintRequested::class, function ($event) use ($newReq) {
            return $event->requestId === $newReq->request_id;
        });
    }
}

