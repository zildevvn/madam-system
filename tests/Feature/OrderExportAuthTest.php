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
        $roles = ['order_staff', 'kitchen', 'bar', 'cashier', 'bill', 'seller', 'manager'];

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

    public function test_admin_and_accountant_can_access_order_export_endpoints()
    {
        $privilegedRoles = ['admin', 'accountant'];

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
}
