<?php

namespace App\Services;

use App\Models\Reservation;
use Illuminate\Support\Facades\DB;

class ReservationService
{
    /**
     * [WHY] Creates a new reservation and attaches pre-ordered dishes.
     * [RULE] Uses DB transaction to ensure data integrity between reservation and items.
     */
    public function createReservation(array $data)
    {
        return DB::transaction(function () use ($data) {
            $dishes = $data['dishes'] ?? [];
            unset($data['dishes']);

            $reservation = Reservation::create($data);

            if (!empty($dishes)) {
                $reservation->items()->createMany($dishes);
            }

            // [WHY] Reload items to match frontend expectations
            $reservation->load('items');
            $reservation->dishes = $reservation->items;

            return $reservation;
        });
    }

    /**
     * [WHY] Updates an existing reservation. Overwrites dishes if provided in the payload.
     * [RULE] Deletes old items completely and rebuilds them if 'dishes' key is present to prevent stale data.
     */
    public function updateReservation($id, array $data, $hasDishesKey)
    {
        return DB::transaction(function () use ($id, $data, $hasDishesKey) {
            $reservation = Reservation::findOrFail($id);

            $dishes = $data['dishes'] ?? [];
            unset($data['dishes']);

            $reservation->update($data);

            if ($hasDishesKey) {
                $reservation->items()->delete();
                if (!empty($dishes)) {
                    $reservation->items()->createMany($dishes);
                }
            }

            // [WHY] Reload items to match frontend expectations
            $reservation->load('items');
            $reservation->dishes = $reservation->items;

            return $reservation;
        });
    }
}
