<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Table;
use App\Models\User;
use App\Services\OrderPaymentService;
use App\Services\StatsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SplitPaymentTest extends TestCase
{
    use RefreshDatabase;

    private OrderPaymentService $paymentService;
    private StatsService $statsService;
    private User $cashier;
    private Table $table1;
    private Table $table2;

    protected function setUp(): void
    {
        parent::setUp();
        $this->paymentService = app(OrderPaymentService::class);
        $this->statsService = app(StatsService::class);
        $this->cashier = User::create([
            'name' => 'Test Cashier',
            'role' => 'cashier',
            'username' => 'cashier_test',
            'password' => bcrypt('password'),
        ]);

        $this->table1 = Table::create(['name' => 'Bàn 1', 'status' => 'busy']);
        $this->table2 = Table::create(['name' => 'Bàn 2', 'status' => 'busy']);
    }

    public function test_single_payment_creates_one_payment_record()
    {
        $order = Order::create([
            'table_id' => $this->table1->id,
            'status' => 'pending',
            'total_price' => 500000,
        ]);

        $this->paymentService->completeOrder($order->id, [
            'payment_method' => 'cash',
            'cashier_id' => $this->cashier->id,
        ]);

        $order->refresh();
        $this->assertEquals('completed', $order->status);
        $this->assertEquals('cash', $order->payment_method);
        $this->assertCount(1, $order->payments);
        $this->assertEquals('cash', $order->payments[0]->payment_method);
        $this->assertEquals(500000, $order->payments[0]->amount);

        // Check StatsService
        $stats = $this->statsService->getRevenueReport('day');
        $this->assertEquals(500000, $stats['cash_revenue']);
        $this->assertEquals(0, $stats['bank_revenue']);
    }

    public function test_split_payment_creates_multiple_payment_records()
    {
        $order = Order::create([
            'table_id' => $this->table1->id,
            'status' => 'pending',
            'total_price' => 500000,
        ]);

        $this->paymentService->completeOrder($order->id, [
            'payment_method' => 'split',
            'cashier_id' => $this->cashier->id,
            'payments' => [
                ['payment_method' => 'cash', 'amount' => 200000],
                ['payment_method' => 'bank', 'amount' => 300000],
            ],
        ]);

        $order->refresh();
        $this->assertEquals('completed', $order->status);
        $this->assertEquals('split', $order->payment_method);
        $this->assertCount(2, $order->payments);

        $paymentsMap = $order->payments->pluck('amount', 'payment_method')->toArray();
        $this->assertEquals(200000, $paymentsMap['cash']);
        $this->assertEquals(300000, $paymentsMap['bank']);

        // Check StatsService
        $stats = $this->statsService->getRevenueReport('day');
        $this->assertEquals(200000, $stats['cash_revenue']);
        $this->assertEquals(300000, $stats['bank_revenue']);
        $this->assertEquals(0, $stats['card_revenue']);
    }

    public function test_proportional_distribution_on_merged_orders()
    {
        // Table 1 order (primary)
        $order1 = Order::create([
            'table_id' => $this->table1->id,
            'status' => 'pending',
            'total_price' => 300000,
            'merged_tables' => $this->table1->id . '-' . $this->table2->id,
        ]);

        // Table 2 order (related)
        $order2 = Order::create([
            'table_id' => $this->table2->id,
            'status' => 'pending',
            'total_price' => 200000,
            'merged_tables' => $this->table1->id . '-' . $this->table2->id,
        ]);

        $this->paymentService->completeOrder($order1->id, [
            'payment_method' => 'split',
            'cashier_id' => $this->cashier->id,
            'payments' => [
                ['payment_method' => 'cash', 'amount' => 100000],
                ['payment_method' => 'bank', 'amount' => 400000],
            ],
        ]);

        $order1->refresh();
        $order2->refresh();

        $this->assertEquals('completed', $order1->status);
        $this->assertEquals('completed', $order2->status);

        // Check Table 1 (owns 60% of price)
        $this->assertCount(2, $order1->payments);
        $p1 = $order1->payments->pluck('amount', 'payment_method')->toArray();
        $this->assertEquals(60000, $p1['cash']); // 100k * 0.6
        $this->assertEquals(240000, $p1['bank']); // 400k * 0.6

        // Check Table 2 (owns 40% of price)
        $this->assertCount(2, $order2->payments);
        $p2 = $order2->payments->pluck('amount', 'payment_method')->toArray();
        $this->assertEquals(40000, $p2['cash']); // 100k * 0.4
        $this->assertEquals(160000, $p2['bank']); // 400k * 0.4

        // Check StatsService
        $stats = $this->statsService->getRevenueReport('day');
        $this->assertEquals(100000, $stats['cash_revenue']);
        $this->assertEquals(400000, $stats['bank_revenue']);
    }

    public function test_reopening_order_deletes_payments()
    {
        $order = Order::create([
            'table_id' => $this->table1->id,
            'status' => 'pending',
            'total_price' => 500000,
        ]);

        $this->paymentService->completeOrder($order->id, [
            'payment_method' => 'split',
            'cashier_id' => $this->cashier->id,
            'payments' => [
                ['payment_method' => 'cash', 'amount' => 200000],
                ['payment_method' => 'bank', 'amount' => 300000],
            ],
        ]);

        $this->assertDatabaseHas('order_payments', ['order_id' => $order->id]);

        $this->paymentService->reopenOrder($order->id);

        $order->refresh();
        $this->assertEquals('pending', $order->status);
        $this->assertCount(0, $order->payments);
        $this->assertDatabaseMissing('order_payments', ['order_id' => $order->id]);
    }

    public function test_update_payment_with_split_payments()
    {
        $order = Order::create([
            'table_id' => $this->table1->id,
            'status' => 'completed',
            'subtotal' => 500000,
            'total_price' => 500000,
            'payment_method' => 'cash',
        ]);

        $order->payments()->create([
            'payment_method' => 'cash',
            'amount' => 500000,
        ]);

        $this->paymentService->updatePayment($order->id, [
            'payment_method' => 'split',
            'payments' => [
                ['payment_method' => 'cash', 'amount' => 200000],
                ['payment_method' => 'bank', 'amount' => 300000],
            ],
        ]);

        $order->refresh();
        $order->load('payments');
        $this->assertEquals('split', $order->payment_method);
        $this->assertCount(2, $order->payments);

        $paymentsMap = $order->payments->pluck('amount', 'payment_method')->toArray();
        $this->assertEquals(200000, $paymentsMap['cash']);
        $this->assertEquals(300000, $paymentsMap['bank']);
    }

    public function test_discount_distribution_exceeding_order_price()
    {
        $order = Order::create([
            'table_id' => $this->table1->id,
            'status' => 'pending',
            'total_price' => 50000,
        ]);

        // Requesting a fixed discount of 100k (exceeds order total of 50k)
        $this->paymentService->completeOrder($order->id, [
            'payment_method' => 'cash',
            'cashier_id' => $this->cashier->id,
            'discount_type' => 'fixed',
            'discount_value' => 100000,
        ]);

        $order->refresh();
        $this->assertEquals('completed', $order->status);
        $this->assertEquals(0, $order->total_price);
        $this->assertEquals(50000, $order->discount_amount);
        $this->assertCount(1, $order->payments);
        $this->assertEquals(0, $order->payments[0]->amount);
    }
}
