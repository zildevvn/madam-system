<?php

namespace Tests\Feature;

use App\Http\Resources\API\V1\OrderResource;
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
     * Test 1 & 2 & 3 & 4 & 5:
     * - Cash + completed: được lấy và cash_amount = total_price
     * - Split + completed có cash và bank: được lấy; cash_amount = phần tiền mặt
     * - Split + completed có nhiều payment record tiền mặt: cộng đúng tổng
     * - Split + completed không có tiền mặt (bank + card) hoặc tiền mặt = 0: không được lấy
     * - Bank/card + completed: không được lấy
     */
    public function test_index_retrieves_cash_and_eligible_split_orders_with_correct_cash_amount(): void
    {
        // 1. Cash + completed (100k)
        $cashOrder = $this->createOrder([
            'payment_method' => 'cash',
            'status' => 'completed',
            'total_price' => 100000,
        ]);
        OrderPayment::create([
            'order_id' => $cashOrder->id,
            'payment_method' => 'cash',
            'amount' => 100000,
        ]);

        // 2. Split + completed: 60k cash + 40k bank (Total 100k)
        $splitOrderWithCash = $this->createOrder([
            'payment_method' => 'split',
            'status' => 'completed',
            'total_price' => 100000,
        ]);
        OrderPayment::create([
            'order_id' => $splitOrderWithCash->id,
            'payment_method' => 'cash',
            'amount' => 60000,
        ]);
        OrderPayment::create([
            'order_id' => $splitOrderWithCash->id,
            'payment_method' => 'bank',
            'amount' => 40000,
        ]);

        // 3. Split + completed with multiple cash payment records: 30k cash + 20k cash + 50k card (Total 100k)
        $splitMultiCashOrder = $this->createOrder([
            'payment_method' => 'split',
            'status' => 'completed',
            'total_price' => 100000,
        ]);
        OrderPayment::create([
            'order_id' => $splitMultiCashOrder->id,
            'payment_method' => 'cash',
            'amount' => 30000,
        ]);
        OrderPayment::create([
            'order_id' => $splitMultiCashOrder->id,
            'payment_method' => 'cash',
            'amount' => 20000,
        ]);
        OrderPayment::create([
            'order_id' => $splitMultiCashOrder->id,
            'payment_method' => 'card',
            'amount' => 50000,
        ]);

        // 4. Split + completed WITHOUT cash (bank 50k + card 50k) -> MUST NOT be retrieved
        $splitNoCashOrder = $this->createOrder([
            'payment_method' => 'split',
            'status' => 'completed',
            'total_price' => 100000,
        ]);
        OrderPayment::create([
            'order_id' => $splitNoCashOrder->id,
            'payment_method' => 'bank',
            'amount' => 50000,
        ]);
        OrderPayment::create([
            'order_id' => $splitNoCashOrder->id,
            'payment_method' => 'card',
            'amount' => 50000,
        ]);

        // 4b. Split + completed with cash = 0 (cash 0 + bank 100k) -> MUST NOT be retrieved
        $splitZeroCashOrder = $this->createOrder([
            'payment_method' => 'split',
            'status' => 'completed',
            'total_price' => 100000,
        ]);
        OrderPayment::create([
            'order_id' => $splitZeroCashOrder->id,
            'payment_method' => 'cash',
            'amount' => 0,
        ]);
        OrderPayment::create([
            'order_id' => $splitZeroCashOrder->id,
            'payment_method' => 'bank',
            'amount' => 100000,
        ]);

        // 5. Bank / card + completed -> MUST NOT be retrieved
        $bankOrder = $this->createOrder([
            'payment_method' => 'bank',
            'status' => 'completed',
            'total_price' => 100000,
        ]);
        $cardOrder = $this->createOrder([
            'payment_method' => 'card',
            'status' => 'completed',
            'total_price' => 100000,
        ]);

        $response = $this->withHeaders($this->authHeaders())
            ->getJson('/api/v1/orders');

        $response->assertStatus(200);

        $data = collect($response->json('data'));
        $returnedIds = $data->pluck('id')->all();

        // Check returned orders
        $this->assertContains($cashOrder->id, $returnedIds);
        $this->assertContains($splitOrderWithCash->id, $returnedIds);
        $this->assertContains($splitMultiCashOrder->id, $returnedIds);

        // Check excluded orders
        $this->assertNotContains($splitNoCashOrder->id, $returnedIds);
        $this->assertNotContains($splitZeroCashOrder->id, $returnedIds);
        $this->assertNotContains($bankOrder->id, $returnedIds);
        $this->assertNotContains($cardOrder->id, $returnedIds);
        $this->assertCount(3, $returnedIds);

        // Check individual cash_amount calculations
        $cashItem = $data->firstWhere('id', $cashOrder->id);
        $this->assertEquals(100000, $cashItem['total_price']);
        $this->assertEquals(100000, $cashItem['cash_amount']);

        $splitItem = $data->firstWhere('id', $splitOrderWithCash->id);
        $this->assertEquals(100000, $splitItem['total_price']);
        $this->assertEquals(60000, $splitItem['cash_amount']); // ONLY the cash portion!

        $splitMultiItem = $data->firstWhere('id', $splitMultiCashOrder->id);
        $this->assertEquals(100000, $splitMultiItem['total_price']);
        $this->assertEquals(50000, $splitMultiItem['cash_amount']); // 30k + 20k = 50k
    }

    /**
     * Test 6: Cash or Split but status != completed (pending, processing, draft, cancelled) -> Bị loại
     */
    public function test_non_completed_orders_are_strictly_excluded(): void
    {
        // Cash with pending, processing, draft, cancelled
        $cashPending = $this->createOrder(['payment_method' => 'cash', 'status' => 'pending']);
        $cashProcessing = $this->createOrder(['payment_method' => 'cash', 'status' => 'processing']);
        $cashDraft = $this->createOrder(['payment_method' => 'cash', 'status' => 'draft']);
        $cashCancelled = $this->createOrder(['payment_method' => 'cash', 'status' => 'cancelled']);

        // Split with cash payment but pending/processing/cancelled
        $splitPending = $this->createOrder(['payment_method' => 'split', 'status' => 'pending']);
        OrderPayment::create(['order_id' => $splitPending->id, 'payment_method' => 'cash', 'amount' => 50000]);

        $splitProcessing = $this->createOrder(['payment_method' => 'split', 'status' => 'processing']);
        OrderPayment::create(['order_id' => $splitProcessing->id, 'payment_method' => 'cash', 'amount' => 50000]);

        $splitCancelled = $this->createOrder(['payment_method' => 'split', 'status' => 'cancelled']);
        OrderPayment::create(['order_id' => $splitCancelled->id, 'payment_method' => 'cash', 'amount' => 50000]);

        $response = $this->withHeaders($this->authHeaders())
            ->getJson('/api/v1/orders');

        $response->assertStatus(200);
        $returnedIds = collect($response->json('data'))->pluck('id')->all();

        $this->assertEmpty($returnedIds);
    }

    /**
     * Test 7: Truyền ?status=pending không thể trả về order pending
     */
    public function test_passing_status_query_param_cannot_override_completed_filter(): void
    {
        $cashPending = $this->createOrder(['payment_method' => 'cash', 'status' => 'pending']);
        $cashCompleted = $this->createOrder(['payment_method' => 'cash', 'status' => 'completed']);

        // Attempt to request status=pending
        $response = $this->withHeaders($this->authHeaders())
            ->getJson('/api/v1/orders?status=pending');

        $response->assertStatus(200);
        $returnedIds = collect($response->json('data'))->pluck('id')->all();

        // Must NOT contain the pending order!
        $this->assertNotContains($cashPending->id, $returnedIds);
        $this->assertEmpty($returnedIds);
    }

    /**
     * Test 8: Pagination, search, date filters and JSON response remain compatible
     */
    public function test_pagination_search_and_date_filters_remain_functional(): void
    {
        $order1 = $this->createOrder([
            'payment_method' => 'cash',
            'status' => 'completed',
            'cashier_note' => 'VIP Customer',
        ]);
        $order1->created_at = '2026-10-10 10:00:00';
        $order1->save();

        $order2 = $this->createOrder([
            'payment_method' => 'split',
            'status' => 'completed',
            'cashier_note' => 'Regular Customer',
        ]);
        $order2->created_at = '2026-10-20 10:00:00';
        $order2->save();
        OrderPayment::create(['order_id' => $order2->id, 'payment_method' => 'cash', 'amount' => 50000]);

        // Filter by date
        $dateResponse = $this->withHeaders($this->authHeaders())
            ->getJson('/api/v1/orders?date_from=2026-10-15&date_to=2026-10-25');
        $dateResponse->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $order2->id);

        // Search by cashier_note
        $searchResponse = $this->withHeaders($this->authHeaders())
            ->getJson('/api/v1/orders?search=VIP');
        $searchResponse->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $order1->id);
    }

    /**
     * Test 8b: Pagination and JSON response structure with mixed cash and split orders
     */
    public function test_pagination_and_json_response_structure_remain_intact(): void
    {
        // 10 cash completed
        for ($i = 1; $i <= 10; $i++) {
            $this->createOrder(['payment_method' => 'cash', 'status' => 'completed']);
        }
        // 5 split completed with cash
        for ($i = 1; $i <= 5; $i++) {
            $split = $this->createOrder(['payment_method' => 'split', 'status' => 'completed']);
            OrderPayment::create(['order_id' => $split->id, 'payment_method' => 'cash', 'amount' => 50000]);
        }
        // 5 split completed WITHOUT cash (must be excluded)
        for ($i = 1; $i <= 5; $i++) {
            $splitNoCash = $this->createOrder(['payment_method' => 'split', 'status' => 'completed']);
            OrderPayment::create(['order_id' => $splitNoCash->id, 'payment_method' => 'bank', 'amount' => 50000]);
        }
        // 5 pending cash (must be excluded)
        for ($i = 1; $i <= 5; $i++) {
            $this->createOrder(['payment_method' => 'cash', 'status' => 'pending']);
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
                        'cash_amount',
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
        // Total should be 10 cash + 5 split with cash = 15
        $this->assertEquals(15, $response->json('meta.total'));
        $this->assertEquals(2, $response->json('meta.current_page'));
        $this->assertEquals(5, $response->json('meta.per_page'));
        $this->assertEquals(3, $response->json('meta.last_page'));
    }

    /**
     * Test 9: Không làm thay đổi kết quả của các endpoint order detail và order items
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

        OrderPayment::create([
            'order_id' => $order->id,
            'payment_method' => 'cash',
            'amount' => 100000,
        ]);

        // Show endpoint
        $showResponse = $this->withHeaders($this->authHeaders())
            ->getJson("/api/v1/orders/{$order->id}");
        $showResponse->assertStatus(200)
            ->assertJsonPath('data.id', $order->id)
            ->assertJsonPath('data.status', 'completed')
            ->assertJsonPath('data.cash_amount', 100000);

        // Items endpoint
        $itemsResponse = $this->withHeaders($this->authHeaders())
            ->getJson("/api/v1/orders/{$order->id}/items");
        $itemsResponse->assertStatus(200)
            ->assertJsonCount(2, 'data');

        // Delete item endpoint
        $deleteResponse = $this->withHeaders($this->authHeaders())
            ->deleteJson("/api/v1/orders/{$order->id}/items", [
                'item_ids' => [$item1->id],
            ]);
        $deleteResponse->assertStatus(200)
            ->assertJsonPath('order_summary.total_price', 50000);
    }

    /**
     * Test 10: Nếu WordPress tự cộng tổng từ response: tổng tiền mặt cuối cùng chính xác,
     * không cộng toàn bộ giá trị order split.
     */
    public function test_cash_revenue_sum_from_api_response_does_not_overcount_split_orders(): void
    {
        // Order 1: Cash 200,000 -> cash_amount = 200,000
        $order1 = $this->createOrder([
            'payment_method' => 'cash',
            'status' => 'completed',
            'total_price' => 200000,
        ]);
        OrderPayment::create([
            'order_id' => $order1->id,
            'payment_method' => 'cash',
            'amount' => 200000,
        ]);

        // Order 2: Split 300,000 (100,000 Cash + 200,000 Bank) -> cash_amount = 100,000
        $order2 = $this->createOrder([
            'payment_method' => 'split',
            'status' => 'completed',
            'total_price' => 300000,
        ]);
        OrderPayment::create([
            'order_id' => $order2->id,
            'payment_method' => 'cash',
            'amount' => 100000,
        ]);
        OrderPayment::create([
            'order_id' => $order2->id,
            'payment_method' => 'bank',
            'amount' => 200000,
        ]);

        $response = $this->withHeaders($this->authHeaders())
            ->getJson('/api/v1/orders');

        $response->assertStatus(200);

        $orders = $response->json('data');

        // Sum using total_price would be 200,000 + 300,000 = 500,000 (WRONG / OVERCOUNTED)
        $naiveTotal = array_sum(array_column($orders, 'total_price'));
        $this->assertEquals(500000, $naiveTotal);

        // Sum using cash_amount must be 200,000 + 100,000 = 300,000 (ACCURATE CASH REVENUE)
        $actualCashTotal = array_sum(array_column($orders, 'cash_amount'));
        $this->assertEquals(300000, $actualCashTotal);
        $this->assertNotEquals($naiveTotal, $actualCashTotal);
    }

    /**
     * Test 11: Kiểm thử chi tiết toàn bộ các trường hợp tính cash_amount theo yêu cầu:
     * - Cash có payment cash hợp lệ.
     * - Cash không có payment records: fallback total_price.
     * - Cash có payment records nhưng không có payment cash: cash_amount = 0 (không fallback).
     * - Cash có payment records nhưng tổng cash = 0: cash_amount = 0 (không fallback).
     * - Split có nhiều khoản cash: cộng đúng (bao gồm kiểm tra khoảng trắng/hoa thường).
     * - Split không có khoản cash: cash_amount = 0.
     * - Giá trị payment âm hoặc không hợp lệ: kết quả không âm.
     * - Fallback total_price âm: kết quả không âm.
     * - Non-cash không có payment records: cash_amount = 0.
     */
    public function test_get_cash_amount_handles_all_payment_scenarios_and_edge_cases(): void
    {
        // 1. Cash có payment cash hợp lệ
        $order1 = $this->createOrder(['payment_method' => 'cash', 'total_price' => 100000]);
        OrderPayment::create(['order_id' => $order1->id, 'payment_method' => 'cash', 'amount' => 100000]);
        $res1 = (new OrderResource($order1->load('payments')))->resolve();
        $this->assertSame(100000, $res1['cash_amount']);

        // 2. Cash không có payment records: fallback sang total_price
        $order2 = $this->createOrder(['payment_method' => 'cash', 'total_price' => 150000]);
        $res2 = (new OrderResource($order2->load('payments')))->resolve();
        $this->assertSame(150000, $res2['cash_amount']);

        // 3. Cash có payment records nhưng không có payment cash (ví dụ chỉ có bank) -> cash_amount = 0 (KHÔNG fallback)
        $order3 = $this->createOrder(['payment_method' => 'cash', 'total_price' => 200000]);
        OrderPayment::create(['order_id' => $order3->id, 'payment_method' => 'bank', 'amount' => 200000]);
        $res3 = (new OrderResource($order3->load('payments')))->resolve();
        $this->assertSame(0, $res3['cash_amount']);

        // 4. Cash có payment records nhưng tổng tiền cash bằng 0 -> cash_amount = 0 (KHÔNG fallback)
        $order4 = $this->createOrder(['payment_method' => 'cash', 'total_price' => 250000]);
        OrderPayment::create(['order_id' => $order4->id, 'payment_method' => 'cash', 'amount' => 0]);
        $res4 = (new OrderResource($order4->load('payments')))->resolve();
        $this->assertSame(0, $res4['cash_amount']);

        // 5. Split có nhiều khoản cash: cộng đúng (bao gồm xử lý hoa/thường và khoảng trắng)
        $order5 = $this->createOrder(['payment_method' => 'split', 'total_price' => 120000]);
        OrderPayment::create(['order_id' => $order5->id, 'payment_method' => 'cash', 'amount' => 40000]);
        OrderPayment::create(['order_id' => $order5->id, 'payment_method' => '  CASH  ', 'amount' => 30000]);
        OrderPayment::create(['order_id' => $order5->id, 'payment_method' => 'bank', 'amount' => 50000]);
        $res5 = (new OrderResource($order5->load('payments')))->resolve();
        $this->assertSame(70000, $res5['cash_amount']);

        // 6. Split không có khoản cash -> cash_amount = 0
        $order6 = $this->createOrder(['payment_method' => 'split', 'total_price' => 100000]);
        OrderPayment::create(['order_id' => $order6->id, 'payment_method' => 'bank', 'amount' => 60000]);
        OrderPayment::create(['order_id' => $order6->id, 'payment_method' => 'card', 'amount' => 40000]);
        $res6 = (new OrderResource($order6->load('payments')))->resolve();
        $this->assertSame(0, $res6['cash_amount']);

        // 7. Giá trị payment âm: đảm bảo kết quả không âm (max(0, $cashSum))
        $order7 = $this->createOrder(['payment_method' => 'cash', 'total_price' => 80000]);
        OrderPayment::create(['order_id' => $order7->id, 'payment_method' => 'cash', 'amount' => -20000]);
        $res7 = (new OrderResource($order7->load('payments')))->resolve();
        $this->assertSame(0, $res7['cash_amount']);

        // 8. Split có thanh toán cash và khoản hoàn/điều chỉnh âm: cộng gộp đúng và không âm
        $order8 = $this->createOrder(['payment_method' => 'split', 'total_price' => 100000]);
        OrderPayment::create(['order_id' => $order8->id, 'payment_method' => 'cash', 'amount' => 80000]);
        OrderPayment::create(['order_id' => $order8->id, 'payment_method' => 'cash', 'amount' => -30000]);
        OrderPayment::create(['order_id' => $order8->id, 'payment_method' => 'bank', 'amount' => 50000]);
        $res8 = (new OrderResource($order8->load('payments')))->resolve();
        $this->assertSame(50000, $res8['cash_amount']);

        // 9. Order không có payment records và total_price âm: đảm bảo không âm
        $order9 = $this->createOrder(['payment_method' => 'cash', 'total_price' => -50000]);
        $res9 = (new OrderResource($order9->load('payments')))->resolve();
        $this->assertSame(0, $res9['cash_amount']);

        // 10. Order không phải cash và không có payment records: cash_amount = 0
        $order10 = $this->createOrder(['payment_method' => 'bank', 'total_price' => 100000]);
        $res10 = (new OrderResource($order10->load('payments')))->resolve();
        $this->assertSame(0, $res10['cash_amount']);

        // Xác minh qua API show endpoint GET /api/v1/orders/{order}
        $apiRes1 = $this->withHeaders($this->authHeaders())->getJson("/api/v1/orders/{$order1->id}");
        $apiRes1->assertStatus(200)->assertJsonPath('data.cash_amount', 100000);

        $apiRes2 = $this->withHeaders($this->authHeaders())->getJson("/api/v1/orders/{$order2->id}");
        $apiRes2->assertStatus(200)->assertJsonPath('data.cash_amount', 150000);

        $apiRes3 = $this->withHeaders($this->authHeaders())->getJson("/api/v1/orders/{$order3->id}");
        $apiRes3->assertStatus(200)->assertJsonPath('data.cash_amount', 0);

        $apiRes4 = $this->withHeaders($this->authHeaders())->getJson("/api/v1/orders/{$order4->id}");
        $apiRes4->assertStatus(200)->assertJsonPath('data.cash_amount', 0);

        $apiRes5 = $this->withHeaders($this->authHeaders())->getJson("/api/v1/orders/{$order5->id}");
        $apiRes5->assertStatus(200)->assertJsonPath('data.cash_amount', 70000);
    }
}
