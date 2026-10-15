<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Order;
use App\Models\Table;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PaymentEditHistoryAuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
    }

    public function test_cashier_can_edit_own_payment_anytime()
    {
        $cashier = User::create([
            'name' => 'Cashier A',
            'email' => 'cashier_a@example.com',
            'password' => bcrypt('password'),
            'role' => 'cashier'
        ]);

        $table = Table::create(['name' => 'Table A', 'status' => 'empty']);

        $order = Order::create([
            'table_id' => $table->id,
            'cashier_id' => $cashier->id,
            'status' => 'completed',
            'total_price' => 50000,
            'completed_at' => now()->subHours(50), // Over 24 hours ago
        ]);

        $response = $this->actingAs($cashier, 'sanctum')->patchJson("/api/orders/{$order->id}/payment", [
            'payment_method' => 'card',
            'cashier_note' => 'Updated by own cashier after 50h',
        ]);

        $response->assertStatus(200);
        $order->refresh();
        $this->assertEquals('card', $order->payment_method);
        $this->assertEquals('Updated by own cashier after 50h', $order->cashier_note);
    }

    public function test_cashier_cannot_edit_other_cashier_payment()
    {
        $cashierA = User::create([
            'name' => 'Cashier A',
            'email' => 'cashier_a@example.com',
            'password' => bcrypt('password'),
            'role' => 'cashier'
        ]);

        $cashierB = User::create([
            'name' => 'Cashier B',
            'email' => 'cashier_b@example.com',
            'password' => bcrypt('password'),
            'role' => 'cashier'
        ]);

        $table = Table::create(['name' => 'Table A', 'status' => 'empty']);

        $order = Order::create([
            'table_id' => $table->id,
            'cashier_id' => $cashierA->id,
            'status' => 'completed',
            'total_price' => 50000,
            'completed_at' => now()->subHours(12),
        ]);

        $response = $this->actingAs($cashierB, 'sanctum')->patchJson("/api/orders/{$order->id}/payment", [
            'payment_method' => 'card',
        ]);

        $response->assertStatus(403);
        $response->assertJsonFragment([
            'message' => 'You can only edit payment records for bills originally paid by you.'
        ]);
    }

    public function test_admin_and_accountant_can_edit_any_payment_at_any_time()
    {
        $cashier = User::create([
            'name' => 'Cashier A',
            'email' => 'cashier_a@example.com',
            'password' => bcrypt('password'),
            'role' => 'cashier'
        ]);

        $admin = User::create([
            'name' => 'Admin',
            'email' => 'admin@example.com',
            'password' => bcrypt('password'),
            'role' => 'admin'
        ]);

        $accountant = User::create([
            'name' => 'Accountant',
            'email' => 'accountant@example.com',
            'password' => bcrypt('password'),
            'role' => 'accountant'
        ]);

        $table = Table::create(['name' => 'Table A', 'status' => 'empty']);

        $order = Order::create([
            'table_id' => $table->id,
            'cashier_id' => $cashier->id,
            'status' => 'completed',
            'total_price' => 50000,
            'completed_at' => now()->subHours(50), // long time ago
        ]);

        // Admin can edit
        $responseAdmin = $this->actingAs($admin, 'sanctum')->patchJson("/api/orders/{$order->id}/payment", [
            'payment_method' => 'bank',
            'cashier_note' => 'Admin override',
        ]);
        $responseAdmin->assertStatus(200);

        // Accountant can edit
        $responseAccountant = $this->actingAs($accountant, 'sanctum')->patchJson("/api/orders/{$order->id}/payment", [
            'payment_method' => 'cash',
            'cashier_note' => 'Accountant override',
        ]);
        $responseAccountant->assertStatus(200);
    }
}
