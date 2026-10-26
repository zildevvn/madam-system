<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderPayment;
use App\Models\Product;
use App\Models\Table;
use App\Models\User;
use App\Services\StatsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ExternalApiOrderItemTest extends TestCase
{
    use RefreshDatabase;

    private string $apiKey = 'test-external-api-key-999';

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

    private function createProduct(string $name = 'Test Dish', int $price = 50000): Product
    {
        $category = Category::firstOrCreate(
            ['name' => 'Main Courses'],
            ['type' => 'food']
        );

        return Product::create([
            'name' => $name,
            'name_vi' => $name . ' (VI)',
            'price' => $price,
            'type' => 'food',
            'category_id' => $category->id,
        ]);
    }

    private function createCashOrder(array $attributes = []): Order
    {
        $table = Table::firstOrCreate(
            ['name' => 'Table 10'],
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

    // ─────────────────────────────────────────────────────────────
    // AUTHENTICATION TESTS
    // ─────────────────────────────────────────────────────────────

    public function test_external_api_authenticates_bearer_key_for_items_endpoints(): void
    {
        $order = $this->createCashOrder();

        // 1. Missing Authorization header
        $this->getJson("/api/v1/orders/{$order->id}/items")
            ->assertStatus(401);

        $this->deleteJson("/api/v1/orders/{$order->id}/items", ['item_ids' => [1]])
            ->assertStatus(401);

        // 2. Invalid API key
        $this->withHeader('Authorization', 'Bearer wrong-key')
            ->getJson("/api/v1/orders/{$order->id}/items")
            ->assertStatus(401);

        // 3. User Sanctum token is rejected by external API
        $user = User::factory()->create();
        $token = $user->createToken('test_token')->plainTextToken;

        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson("/api/v1/orders/{$order->id}/items")
            ->assertStatus(401);

        // 4. Valid external key is accepted
        $this->withHeaders($this->authHeaders())
            ->getJson("/api/v1/orders/{$order->id}/items")
            ->assertStatus(200);
    }

    // ─────────────────────────────────────────────────────────────
    // GET /api/v1/orders/{order}/items TESTS
    // ─────────────────────────────────────────────────────────────

    public function test_get_items_returns_items_belonging_to_cash_order(): void
    {
        $product = $this->createProduct('Beef Noodles', 60000);
        $order = $this->createCashOrder();

        $item1 = OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'name' => 'Beef Noodles',
            'type' => 'food',
            'quantity' => 2,
            'price' => 60000,
            'discount' => 10000,
            'discount_type' => 'fixed',
            'note' => 'No onions',
            'status' => 'served',
            'sort_order' => 1,
        ]);

        $item2 = OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'name' => 'Beef Noodles Extra',
            'type' => 'food',
            'quantity' => 1,
            'price' => 70000,
            'discount' => 0,
            'discount_type' => 'fixed',
            'status' => 'cooking',
            'sort_order' => 2,
        ]);

        // Another order to verify isolation
        $otherOrder = $this->createCashOrder();
        OrderItem::create([
            'order_id' => $otherOrder->id,
            'product_id' => $product->id,
            'name' => 'Foreign Dish',
            'quantity' => 1,
            'price' => 50000,
        ]);

        $response = $this->withHeaders($this->authHeaders())
            ->getJson("/api/v1/orders/{$order->id}/items");

        $response->assertStatus(200)
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.id', $item1->id)
            ->assertJsonPath('data.0.order_id', $order->id)
            ->assertJsonPath('data.0.name', 'Beef Noodles')
            ->assertJsonPath('data.0.quantity', 2)
            ->assertJsonPath('data.0.price', 60000)
            ->assertJsonPath('data.0.gross_total', 120000)
            ->assertJsonPath('data.0.discount_amount', 20000)
            ->assertJsonPath('data.0.final_price', 100000)
            ->assertJsonPath('data.0.note', 'No onions')
            ->assertJsonPath('data.1.id', $item2->id);
    }

    public function test_get_items_returns_404_for_non_cash_order(): void
    {
        $nonCashOrder = $this->createCashOrder(['payment_method' => 'bank']);

        $this->withHeaders($this->authHeaders())
            ->getJson("/api/v1/orders/{$nonCashOrder->id}/items")
            ->assertStatus(404);
    }

    public function test_get_items_returns_404_for_non_existent_order(): void
    {
        $this->withHeaders($this->authHeaders())
            ->getJson('/api/v1/orders/9999999/items')
            ->assertStatus(404);
    }

    public function test_get_items_returns_empty_data_when_order_has_no_items(): void
    {
        $order = $this->createCashOrder();

        $this->withHeaders($this->authHeaders())
            ->getJson("/api/v1/orders/{$order->id}/items")
            ->assertStatus(200)
            ->assertJson([
                'data' => [],
            ]);
    }

    // ─────────────────────────────────────────────────────────────
    // DELETE /api/v1/orders/{order}/items TESTS
    // ─────────────────────────────────────────────────────────────

    public function test_delete_items_validates_request_body(): void
    {
        $order = $this->createCashOrder();

        // 1. Empty body
        $this->withHeaders($this->authHeaders())
            ->deleteJson("/api/v1/orders/{$order->id}/items", [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['item_ids']);

        // 2. Empty array
        $this->withHeaders($this->authHeaders())
            ->deleteJson("/api/v1/orders/{$order->id}/items", ['item_ids' => []])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['item_ids']);

        // 3. Invalid items (non-integers or <= 0)
        $this->withHeaders($this->authHeaders())
            ->deleteJson("/api/v1/orders/{$order->id}/items", ['item_ids' => ['invalid', -1]])
            ->assertStatus(422);

        // 4. Duplicate IDs
        $this->withHeaders($this->authHeaders())
            ->deleteJson("/api/v1/orders/{$order->id}/items", ['item_ids' => [10, 10]])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['item_ids.0']);
    }

    public function test_delete_items_returns_404_for_non_cash_order(): void
    {
        $nonCashOrder = $this->createCashOrder(['payment_method' => 'card']);

        $this->withHeaders($this->authHeaders())
            ->deleteJson("/api/v1/orders/{$nonCashOrder->id}/items", ['item_ids' => [1]])
            ->assertStatus(404);
    }

    public function test_delete_single_item_successfully(): void
    {
        $product = $this->createProduct('Spring Rolls', 40000);
        $order = $this->createCashOrder([
            'subtotal' => 80000,
            'total_price' => 80000,
        ]);

        $item1 = OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'name' => 'Spring Rolls 1',
            'quantity' => 1,
            'price' => 40000,
        ]);

        $item2 = OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'name' => 'Spring Rolls 2',
            'quantity' => 1,
            'price' => 40000,
        ]);

        $response = $this->withHeaders($this->authHeaders())
            ->deleteJson("/api/v1/orders/{$order->id}/items", [
                'item_ids' => [$item1->id],
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'order_id' => $order->id,
                'deleted_ids' => [$item1->id],
                'deleted_count' => 1,
                'not_found_ids' => [],
                'order_summary' => [
                    'subtotal' => 40000,
                    'total_price' => 40000,
                    'remaining_items_count' => 1,
                ],
            ]);

        $this->assertDatabaseMissing('order_items', ['id' => $item1->id]);
        $this->assertDatabaseHas('order_items', ['id' => $item2->id]);
        $this->assertDatabaseHas('orders', ['id' => $order->id]);
    }

    public function test_delete_multiple_items_successfully(): void
    {
        $product = $this->createProduct('Item', 30000);
        $order = $this->createCashOrder();

        $item1 = OrderItem::create(['order_id' => $order->id, 'product_id' => $product->id, 'name' => '1', 'quantity' => 1, 'price' => 30000]);
        $item2 = OrderItem::create(['order_id' => $order->id, 'product_id' => $product->id, 'name' => '2', 'quantity' => 1, 'price' => 30000]);
        $item3 = OrderItem::create(['order_id' => $order->id, 'product_id' => $product->id, 'name' => '3', 'quantity' => 1, 'price' => 30000]);

        $response = $this->withHeaders($this->authHeaders())
            ->deleteJson("/api/v1/orders/{$order->id}/items", [
                'item_ids' => [$item1->id, $item2->id],
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'deleted_ids' => [$item1->id, $item2->id],
                'deleted_count' => 2,
                'order_summary' => [
                    'subtotal' => 30000,
                    'total_price' => 30000,
                    'remaining_items_count' => 1,
                ],
            ]);

        $this->assertDatabaseMissing('order_items', ['id' => $item1->id]);
        $this->assertDatabaseMissing('order_items', ['id' => $item2->id]);
        $this->assertDatabaseHas('order_items', ['id' => $item3->id]);
    }

    public function test_delete_items_partial_deletion_and_reports_not_found_ids(): void
    {
        $product = $this->createProduct('Item', 50000);
        $order = $this->createCashOrder();
        $otherOrder = $this->createCashOrder();

        $item1 = OrderItem::create(['order_id' => $order->id, 'product_id' => $product->id, 'name' => 'My Item', 'quantity' => 1, 'price' => 50000]);
        $foreignItem = OrderItem::create(['order_id' => $otherOrder->id, 'product_id' => $product->id, 'name' => 'Other Item', 'quantity' => 1, 'price' => 50000]);

        // Send: item1 (belongs to this order), foreignItem (belongs to other order), 999999 (does not exist)
        $response = $this->withHeaders($this->authHeaders())
            ->deleteJson("/api/v1/orders/{$order->id}/items", [
                'item_ids' => [$item1->id, $foreignItem->id, 999999],
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'deleted_ids' => [$item1->id],
                'deleted_count' => 1,
                'not_found_ids' => [$foreignItem->id, 999999],
            ]);

        // item1 is deleted
        $this->assertDatabaseMissing('order_items', ['id' => $item1->id]);
        // foreignItem MUST NOT be deleted
        $this->assertDatabaseHas('order_items', ['id' => $foreignItem->id]);
    }

    public function test_delete_items_returns_404_when_no_matching_items_found(): void
    {
        $product = $this->createProduct('Item', 50000);
        $order = $this->createCashOrder();
        $otherOrder = $this->createCashOrder();

        $foreignItem = OrderItem::create(['order_id' => $otherOrder->id, 'product_id' => $product->id, 'name' => 'Other Item', 'quantity' => 1, 'price' => 50000]);

        $response = $this->withHeaders($this->authHeaders())
            ->deleteJson("/api/v1/orders/{$order->id}/items", [
                'item_ids' => [$foreignItem->id, 888888],
            ]);

        $response->assertStatus(404)
            ->assertJson([
                'success' => false,
                'message' => 'No matching items found for this order.',
                'deleted_ids' => [],
                'deleted_count' => 0,
                'not_found_ids' => [$foreignItem->id, 888888],
            ]);

        $this->assertDatabaseHas('order_items', ['id' => $foreignItem->id]);
    }

    public function test_delete_items_accepts_fallback_ids_field(): void
    {
        $product = $this->createProduct('Item', 50000);
        $order = $this->createCashOrder();
        $item = OrderItem::create(['order_id' => $order->id, 'product_id' => $product->id, 'name' => 'Test', 'quantity' => 1, 'price' => 50000]);

        // Client sends 'ids' instead of 'item_ids'
        $response = $this->withHeaders($this->authHeaders())
            ->deleteJson("/api/v1/orders/{$order->id}/items", [
                'ids' => [$item->id],
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'deleted_ids' => [$item->id],
                'deleted_count' => 1,
            ]);

        $this->assertDatabaseMissing('order_items', ['id' => $item->id]);
    }

    public function test_delete_items_recalculates_order_totals_and_syncs_single_cash_payment(): void
    {
        $product = $this->createProduct('Steak', 100000);

        // Order with 10% discount
        $order = $this->createCashOrder([
            'discount_type' => 'percent',
            'discount_value' => 10,
            'subtotal' => 200000,
            'discount_amount' => 20000,
            'total_price' => 180000,
        ]);

        $item1 = OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'name' => 'Steak 1',
            'quantity' => 1,
            'price' => 100000,
        ]);

        $item2 = OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'name' => 'Steak 2',
            'quantity' => 1,
            'price' => 100000,
        ]);

        // Historical payment record with single cash payment
        $payment = OrderPayment::create([
            'order_id' => $order->id,
            'payment_method' => 'cash',
            'amount' => 180000,
        ]);

        // Delete Item 2
        $response = $this->withHeaders($this->authHeaders())
            ->deleteJson("/api/v1/orders/{$order->id}/items", [
                'item_ids' => [$item2->id],
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'order_summary' => [
                    'subtotal' => 100000,      // Remaining item 1
                    'discount_type' => 'percent',
                    'discount_value' => 10,
                    'discount_amount' => 10000, // 10% of 100,000
                    'total_price' => 90000,     // 100,000 - 10,000
                    'remaining_items_count' => 1,
                ],
            ]);

        // Verify order record updated in DB
        $order->refresh();
        $this->assertEquals(100000, $order->subtotal);
        $this->assertEquals(10000, $order->discount_amount);
        $this->assertEquals(90000, $order->total_price);

        // CRUCIAL: Verify single cash OrderPayment is synchronized to new total_price
        $payment->refresh();
        $this->assertEquals(90000, $payment->amount);
        $this->assertDatabaseCount('order_payments', 1);
    }

    public function test_delete_all_items_sets_cash_payment_to_zero(): void
    {
        $product = $this->createProduct('Item', 50000);
        $order = $this->createCashOrder([
            'subtotal' => 50000,
            'total_price' => 50000,
        ]);

        $item = OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'name' => 'Single Item',
            'quantity' => 1,
            'price' => 50000,
        ]);

        $payment = OrderPayment::create([
            'order_id' => $order->id,
            'payment_method' => 'cash',
            'amount' => 50000,
        ]);

        $response = $this->withHeaders($this->authHeaders())
            ->deleteJson("/api/v1/orders/{$order->id}/items", [
                'item_ids' => [$item->id],
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'order_summary' => [
                    'subtotal' => 0,
                    'discount_amount' => 0,
                    'total_price' => 0,
                    'remaining_items_count' => 0,
                ],
            ]);

        // Order still exists in database!
        $this->assertDatabaseHas('orders', ['id' => $order->id]);
        $this->assertDatabaseCount('order_items', 0);

        // Cash payment amount synchronized to 0
        $payment->refresh();
        $this->assertEquals(0, $payment->amount);
    }

    public function test_delete_items_on_order_without_payments_keeps_behavior_and_does_not_create_payment(): void
    {
        $product = $this->createProduct('Item', 60000);
        $order = $this->createCashOrder([
            'subtotal' => 120000,
            'total_price' => 120000,
        ]);

        $item1 = OrderItem::create(['order_id' => $order->id, 'product_id' => $product->id, 'name' => '1', 'quantity' => 1, 'price' => 60000]);
        $item2 = OrderItem::create(['order_id' => $order->id, 'product_id' => $product->id, 'name' => '2', 'quantity' => 1, 'price' => 60000]);

        // Confirm 0 payments exist initially
        $this->assertEquals(0, $order->payments()->count());

        $response = $this->withHeaders($this->authHeaders())
            ->deleteJson("/api/v1/orders/{$order->id}/items", [
                'item_ids' => [$item1->id],
            ]);

        $response->assertStatus(200);

        $order->refresh();
        $this->assertEquals(60000, $order->total_price);

        // Must still have 0 payments; no payment was automatically created
        $this->assertDatabaseCount('order_payments', 0);
        $this->assertEquals(0, $order->payments()->count());
    }

    public function test_delete_items_on_order_with_multiple_payments_does_not_modify_payments(): void
    {
        $product = $this->createProduct('Item', 50000);
        $order = $this->createCashOrder([
            'subtotal' => 100000,
            'total_price' => 100000,
        ]);

        $item1 = OrderItem::create(['order_id' => $order->id, 'product_id' => $product->id, 'name' => '1', 'quantity' => 1, 'price' => 50000]);
        $item2 = OrderItem::create(['order_id' => $order->id, 'product_id' => $product->id, 'name' => '2', 'quantity' => 1, 'price' => 50000]);

        // Multiple payments: split into 2 transactions
        $payment1 = OrderPayment::create([
            'order_id' => $order->id,
            'payment_method' => 'cash',
            'amount' => 60000,
        ]);
        $payment2 = OrderPayment::create([
            'order_id' => $order->id,
            'payment_method' => 'cash',
            'amount' => 40000,
        ]);

        $response = $this->withHeaders($this->authHeaders())
            ->deleteJson("/api/v1/orders/{$order->id}/items", [
                'item_ids' => [$item1->id],
            ]);

        $response->assertStatus(200);

        $order->refresh();
        $this->assertEquals(50000, $order->total_price);

        // Neither payment was modified because multiple payments rule requires manual review
        $payment1->refresh();
        $payment2->refresh();
        $this->assertEquals(60000, $payment1->amount);
        $this->assertEquals(40000, $payment2->amount);
    }

    public function test_delete_items_on_order_with_single_non_cash_payment_does_not_modify_payment(): void
    {
        $product = $this->createProduct('Item', 50000);
        $order = $this->createCashOrder([
            'subtotal' => 100000,
            'total_price' => 100000,
        ]);

        $item1 = OrderItem::create(['order_id' => $order->id, 'product_id' => $product->id, 'name' => '1', 'quantity' => 1, 'price' => 50000]);
        $item2 = OrderItem::create(['order_id' => $order->id, 'product_id' => $product->id, 'name' => '2', 'quantity' => 1, 'price' => 50000]);

        // Abnormal state: payment_method is 'bank' while order is marked 'cash'
        $payment = OrderPayment::create([
            'order_id' => $order->id,
            'payment_method' => 'bank',
            'amount' => 100000,
        ]);

        $response = $this->withHeaders($this->authHeaders())
            ->deleteJson("/api/v1/orders/{$order->id}/items", [
                'item_ids' => [$item1->id],
            ]);

        $response->assertStatus(200);

        $payment->refresh();
        $this->assertEquals(100000, $payment->amount);
    }

    public function test_delete_items_rolls_back_atomically_when_recalculation_fails(): void
    {
        $product = $this->createProduct('Item', 50000);
        $order = $this->createCashOrder([
            'subtotal' => 50000,
            'total_price' => 50000,
        ]);

        $item = OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'name' => 'Protected Item',
            'quantity' => 1,
            'price' => 50000,
        ]);

        $payment = OrderPayment::create([
            'order_id' => $order->id,
            'payment_method' => 'cash',
            'amount' => 50000,
        ]);

        // Hook into eloquent saving event to simulate database/application error during order recalculation
        $failureTriggered = false;
        Order::saving(function ($model) use ($order, &$failureTriggered) {
            if ($model->id === $order->id && $model->isDirty('total_price')) {
                $failureTriggered = true;
                throw new \RuntimeException('Simulated error during atomic recalculation');
            }
        });

        $this->withoutExceptionHandling();

        try {
            $this->withHeaders($this->authHeaders())
                ->deleteJson("/api/v1/orders/{$order->id}/items", [
                    'item_ids' => [$item->id],
                ]);
            $this->fail('Expected RuntimeException was not thrown.');
        } catch (\RuntimeException $e) {
            $this->assertSame('Simulated error during atomic recalculation', $e->getMessage());
        }

        $this->assertTrue($failureTriggered, 'Expected the failure hook to have been executed');

        // Verify transaction rolled back: item is STILL in DB, payment is STILL 50,000
        $this->assertDatabaseHas('order_items', ['id' => $item->id]);
        $payment->refresh();
        $this->assertEquals(50000, $payment->amount);
    }

    public function test_delete_items_updates_admin_revenue_report(): void
    {
        $product = $this->createProduct('Report Dish', 100000);
        $order = $this->createCashOrder([
            'subtotal' => 200000,
            'total_price' => 200000,
            'status' => 'completed',
            'updated_at' => now(),
        ]);

        $item1 = OrderItem::create(['order_id' => $order->id, 'product_id' => $product->id, 'name' => '1', 'quantity' => 1, 'price' => 100000]);
        $item2 = OrderItem::create(['order_id' => $order->id, 'product_id' => $product->id, 'name' => '2', 'quantity' => 1, 'price' => 100000]);

        $payment = OrderPayment::create([
            'order_id' => $order->id,
            'payment_method' => 'cash',
            'amount' => 200000,
        ]);

        $statsService = app(StatsService::class);
        $reportBefore = $statsService->getRevenueReport('day', now()->toDateString());
        $this->assertEquals(200000, (int) $reportBefore['cash_revenue']);

        // Delete item 1
        $this->withHeaders($this->authHeaders())
            ->deleteJson("/api/v1/orders/{$order->id}/items", [
                'item_ids' => [$item1->id],
            ])
            ->assertStatus(200);

        // Check report after deletion
        $reportAfter = $statsService->getRevenueReport('day', now()->toDateString());
        $this->assertEquals(100000, (int) $reportAfter['cash_revenue']);
        $this->assertEquals(100000, (int) $reportAfter['total_revenue']);
    }

    public function test_delete_items_updates_order_export_excel_csv(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $adminToken = $admin->createToken('admin_export')->plainTextToken;
        $adminHeaders = ['Authorization' => 'Bearer ' . $adminToken];

        $product = $this->createProduct('Export Dish', 100000);
        $order = $this->createCashOrder([
            'subtotal' => 200000,
            'total_price' => 200000,
            'status' => 'completed',
        ]);

        $item1 = OrderItem::create(['order_id' => $order->id, 'product_id' => $product->id, 'name' => '1', 'quantity' => 1, 'price' => 100000]);
        $item2 = OrderItem::create(['order_id' => $order->id, 'product_id' => $product->id, 'name' => '2', 'quantity' => 1, 'price' => 100000]);

        $payment = OrderPayment::create([
            'order_id' => $order->id,
            'payment_method' => 'cash',
            'amount' => 200000,
        ]);

        // Export before deletion: TM has ="200.000"
        $responseBefore = $this->withHeaders($adminHeaders)->get('/api/order-export/export');
        $responseBefore->assertStatus(200);
        $csvBefore = $responseBefore->streamedContent();
        $this->assertStringContainsString('"=""200.000"""', $csvBefore);

        // Delete item 1
        $this->withHeaders($this->authHeaders())
            ->deleteJson("/api/v1/orders/{$order->id}/items", [
                'item_ids' => [$item1->id],
            ])
            ->assertStatus(200);

        // Export after deletion: TM now has ="100.000"
        $responseAfter = $this->withHeaders($adminHeaders)->get('/api/order-export/export');
        $responseAfter->assertStatus(200);
        $csvAfter = $responseAfter->streamedContent();
        $this->assertStringContainsString('"=""100.000"""', $csvAfter);
        $this->assertStringNotContainsString('"=""200.000"""', $csvAfter);
    }

    public function test_existing_order_deletion_endpoints_remain_functional(): void
    {
        $order1 = $this->createCashOrder();
        $order2 = $this->createCashOrder();

        // 1. DELETE /api/v1/orders/{order}
        $this->withHeaders($this->authHeaders())
            ->deleteJson("/api/v1/orders/{$order1->id}")
            ->assertStatus(204);

        $this->assertDatabaseMissing('orders', ['id' => $order1->id]);

        // 2. DELETE /api/v1/orders (bulkDestroy)
        $this->withHeaders($this->authHeaders())
            ->deleteJson('/api/v1/orders', [
                'ids' => [$order2->id],
            ])
            ->assertStatus(200)
            ->assertJson([
                'deleted_ids' => [$order2->id],
                'deleted_count' => 1,
            ]);

        $this->assertDatabaseMissing('orders', ['id' => $order2->id]);
    }
}
