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
            $tableIds = $data['table_ids'] ?? [];
            unset($data['dishes']);

            $data['updated_by'] = $data['updated_by'] ?? auth()->id();
            $reservation = Reservation::create($data);

            if (!empty($dishes)) {
                $reservation->items()->createMany($dishes);
            }

            // [WHY] Orchestrate group confirmation ONLY if tables are assigned AND it is for TODAY
            // We use a robust comparison to handle cases where the date might still be a string after create
            $resDate = $reservation->reservation_date;
            $isToday = $resDate && (\Illuminate\Support\Carbon::parse($resDate)->isToday());

            if ($reservation->type === 'group' && !empty($tableIds) && $isToday) {
                $confirmService = app(\App\Services\ReservationConfirmService::class);
                $confirmService->confirmGroupReservation($reservation, $tableIds, $data['staff_id'] ?? null);
            }

            // [WHY] Reload items and audit info to ensure they are available in the response
            $reservation->load(['items', 'table', 'updater:id,name']);

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
            $tableIds = $data['table_ids'] ?? [];
            unset($data['dishes']);

            $data['updated_by'] = $data['updated_by'] ?? auth()->id();
            $reservation->update($data);

            if ($hasDishesKey) {
                $reservation->items()->delete();
                if (!empty($dishes)) {
                    $reservation->items()->createMany($dishes);
                }
            }

            // [WHY] Reload to ensure all attributes are correctly cast and up to date after the update
            $reservation->refresh();

            // [WHY] Orchestrate group confirmation ONLY if tables are assigned AND it is for TODAY
            $resDate = $reservation->reservation_date;
            $isToday = $resDate && (\Illuminate\Support\Carbon::parse($resDate)->isToday());

            if ($reservation->type === 'group' && !empty($tableIds) && $isToday) {
                // Ensure dishes is cleared before confirmGroupReservation to avoid transient data conflicts
                $reservation->unsetRelation('items');
                $confirmService = app(\App\Services\ReservationConfirmService::class);
                $confirmService->confirmGroupReservation($reservation, $tableIds, $data['staff_id'] ?? null);
            }

            // [WHY] Reload items and audit info to ensure they are available in the response
            $reservation->load(['items', 'table', 'updater:id,name']);

            return $reservation;
        });
    }
}
