<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Reservation;

class ReservationController extends Controller
{
    protected $reservationService;

    public function __construct(\App\Services\ReservationService $reservationService)
    {
        $this->reservationService = $reservationService;
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        // [WHY] Allow filtering for table assignment workflow.
        $query = Reservation::with(['table:id,name', 'items']);

        if ($request->query('filter') === 'unassigned') {
            $query->whereNull('table_id')
                  ->where(function($q) {
                      $q->whereNull('table_ids')
                        ->orWhere('table_ids', '[]')
                        ->orWhere('table_ids', 'like', '[]');
                  });
        }

        $reservations = $query->orderBy('reservation_time', 'asc')
            ->get();

        return response()->json([
            'data' => $reservations,
            'message' => 'Success',
            'errors' => null
        ]);
    }

    public function store(Request $request)
    {
        // [WHY] Validation rules for reservation
        $validated = $request->validate([
            'type' => 'required|in:individual,group',
            'lead_name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'number_of_guests' => 'required|integer|min:1',
            'email' => 'nullable|string|max:255',
            'nationality' => 'nullable|string|max:100',
            'tour_guide_name' => 'nullable|string|max:255',
            'company_name' => 'nullable|string|max:255',
            'set_menu' => 'nullable|string|max:255',
            'dishes' => 'nullable|array',
            'dishes.*.name' => 'required_with:dishes|string|max:255',
            'dishes.*.type' => 'required_with:dishes|in:food,drink',
            'dishes.*.quantity' => 'required_with:dishes|integer|min:1',
            'dishes.*.price' => 'required_with:dishes|numeric|min:0',
            'table_id' => 'nullable|exists:tables,id',
            'table_ids' => 'nullable|array',
            'table_ids.*' => 'exists:tables,id',
            'reservation_date' => 'required|date',
            'reservation_time' => 'required|string',
            'note' => 'nullable|string',
            'staff_id' => 'nullable|exists:users,id'
        ]);

        try {
            // [WHY] Sanitize inputs to ensure data types match DB expectations
            if (isset($validated['staff_id']) && trim((string)$validated['staff_id']) === "") {
                $validated['staff_id'] = null;
            }

            if (isset($validated['table_id']) && trim((string)$validated['table_id']) === "") {
                $validated['table_id'] = null;
            }

            // [WHY] Ensure date is strictly YYYY-MM-DD
            if (!empty($validated['reservation_date'])) {
                $validated['reservation_date'] = explode('T', (string)$validated['reservation_date'])[0];
            }

            $reservation = $this->reservationService->createReservation($validated);

            // [WHY] Broadcast real-time event for dashboard synchronization
            broadcast(new \App\Events\ReservationUpdated($reservation, 'created'))->toOthers();

            // [WHY] If tables were assigned during creation for a group, trigger the confirmation flow
            // to create live orders immediately.
            if ($validated['type'] === 'group' && !empty($validated['table_ids'])) {
                $confirmService = app(\App\Services\ReservationConfirmService::class);
                $confirmService->confirmGroupReservation($reservation, $validated['table_ids'], $validated['staff_id'] ?? null);
            }

            return response()->json([
                'data' => $reservation,
                'message' => 'Reservation created successfully!',
                'errors' => null
            ], 201);
        } catch (\Exception $e) {
            \Log::error("Reservation creation failed: " . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'payload' => $request->all()
            ]);

            return response()->json([
                'data' => null,
                'message' => 'Failed to create reservation: ' . $e->getMessage(),
                'errors' => [$e->getMessage()]
            ], 500);
        }
    }

    /**
     * Display the specified reservation.
     */
    public function show($id)
    {
        $reservation = Reservation::with('items')->findOrFail($id);
        $reservation->dishes = $reservation->items;
        
        return response()->json([
            'data' => $reservation,
            'message' => 'Success',
            'errors' => null
        ]);
    }

    /**
     * Update the specified reservation in storage.
     */
    public function update(Request $request, $id)
    {
        // [WHY] Validation rules for reservation update
        $validated = $request->validate([
            'type' => 'required|in:individual,group',
            'lead_name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'number_of_guests' => 'required|integer|min:1',
            'email' => 'nullable|string|max:255',
            'nationality' => 'nullable|string|max:100',
            'tour_guide_name' => 'nullable|string|max:255',
            'company_name' => 'nullable|string|max:255',
            'set_menu' => 'nullable|string|max:255',
            'dishes' => 'nullable|array',
            'dishes.*.name' => 'required_with:dishes|string|max:255',
            'dishes.*.type' => 'required_with:dishes|in:food,drink',
            'dishes.*.quantity' => 'required_with:dishes|integer|min:1',
            'dishes.*.price' => 'required_with:dishes|numeric|min:0',
            'table_id' => 'nullable|exists:tables,id',
            'table_ids' => 'nullable|array',
            'table_ids.*' => 'exists:tables,id',
            'reservation_date' => 'required|date',
            'reservation_time' => 'required|string',
            'note' => 'nullable|string',
            'status' => 'nullable|in:pending,confirmed,cancelled,completed',
            'staff_id' => 'nullable|exists:users,id'
        ]);

        $hasDishesKey = in_array('dishes', array_keys($request->all()));

        try {
            // [WHY] Sanitize inputs to ensure data types match DB expectations
            // We cast to string before comparing to empty string to handle numeric types gracefully
            if (isset($validated['staff_id']) && trim((string)$validated['staff_id']) === "") {
                $validated['staff_id'] = null;
            }

            if (isset($validated['table_id']) && trim((string)$validated['table_id']) === "") {
                $validated['table_id'] = null;
            }

            // [WHY] Ensure date is strictly YYYY-MM-DD if ISO format was sent (e.g. from React DatePicker)
            if (!empty($validated['reservation_date'])) {
                $validated['reservation_date'] = explode('T', (string)$validated['reservation_date'])[0];
            }
            
            $reservation = $this->reservationService->updateReservation($id, $validated, $hasDishesKey);

            // [WHY] Broadcast real-time event for dashboard synchronization
            broadcast(new \App\Events\ReservationUpdated($reservation, 'updated'))->toOthers();
            
            // [WHY] Clean up transient properties to avoid SQL SET error in confirmGroupReservation
            unset($reservation->dishes);

            // [WHY] If tables were just assigned/updated, we trigger the confirmation flow
            if (!empty($validated['table_ids'])) {
                $confirmService = app(\App\Services\ReservationConfirmService::class);
                $confirmService->confirmGroupReservation($reservation, $validated['table_ids'], $validated['staff_id'] ?? null);
            }

            return response()->json([
                'data' => $reservation,
                'message' => 'Reservation updated successfully!',
                'errors' => null
            ]);
        } catch (\Exception $e) {
            \Log::error("Reservation update failed: " . $e->getMessage(), [
                'id' => $id,
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'payload' => $request->all()
            ]);

            return response()->json([
                'data' => null,
                'message' => 'Failed to update reservation: ' . $e->getMessage(),
                'errors' => [$e->getMessage()]
            ], 500);
        }
    }

    /**
     * Confirm a group reservation and map it to live orders.
     */
    public function confirm(Request $request, $id, \App\Services\ReservationConfirmService $confirmService)
    {
        $reservation = Reservation::findOrFail($id);

        if ($reservation->status === 'confirmed') {
            return response()->json(['message' => 'Reservation is already confirmed.'], 400);
        }

        $validated = $request->validate([
            'table_ids' => 'required|array',
            'table_ids.*' => 'exists:tables,id'
        ]);

        try {
            $orders = $confirmService->confirmGroupReservation($reservation, $validated['table_ids'], request()->user()?->id);
            
            // [WHY] Broadcast real-time event
            broadcast(new \App\Events\ReservationUpdated($reservation, 'confirmed'))->toOthers();

            return response()->json([
                'status' => 'success',
                'message' => 'Reservation confirmed and assigned to tables.',
                'data' => $orders
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to confirm reservation: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Retrieve the segmented bill for a group reservation.
     */
    public function getBill($id, \App\Services\ReservationBillService $billService)
    {
        $reservation = Reservation::findOrFail($id);

        try {
            $billData = $billService->getGroupBill($reservation);
            return response()->json([
                'status' => 'success',
                'data' => $billData
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to compile bill: ' . $e->getMessage()
            ], 500);
        }
    }
}
