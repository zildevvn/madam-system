<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $roles = ['admin', 'order_staff', 'kitchen', 'bar', 'cashier'];

        foreach ($roles as $role) {
            User::factory()->create([
                'name' => ucfirst(str_replace('_', ' ', $role)),
                'email' => $role . '@example.com',
                'role' => $role,
            ]);
        }
    }
}
