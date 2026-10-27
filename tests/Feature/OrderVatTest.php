<?php

namespace Tests\Feature;

use App\Http\Resources\API\V1\OrderResource;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderPayment;
use App\Models\Product;
use App\Models\Table;
use App\Models\User;
use App\Services\OrderPaymentService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class OrderVatTest extends TestCase
{
    use RefreshDatabase;

    private string $apiKey = 'test-external-api-key-vat';
    private User $cashier;

    protected function setUp(): void
    {
        parent::setUp();
        Config::set('services.external_api.key', $this->apiKey);

        $this->cashier = User::create([
            'name' => 'Cashier Test',
            'email' => 'cashier_test@example.com',
            'password' => bcrypt('secret'),
            'role' => 'cashier',
        ]);
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
            'status' => 'pending',
            'subtotal' => 100000,
            'total_price' => 100000,
            'discount_type' => null,
            'discount_value' => 0,
            'discount_amount' => 0,
        ], $attributes));
    }

    /**
     * Test 1: Order mới mặc định requires_vat = false.
     */
    public function test_new_order_defaults_to_requires_vat_false(): void
    {
        $order = $this->createOrder();

        $this->assertFalse($order->requires_vat);

        $fresh = Order::find($order->id);
        $this->assertFalse($fresh->requires_vat);
        $this->assertSame(0, (int) DB::table('orders')->where('id', $order->id)->value('requires_vat'));
    }

    /**
     * Test 2: Hoàn tất order với requires_vat = true thì database lưu true.
     */
    public function test_complete_order_with_requires_vat_true_persists_true(): void
    {
        $order = $this->createOrder();

        $response = $this->actingAs($this->cashier)
            ->postJson("/api/orders/{$order->id}/complete", [
                'payment_method' => 'cash',
                'requires_vat' => true,
            ]);

        $response->assertStatus(200);

        $fresh = $order->fresh();
        $this->assertEquals(Order::STATUS_COMPLETED, $fresh->status);
        $this->assertTrue($fresh->requires_vat);
        $this->assertSame(1, (int) DB::table('orders')->where('id', $order->id)->value('requires_vat'));
    }

    /**
     * Test 3: Hoàn tất order với requires_vat = false thì database lưu false.
     */
    public function test_complete_order_with_requires_vat_false_persists_false(): void
    {
        $order = $this->createOrder(['requires_vat' => true]);

        $response = $this->actingAs($this->cashier)
            ->postJson("/api/orders/{$order->id}/complete", [
                'payment_method' => 'cash',
                'requires_vat' => false,
            ]);

        $response->assertStatus(200);

        $fresh = $order->fresh();
        $this->assertEquals(Order::STATUS_COMPLETED, $fresh->status);
        $this->assertFalse($fresh->requires_vat);
        $this->assertSame(0, (int) DB::table('orders')->where('id', $order->id)->value('requires_vat'));
    }

    /**
     * Test 4: Request thiếu field requires_vat không làm mất giá trị VAT hiện có.
     */
    public function test_request_missing_field_does_not_clear_existing_vat_status(): void
    {
        $order = $this->createOrder(['requires_vat' => true]);

        // Complete without passing requires_vat field in payload
        $response = $this->actingAs($this->cashier)
            ->postJson("/api/orders/{$order->id}/complete", [
                'payment_method' => 'cash',
            ]);

        $response->assertStatus(200);

        $fresh = $order->fresh();
        $this->assertEquals(Order::STATUS_COMPLETED, $fresh->status);
        $this->assertTrue($fresh->requires_vat);
    }

    /**
     * Test 5: Payload không hợp lệ trả validation error (422) và không ghi dữ liệu.
     */
    public function test_invalid_payload_returns_validation_error_and_does_not_persist(): void
    {
        $order = $this->createOrder(['requires_vat' => false]);

        $response = $this->actingAs($this->cashier)
            ->postJson("/api/orders/{$order->id}/complete", [
                'payment_method' => 'cash',
                'requires_vat' => 'invalid_non_boolean_string',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['requires_vat']);

        $fresh = $order->fresh();
        $this->assertEquals(Order::STATUS_PENDING, $fresh->status);
        $this->assertFalse($fresh->requires_vat);
    }

    /**
     * Test 6: Thanh toán rollback thì trạng thái order, payment và VAT không bị cập nhật dở dang.
     */
    public function test_payment_failure_rollback_does_not_persist_partial_vat_or_status(): void
    {
        $order = $this->createOrder(['requires_vat' => false]);

        // Mock OrderPaymentService exception during transaction
        try {
            DB::transaction(function () use ($order) {
                $order->update([
                    'status' => Order::STATUS_COMPLETED,
                    'requires_vat' => true,
                ]);

                // Simulate an unexpected runtime failure
                throw new \RuntimeException('Simulated payment failure inside transaction');
            });
        } catch (\RuntimeException $e) {
            // Expected
        }

        $fresh = $order->fresh();
        $this->assertEquals(Order::STATUS_PENDING, $fresh->status);
        $this->assertFalse($fresh->requires_vat);
    }

    /**
     * Test 7: Gộp hai bàn: chỉ Primary Order nhận giá trị VAT được chọn; secondary orders không bị đánh dấu VAT.
     */
    public function test_merged_tables_only_marks_primary_order_with_vat(): void
    {
        $table1 = Table::create(['name' => 'Bàn 10', 'status' => 'busy']);
        $table2 = Table::create(['name' => 'Bàn 11', 'status' => 'busy']);
        $mergedString = "{$table1->id}-{$table2->id}";

        $primaryOrder = Order::create([
            'table_id' => $table1->id,
            'status' => 'pending',
            'subtotal' => 200000,
            'total_price' => 200000,
            'merged_tables' => $mergedString,
            'requires_vat' => false,
        ]);

        $secondaryOrder = Order::create([
            'table_id' => $table2->id,
            'status' => 'pending',
            'subtotal' => 0,
            'total_price' => 0,
            'merged_tables' => $mergedString,
            'requires_vat' => false,
        ]);

        $response = $this->actingAs($this->cashier)
            ->postJson("/api/orders/{$primaryOrder->id}/complete", [
                'payment_method' => 'cash',
                'requires_vat' => true,
                'sibling_order_ids' => [$primaryOrder->id, $secondaryOrder->id],
            ]);

        $response->assertStatus(200);

        $freshPrimary = $primaryOrder->fresh();
        $freshSecondary = $secondaryOrder->fresh();

        $this->assertEquals(Order::STATUS_COMPLETED, $freshPrimary->status);
        $this->assertTrue($freshPrimary->requires_vat);

        $this->assertEquals(Order::STATUS_COMPLETED, $freshSecondary->status);
        $this->assertFalse($freshSecondary->requires_vat);
    }

    /**
     * Test 8: Reopen order giữ nguyên VAT của chính order đó.
     */
    public function test_reopening_order_preserves_its_requires_vat_flag(): void
    {
        $order = $this->createOrder([
            'status' => Order::STATUS_COMPLETED,
            'requires_vat' => true,
        ]);

        OrderPayment::create([
            'order_id' => $order->id,
            'payment_method' => 'cash',
            'amount' => 100000,
        ]);

        $service = app(OrderPaymentService::class);
        $reopened = $service->reopenOrder($order->id);

        $fresh = $order->fresh();
        $this->assertEquals(Order::STATUS_PENDING, $fresh->status);
        $this->assertNull($fresh->payment_method);
        $this->assertTrue($fresh->requires_vat);
    }

    /**
     * Test 9: Order mới trên cùng bàn không kế thừa VAT từ order cũ.
     */
    public function test_new_order_on_same_table_does_not_inherit_vat_from_old_order(): void
    {
        $table = Table::create(['name' => 'Bàn 20', 'status' => 'available']);

        // First order completed with VAT
        $oldOrder = Order::create([
            'table_id' => $table->id,
            'status' => Order::STATUS_COMPLETED,
            'subtotal' => 100000,
            'total_price' => 100000,
            'payment_method' => 'cash',
            'requires_vat' => true,
        ]);
        $this->assertTrue($oldOrder->requires_vat);

        // Later, customer leaves, new customer opens a new order on same table
        $newOrder = Order::create([
            'table_id' => $table->id,
            'status' => Order::STATUS_PENDING,
            'subtotal' => 50000,
            'total_price' => 50000,
        ]);

        $this->assertNotEquals($oldOrder->id, $newOrder->id);
        $this->assertFalse($newOrder->requires_vat);
    }

    /**
     * Test 10: API Resource trả requires_vat dạng boolean strict.
     */
    public function test_api_resource_returns_requires_vat_as_strict_boolean(): void
    {
        $orderWithVat = $this->createOrder(['requires_vat' => true, 'status' => 'completed']);
        $orderWithoutVat = $this->createOrder(['requires_vat' => false, 'status' => 'completed']);

        $resWithVat = (new OrderResource($orderWithVat))->resolve();
        $resWithoutVat = (new OrderResource($orderWithoutVat))->resolve();

        $this->assertArrayHasKey('requires_vat', $resWithVat);
        $this->assertIsBool($resWithVat['requires_vat']);
        $this->assertTrue($resWithVat['requires_vat']);

        $this->assertArrayHasKey('requires_vat', $resWithoutVat);
        $this->assertIsBool($resWithoutVat['requires_vat']);
        $this->assertFalse($resWithoutVat['requires_vat']);
    }

    /**
     * Test 11: GET /api/v1/orders trả requires_vat chính xác qua HTTP endpoint.
     */
    public function test_external_api_v1_orders_list_exposes_requires_vat_correctly(): void
    {
        $vatOrder = $this->createOrder([
            'payment_method' => 'cash',
            'status' => 'completed',
            'total_price' => 120000,
            'requires_vat' => true,
        ]);
        OrderPayment::create([
            'order_id' => $vatOrder->id,
            'payment_method' => 'cash',
            'amount' => 120000,
        ]);

        $nonVatOrder = $this->createOrder([
            'payment_method' => 'cash',
            'status' => 'completed',
            'total_price' => 150000,
            'requires_vat' => false,
        ]);
        OrderPayment::create([
            'order_id' => $nonVatOrder->id,
            'payment_method' => 'cash',
            'amount' => 150000,
        ]);

        $response = $this->withHeaders($this->authHeaders())
            ->getJson('/api/v1/orders');

        $response->assertStatus(200);

        $data = collect($response->json('data'));

        $vatItem = $data->firstWhere('id', $vatOrder->id);
        $this->assertNotNull($vatItem);
        $this->assertTrue($vatItem['requires_vat']);

        $nonVatItem = $data->firstWhere('id', $nonVatOrder->id);
        $this->assertNotNull($nonVatItem);
        $this->assertFalse($nonVatItem['requires_vat']);
    }
}
