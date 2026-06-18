<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderExportAuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
    }

    public function test_guest_cannot_access_order_export_endpoints()
    {
        $response1 = $this->getJson('/api/order-export');
        $response1->assertStatus(403);

        $response2 = $this->getJson('/api/order-export/export');
        $response2->assertStatus(403);

        $response3 = $this->getJson('/api/order-export/cashiers');
        $response3->assertStatus(403);
    }

    public function test_non_privileged_roles_cannot_access_order_export_endpoints()
    {
        $roles = ['order_staff', 'kitchen', 'bar', 'bill', 'seller', 'manager'];

        foreach ($roles as $role) {
            $user = User::create([
                'name' => 'Test User ' . $role,
                'email' => $role . '@example.com',
                'password' => bcrypt('password'),
                'role' => $role
            ]);

            $response1 = $this->getJson('/api/order-export', [
                'X-User-Id' => $user->id
            ]);
            $response1->assertStatus(403);

            $response2 = $this->getJson('/api/order-export/export', [
                'X-User-Id' => $user->id
            ]);
            $response2->assertStatus(403);

            $response3 = $this->getJson('/api/order-export/cashiers', [
                'X-User-Id' => $user->id
            ]);
            $response3->assertStatus(403);
        }
    }

    public function test_admin_accountant_and_cashier_can_access_order_export_endpoints()
    {
        $privilegedRoles = ['admin', 'accountant', 'cashier'];

        foreach ($privilegedRoles as $role) {
            $user = User::create([
                'name' => 'Privileged User ' . $role,
                'email' => $role . '@example.com',
                'password' => bcrypt('password'),
                'role' => $role
            ]);

            $response1 = $this->getJson('/api/order-export', [
                'X-User-Id' => $user->id
            ]);
            $response1->assertStatus(200);

            $response2 = $this->getJson('/api/order-export/export', [
                'X-User-Id' => $user->id
            ]);
            $response2->assertStatus(200);

            $response3 = $this->getJson('/api/order-export/cashiers', [
                'X-User-Id' => $user->id
            ]);
            $response3->assertStatus(200);
        }
    }

    public function test_export_eager_loads_relations_without_n_plus_one_queries()
    {
        \Illuminate\Support\Facades\DB::enableQueryLog();

        $admin = User::create([
            'name' => 'Admin',
            'email' => 'admin@example.com',
            'password' => bcrypt('password'),
            'role' => 'admin'
        ]);

        $cashier = User::create([
            'name' => 'Cashier',
            'email' => 'cashier@example.com',
            'password' => bcrypt('password'),
            'role' => 'cashier'
        ]);

        $table = \App\Models\Table::create(['name' => 'Table 1', 'status' => 'empty']);

        $category = \App\Models\Category::create([
            'name' => 'Cat',
            'type' => 'drink'
        ]);

        $product = \App\Models\Product::create([
            'name' => 'Product 1',
            'price' => 10000,
            'type' => 'drink',
            'category_id' => $category->id
        ]);


        // Create 5 completed orders
        for ($i = 0; $i < 5; $i++) {
            $order = \App\Models\Order::create([
                'table_id' => $table->id,
                'cashier_id' => $cashier->id,
                'status' => 'completed',
                'total_price' => 20000
            ]);

            // Add items
            \App\Models\OrderItem::create([
                'order_id' => $order->id,
                'product_id' => $product->id,
                'quantity' => 2,
                'price' => 10000,
                'name' => 'Product 1'
            ]);
        }

        // Run the export request
        \Illuminate\Support\Facades\DB::flushQueryLog();
        $response = $this->getJson('/api/order-export/export', [
            'X-User-Id' => $admin->id
        ]);
        $response->assertStatus(200);

        
        ob_start();
        $response->sendContent();
        $content = ob_get_clean();

        $queries = \Illuminate\Support\Facades\DB::getQueryLog();
        // Print queries or assert
        $this->assertLessThanOrEqual(8, count($queries), "Too many queries executed (potential N+1 issue)");
    }
}





