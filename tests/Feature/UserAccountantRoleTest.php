<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserAccountantRoleTest extends TestCase
{
    use RefreshDatabase;

    private function makeAdmin(): User
    {
        return User::create([
            'name'     => 'Admin',
            'email'    => 'admin@example.com',
            'password' => bcrypt('password'),
            'role'     => 'admin',
        ]);
    }

    // ── Creation ────────────────────────────────────────────────────────────────

    public function test_accountant_user_can_be_created_and_persisted()
    {
        $accountant = User::create([
            'name'     => 'Kế Toán Viên',
            'email'    => 'accountant@example.com',
            'password' => bcrypt('password123'),
            'role'     => 'accountant',
        ]);

        $this->assertDatabaseHas('users', [
            'email' => 'accountant@example.com',
            'role'  => 'accountant',
        ]);
        $this->assertSame('accountant', $accountant->fresh()->role);
    }

    // ── Update ──────────────────────────────────────────────────────────────────

    public function test_admin_can_update_existing_user_to_accountant_role()
    {
        $admin = $this->makeAdmin();
        $staff = User::create([
            'name'     => 'Staff',
            'email'    => 'staff@example.com',
            'password' => bcrypt('password'),
            'role'     => 'order_staff',
        ]);

        $response = $this->putJson("/api/users/{$staff->id}/role", [
            'role' => 'accountant',
        ], ['X-User-Id' => $admin->id]);

        $response->assertStatus(200);
        $response->assertJsonPath('data.role', 'accountant');
        $this->assertDatabaseHas('users', ['id' => $staff->id, 'role' => 'accountant']);
    }

    // ── Role-change endpoint ─────────────────────────────────────────────────────

    public function test_admin_can_change_role_to_accountant_via_role_endpoint()
    {
        $admin = $this->makeAdmin();
        $staff = User::create([
            'name'     => 'Staff',
            'email'    => 'staff2@example.com',
            'password' => bcrypt('password'),
            'role'     => 'cashier',
        ]);

        $response = $this->putJson("/api/users/{$staff->id}/role", [
            'role' => 'accountant',
        ], ['X-User-Id' => $admin->id]);

        $response->assertStatus(200);
        $response->assertJsonPath('data.role', 'accountant');
        $this->assertDatabaseHas('users', ['id' => $staff->id, 'role' => 'accountant']);
    }

    // ── Validation guard ─────────────────────────────────────────────────────────

    public function test_unknown_role_is_rejected_on_create()
    {
        $admin = $this->makeAdmin();

        $response = $this->postJson('/api/users', [
            'name'          => 'Bad Role',
            'email'         => 'badrole@example.com',
            'password'      => 'password123',
            'role'          => 'superuser',   // not a valid role
            'join_date'     => '2024-01-01',
            'date_of_birth' => '1990-05-15',
            'work_shift'    => 'Ca sáng',
            'salary'        => 10000000,
            'bonus'         => 0,
        ], ['X-User-Id' => $admin->id]);

        $response->assertStatus(422);
    }

    // ── Permission helper ────────────────────────────────────────────────────────

    public function test_accountant_user_can_export_orders()
    {
        $accountant = User::create([
            'name'     => 'Kế Toán',
            'email'    => 'kt@example.com',
            'password' => bcrypt('password'),
            'role'     => 'accountant',
        ]);

        $this->assertTrue($accountant->canExportOrders());
    }

    public function test_non_privileged_roles_cannot_export_orders()
    {
        foreach (['manager', 'order_staff', 'kitchen', 'bar', 'cashier', 'bill', 'seller'] as $role) {
            $user = User::create([
                'name'     => "User $role",
                'email'    => "$role@example.com",
                'password' => bcrypt('password'),
                'role'     => $role,
            ]);
            $this->assertFalse($user->canExportOrders(), "Role '$role' should not be able to export orders");
        }
    }
}
