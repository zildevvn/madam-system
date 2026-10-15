<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\UserService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Tests\TestCase;

class SanctumAuthenticationTest extends TestCase
{
    use RefreshDatabase;

    private function createAdmin(): User
    {
        return User::create([
            'name'     => 'Admin User',
            'email'    => 'admin_test@example.com',
            'password' => bcrypt('password123'),
            'role'     => 'admin',
        ]);
    }

    private function createStaff(): User
    {
        return User::create([
            'name'     => 'Staff User',
            'email'    => 'staff_test@example.com',
            'password' => bcrypt('password123'),
            'role'     => 'order_staff',
        ]);
    }

    // 1. Valid Sanctum token can access protected endpoints
    public function test_valid_sanctum_token_can_access_protected_endpoints()
    {
        $admin = $this->createAdmin();
        $token = $admin->createToken('test')->plainTextToken;

        $endpoints = [
            '/api/users',
            '/api/leave-requests',
            '/api/attendances',
        ];

        foreach ($endpoints as $endpoint) {
            $response = $this->withHeader('Authorization', 'Bearer ' . $token)
                             ->getJson($endpoint);
            $response->assertStatus(200);
        }
    }

    // 2. Missing token is rejected by protected endpoints
    public function test_missing_token_is_rejected_by_protected_endpoints()
    {
        $endpoints = [
            '/api/users',
            '/api/leave-requests',
            '/api/attendances',
        ];

        foreach ($endpoints as $endpoint) {
            $response = $this->getJson($endpoint);
            $response->assertStatus(401);
        }
    }

    // 3. Invalid or revoked token is rejected
    public function test_invalid_or_revoked_token_is_rejected()
    {
        $response = $this->withHeader('Authorization', 'Bearer invalid-token-string-12345')
                         ->getJson('/api/users');
        $response->assertStatus(401);
    }

    // 4. Valid session cookie plus invalid Bearer Token does not authenticate
    public function test_session_cookie_plus_invalid_bearer_token_does_not_authenticate()
    {
        $admin = $this->createAdmin();

        $response = $this->actingAs($admin, 'web')
                         ->withHeader('Authorization', 'Bearer invalid-token-xyz')
                         ->getJson('/api/users');

        $response->assertStatus(401);
    }

    // 5. X-User-Id without valid Bearer Token cannot authenticate
    public function test_x_user_id_without_valid_bearer_token_cannot_authenticate()
    {
        $admin = $this->createAdmin();

        $response = $this->withHeader('X-User-Id', (string) $admin->id)
                         ->getJson('/api/users');

        $response->assertStatus(401);
    }

    // 6. Mismatched X-User-Id cannot change the authenticated identity
    public function test_mismatched_x_user_id_does_not_change_authenticated_identity()
    {
        $admin = $this->createAdmin();
        $staff = $this->createStaff();

        $staffToken = $staff->createToken('staff')->plainTextToken;

        // Staff token with Admin's X-User-Id header — identity remains Staff (non-admin)
        $response = $this->withHeader('Authorization', 'Bearer ' . $staffToken)
                         ->withHeader('X-User-Id', (string) $admin->id)
                         ->getJson('/api/users');

        // Non-admin staff cannot list users with full details / update roles
        // UserController@index returns 200 only if admin, or stripped/forbidden
        // Testing role update: staff cannot update roles even if X-User-Id is admin
        $updateRoleResponse = $this->withHeader('Authorization', 'Bearer ' . $staffToken)
                                   ->withHeader('X-User-Id', (string) $admin->id)
                                   ->putJson("/api/users/{$staff->id}/role", [
                                       'role' => 'admin'
                                   ]);

        $updateRoleResponse->assertStatus(403);
    }

    // 7. Logout revokes the current token
    public function test_logout_revokes_current_token()
    {
        $admin = $this->createAdmin();
        $token = $admin->createToken('auth_token')->plainTextToken;

        $this->assertDatabaseCount('personal_access_tokens', 1);

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
                         ->postJson('/api/logout');

        $response->assertStatus(200);
        $response->assertJson(['message' => 'Logged out successfully']);
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    // 8. Revoked token fails on the next protected request
    public function test_revoked_token_fails_on_next_protected_request()
    {
        $admin = $this->createAdmin();
        $token = $admin->createToken('auth_token')->plainTextToken;

        $logoutResponse = $this->withHeader('Authorization', 'Bearer ' . $token)
                               ->postJson('/api/logout');
        $logoutResponse->assertStatus(200);

        $nextResponse = $this->withHeader('Authorization', 'Bearer ' . $token)
                             ->getJson('/api/users');
        $nextResponse->assertStatus(401);
    }

    // 9. User without export permission receives 403
    public function test_user_without_export_permission_receives_403()
    {
        $staff = $this->createStaff();
        $token = $staff->createToken('staff')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
                         ->getJson('/api/order-export');

        $response->assertStatus(403);
        $response->assertJson(['message' => 'Forbidden']);
    }

    // 10. User with export permission can access order export
    public function test_user_with_export_permission_can_access_order_export()
    {
        $roles = ['admin', 'accountant', 'cashier'];

        foreach ($roles as $role) {
            $user = User::create([
                'name'     => 'Export User ' . $role,
                'email'    => "export_{$role}@example.com",
                'password' => bcrypt('password123'),
                'role'     => $role,
            ]);

            $token = $user->createToken('export_token')->plainTextToken;

            $response = $this->withHeader('Authorization', 'Bearer ' . $token)
                             ->getJson('/api/order-export');

            $response->assertStatus(200);
        }
    }

    // 11. Public endpoints remain accessible without authentication
    public function test_public_endpoints_remain_accessible_without_authentication()
    {
        $publicEndpoints = [
            '/api/tables',
            '/api/products',
            '/api/categories',
        ];

        foreach ($publicEndpoints as $endpoint) {
            $response = $this->getJson($endpoint);
            $response->assertStatus(200);
        }
    }

    // 12. WordPress External API key handling
    public function test_wordpress_external_api_accepts_valid_key_and_rejects_invalid_key_or_sanctum_token()
    {
        $mockKey = 'wp-secure-api-key-test-12345';
        Config::set('services.external_api.key', $mockKey);

        // Valid external API key
        $validResponse = $this->withHeader('Authorization', 'Bearer ' . $mockKey)
                              ->getJson('/api/v1/orders');
        $validResponse->assertStatus(200);

        // Invalid external key
        $invalidResponse = $this->withHeader('Authorization', 'Bearer invalid-external-key')
                                ->getJson('/api/v1/orders');
        $invalidResponse->assertStatus(401);

        // User Sanctum token is NOT valid for external WordPress API
        $admin = $this->createAdmin();
        $sanctumToken = $admin->createToken('sanctum_user')->plainTextToken;

        $userTokenResponse = $this->withHeader('Authorization', 'Bearer ' . $sanctumToken)
                                  ->getJson('/api/v1/orders');
        $userTokenResponse->assertStatus(401);
    }

    // 13. Admin role authorization remains correct
    public function test_admin_role_authorization_remains_correct()
    {
        $admin = $this->createAdmin();
        $targetStaff = $this->createStaff();
        $nonAdmin = User::create([
            'name'     => 'Non Admin User',
            'email'    => 'nonadmin_staff@example.com',
            'password' => bcrypt('password123'),
            'role'     => 'order_staff',
        ]);

        $adminToken = $admin->createToken('admin')->plainTextToken;
        $nonAdminToken = $nonAdmin->createToken('nonadmin')->plainTextToken;

        // Admin can update roles
        $adminResponse = $this->withHeader('Authorization', 'Bearer ' . $adminToken)
                              ->putJson("/api/users/{$targetStaff->id}/role", [
                                  'role' => 'accountant'
                              ]);
        $adminResponse->assertStatus(200);
        $this->assertSame('accountant', $targetStaff->fresh()->role);

        // Non-admin order_staff cannot update roles
        $staffResponse = $this->withHeader('Authorization', 'Bearer ' . $nonAdminToken)
                              ->putJson("/api/users/{$admin->id}/role", [
                                  'role' => 'order_staff'
                              ]);
        $staffResponse->assertStatus(403);
    }

    // 14. Forced logout revokes all tokens on password change
    public function test_forced_logout_revokes_all_tokens_on_password_change()
    {
        $staff = $this->createStaff();
        $token1 = $staff->createToken('device_1')->plainTextToken;
        $token2 = $staff->createToken('device_2')->plainTextToken;

        $this->assertDatabaseCount('personal_access_tokens', 2);

        // Admin updates staff password
        $userService = app(UserService::class);
        $userService->updateUser($staff->id, [
            'password' => 'new_secure_password123'
        ]);

        // Tokens should be deleted from DB
        $this->assertDatabaseCount('personal_access_tokens', 0);

        // Both previous devices are now forced logged out
        $response1 = $this->withHeader('Authorization', 'Bearer ' . $token1)
                          ->getJson('/api/attendances');
        $response1->assertStatus(401);

        $response2 = $this->withHeader('Authorization', 'Bearer ' . $token2)
                          ->getJson('/api/attendances');
        $response2->assertStatus(401);
    }
}
