<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderPayment;
use App\Models\Product;
use App\Models\Table;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Tests\TestCase;

class ExternalApiOrderListTest extends TestCase
{
    use RefreshDatabase;

    private string $apiKey = 'test-external-api-key-list-test';

    protected function setUp(): void
    {
        parent::setUp();
        Config::set('services.external_api.key', $this->apiKey);
    }

    private function authHeaders(): array
    {
        return [
            'Authorization' => 'Bearer ' . $this->apiKey,
            'Accept' => 'application/json',
        ];
    }

    private function createOrder(array $attributes = []): Order
    {
        $table = Table::firstOrCreate(
            ['name' => 'Table 1'],
            ['status' => 'busy']
        );

        return Order::create(array_merge([
            'table_id' => $table->id,
            'payment_method' => 'cash',
            'status' => 'completed',
            'subtotal' => 100000,
            'total_price' => 100000,
            'discount_type' => null,
            'discount_value' => 0,
            'discount_amount' => 0,
        ], $attributes));
    }

    /**
     * 1. Order cash + completed: được trả về.
     * 2. Order cash + pending: không được trả về.
     * 3. Order cash + processing: không được trả về.
     * 4. Order cash + trạng thái khác completed (draft, cancelled): không được trả về.
     * 5. Order completed nhưng thanh toán bằng bank, card hoặc split: không được trả về.
     */
    public function test_index_only_returns_cash_and_completed_orders(): void
    {
        // 1. Valid: cash + completed
        $cashCompleted = $this->createOrder([
            'payment_method' => 'cash',
            'status' => 'completed',
        ]);

        // 2. Invalid: cash + pending
        $cashPending = $this->createOrder([
            'payment_method' => 'cash',
            'status' => 'pending',
        ]);

        // 3. Invalid: cash + processing
        $cashProcessing = $this->createOrder([
            'payment_method' => 'cash',
            'status' => 'processing',
        ]);

        // 4. Invalid: cash + other non-completed states (draft, cancelled)
        $cashDraft = $this->createOrder([
            'payment_method' => 'cash',
            'status' => 'draft',
        ]);
        $cashCancelled = $this->createOrder([
            'payment_method' => 'cash',
            'status' => 'cancelled',
        ]);

        // 5. Invalid: completed but payment_method is bank, card, or split
        $bankCompleted = $this->createOrder([
            'payment_method' => 'bank',
            'status' => 'completed',
        ]);
        $cardCompleted = $this->createOrder([
            'payment_method' => 'card',
            'status' => 'completed',
        ]);
        $splitCompleted = $this->createOrder([
            'payment_method' => 'split',
            'status' => 'completed',
        ]);

        $response = $this->withHeaders($this->authHeaders())
            ->getJson('/api/v1/orders');

        $response->assertStatus(200);

        $returnedIds = collect($response->json('data'))->pluck('id')->all();

        // Must ONLY contain the cash + completed order
        $this->assertEquals([$cashCompleted->id], $returnedIds);
        $this->assertNotContains($cashPending->id, $returnedIds);
        $this->assertNotContains($cashProcessing->id, $returnedIds);
        $this->assertNotContains($cashDraft->id, $returnedIds);
        $this->assertNotContains($cashCancelled->id, $returnedIds);
        $this->assertNotContains($bankCompleted->id, $returnedIds);
        $this->assertNotContains($cardCompleted->id, $returnedIds);
        $this->assertNotContains($splitCompleted->id, $returnedIds);
    }

    /**
     * 6. Pagination and JSON response structure remain intact.
     */
    public function test_index_pagination_and_json_response_structure_remain_intact(): void
    {
        // Create 15 cash + completed orders
        for ($i = 1; $i <= 15; $i++) {
            $this->createOrder([
                'payment_method' => 'cash',
                'status' => 'completed',
            ]);
        }

        // Create 5 cash + pending orders that should NEVER appear in count or results
        for ($i = 1; $i <= 5; $i++) {
            $this->createOrder([
                'payment_method' => 'cash',
                'status' => 'pending',
            ]);
        }

        $response = $this->withHeaders($this->authHeaders())
            ->getJson('/api/v1/orders?per_page=5&page=2');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'table_id',
                        'reservation_id',
                        'user_id',
                        'cashier_id',
                        'merged_tables',
                        'order_type',
                        'status',
                        'subtotal',
                        'total_price',
                        'payment_method',
                        'table',
                        'items',
                        'payments',
                        'created_at',
                        'updated_at',
                    ],
                ],
                'links' => ['first', 'last', 'prev', 'next'],
                'meta' => [
                    'current_page',
                    'from',
                    'last_page',
                    'path',
                    'per_page',
                    'to',
                    'total',
                ],
            ]);

        $this->assertCount(5, $response->json('data'));
        $this->assertEquals(15, $response->json('meta.total'));
        $this->assertEquals(2, $response->json('meta.current_page'));
        $this->assertEquals(5, $response->json('meta.per_page'));
        $this->assertEquals(3, $response->json('meta.last_page'));
    }

    /**
     * 7. Endpoints for order details (show) and deleting order items remain unaffected.
     */
    public function test_show_and_order_items_endpoints_remain_unaffected(): void
    {
        $category = Category::firstOrCreate(['name' => 'Food'], ['type' => 'food']);
        $product = Product::create([
            'name' => 'Pho Bo',
            'name_vi' => 'Phở Bò',
            'price' => 50000,
            'type' => 'food',
            'category_id' => $category->id,
        ]);

        $order = $this->createOrder([
            'payment_method' => 'cash',
            'status' => 'completed',
            'subtotal' => 100000,
            'total_price' => 100000,
        ]);

        $item1 = OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'name' => 'Pho Bo 1',
            'quantity' => 1,
            'price' => 50000,
        ]);
        $item2 = OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'name' => 'Pho Bo 2',
            'quantity' => 1,
            'price' => 50000,
        ]);

        $payment = OrderPayment::create([
            'order_id' => $order->id,
            'payment_method' => 'cash',
            'amount' => 100000,
        ]);

        // 7a. GET /api/v1/orders/{order} works normally
        $showResponse = $this->withHeaders($this->authHeaders())
            ->getJson("/api/v1/orders/{$order->id}");
        $showResponse->assertStatus(200)
            ->assertJsonPath('data.id', $order->id)
            ->assertJsonPath('data.status', 'completed')
            ->assertJsonPath('data.payment_method', 'cash');

        // 7b. GET /api/v1/orders/{order}/items works normally
        $itemsResponse = $this->withHeaders($this->authHeaders())
            ->getJson("/api/v1/orders/{$order->id}/items");
        $itemsResponse->assertStatus(200)
            ->assertJsonCount(2, 'data');

        // 7c. DELETE /api/v1/orders/{order}/items works normally and synchronizes payment
        $deleteResponse = $this->withHeaders($this->authHeaders())
            ->deleteJson("/api/v1/orders/{$order->id}/items", [
                'item_ids' => [$item1->id],
            ]);
        $deleteResponse->assertStatus(200)
            ->assertJsonPath('order_summary.total_price', 50000);

        $order->refresh();
        $payment->refresh();
        $this->assertEquals(50000, $order->total_price);
        $this->assertEquals(50000, $payment->amount);
    }
}
