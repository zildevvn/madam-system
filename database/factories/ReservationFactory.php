<?php

namespace Database\Factories;

use App\Models\Reservation;
use App\Models\Table;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Reservation>
 */
class ReservationFactory extends Factory
{
    protected $model = Reservation::class;

    public function definition(): array
    {
        return [
            'type' => 'dine_in',
            'lead_name' => fake()->name(),
            'phone' => fake()->phoneNumber(),
            'number_of_guests' => 2,
            'email' => fake()->unique()->safeEmail(),
            'nationality' => 'Vietnamese',
            'tour_guide_name' => null,
            'company_name' => null,
            'partner_company_id' => null,
            'set_menu' => null,
            'table_id' => Table::factory(),
            'table_ids' => [],
            'reservation_date' => now()->toDateString(),
            'reservation_time' => now()->format('H:i:s'),
            'note' => null,
            'status' => Reservation::STATUS_PENDING,
            'updated_by' => null,
            'staff_id' => null,
            'apply_vat' => false,
            'vat_percentage' => 0,
        ];
    }
}
?>
