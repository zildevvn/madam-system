<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\SystemSetting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AttendanceToggleTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Seed default setting since RefreshDatabase clears seeded data
        SystemSetting::updateOrCreate(
            ['key' => 'attendance_enabled'],
            ['value' => 'false']
        );
    }

    public function test_get_settings_returns_default_false()
    {
        $response = $this->getJson('/api/system-settings');

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'attendance_enabled' => 'false'
                ]
            ]);
    }

    public function test_non_admin_cannot_update_settings()
    {
        $user = User::create([
            'name' => 'Staff member',
            'email' => 'staff@example.com',
            'password' => bcrypt('password'),
            'role' => 'order_staff'
        ]);

        $response = $this->putJson('/api/system-settings', [
            'attendance_enabled' => 'true'
        ], [
            'X-User-Id' => $user->id
        ]);

        $response->assertStatus(403);
    }

    public function test_admin_can_update_settings()
    {
        $admin = User::create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'password' => bcrypt('password'),
            'role' => 'admin'
        ]);

        $response = $this->putJson('/api/system-settings', [
            'attendance_enabled' => 'true'
        ], [
            'X-User-Id' => $admin->id
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'attendance_enabled' => 'true'
                ]
            ]);

        $this->assertEquals('true', SystemSetting::getVal('attendance_enabled'));
    }

    public function test_attendance_status_behavior_based_on_toggle()
    {
        $user = User::create([
            'name' => 'Staff member',
            'email' => 'staff@example.com',
            'password' => bcrypt('password'),
            'role' => 'order_staff'
        ]);

        // When toggle is OFF: todayStatus should return 'working'
        SystemSetting::setVal('attendance_enabled', 'false');
        $response = $this->getJson('/api/attendances/today-status', [
            'X-User-Id' => $user->id
        ]);
        $response->assertStatus(200)
            ->assertJson([
                'status' => 'working'
            ]);

        // When toggle is ON: todayStatus should return 'not_checked_in'
        SystemSetting::setVal('attendance_enabled', 'true');
        $response = $this->getJson('/api/attendances/today-status', [
            'X-User-Id' => $user->id
        ]);
        $response->assertStatus(200)
            ->assertJson([
                'status' => 'not_checked_in'
            ]);
    }
}
