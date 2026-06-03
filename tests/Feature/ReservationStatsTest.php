<?php

namespace Tests\Feature;

use App\Models\Reservation;
use App\Models\User;
use App\Services\StatsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReservationStatsTest extends TestCase
{
    use RefreshDatabase;

    public function test_reservation_stats_calculates_individual_guests_correctly()
    {
        $currentMonth = '2026-06';
        $prevMonth = '2026-05';

        // 1. Current Month Reservations
        // - Individual: Confirmed, 5 guests (should be counted)
        Reservation::create([
            'type' => 'individual',
            'lead_name' => 'John Doe',
            'phone' => '1234567890',
            'number_of_guests' => 5,
            'reservation_date' => '2026-06-15',
            'reservation_time' => '12:00:00',
            'status' => Reservation::STATUS_CONFIRMED
        ]);

        // - Individual: Cancelled, 3 guests (should be excluded)
        Reservation::create([
            'type' => 'individual',
            'lead_name' => 'Jane Smith',
            'phone' => '0987654321',
            'number_of_guests' => 3,
            'reservation_date' => '2026-06-16',
            'reservation_time' => '13:00:00',
            'status' => Reservation::STATUS_CANCELLED
        ]);

        // - Group: Confirmed, 10 guests (should NOT be counted as individual)
        Reservation::create([
            'type' => 'group',
            'lead_name' => 'Group Lead',
            'phone' => '1112223333',
            'number_of_guests' => 10,
            'company_name' => 'Big Corp',
            'reservation_date' => '2026-06-17',
            'reservation_time' => '14:00:00',
            'status' => Reservation::STATUS_CONFIRMED
        ]);

        // 2. Previous Month Reservations
        // - Individual: Confirmed, 4 guests (should be counted as previous)
        Reservation::create([
            'type' => 'individual',
            'lead_name' => 'Prev Guest',
            'phone' => '4445556666',
            'number_of_guests' => 4,
            'reservation_date' => '2026-05-15',
            'reservation_time' => '12:00:00',
            'status' => Reservation::STATUS_CONFIRMED
        ]);

        // Resolve StatsService
        $statsService = app(StatsService::class);
        $result = $statsService->getReservationStats($currentMonth);

        // Assertions
        $this->assertArrayHasKey('group_summary', $result);
        $groupSummary = $result['group_summary'];
        $this->assertArrayHasKey('individual_guests', $groupSummary);

        $individualGuests = $groupSummary['individual_guests'];
        $this->assertEquals(5, $individualGuests['current'], 'Current month individual guests should be 5');
        $this->assertEquals(4, $individualGuests['previous'], 'Previous month individual guests should be 4');
        $this->assertEquals(1, $individualGuests['difference'], 'Difference should be 1');
        $this->assertEquals(25.0, $individualGuests['growth_percentage'], 'Growth percentage should be 25%');
    }
}
