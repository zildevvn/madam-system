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
    public function index()
    {
        // [WHY] Fetch reservations with related table info and pre-ordered items for the list view.
        $reservations = Reservation::with(['table:id,name', 'items'])
            ->orderBy('reservation_time', 'asc')
            ->get();

        return response()->json([
            'data' => $reservations,
            'message' => 'Success',
            'errors' => null
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
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
            'dishes.*.product_id' => 'required_with:dishes|integer',
            'dishes.*.name' => 'required_with:dishes|string|max:255',
            'dishes.*.quantity' => 'required_with:dishes|integer|min:1',
            'dishes.*.price' => 'required_with:dishes|numeric|min:0',
            'table_id' => 'nullable|exists:tables,id',
            'table_ids' => 'nullable|array',
            'table_ids.*' => 'exists:tables,id',
            'reservation_date' => 'required|date',
            'reservation_time' => 'required|string',
            'note' => 'nullable|string'
        ]);

        $reservation = $this->reservationService->createReservation($validated);

        return response()->json([
            'data' => $reservation,
            'message' => 'Reservation created successfully!',
            'errors' => null
        ], 201);
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
            'dishes.*.product_id' => 'required_with:dishes|integer',
            'dishes.*.name' => 'required_with:dishes|string|max:255',
            'dishes.*.quantity' => 'required_with:dishes|integer|min:1',
            'dishes.*.price' => 'required_with:dishes|numeric|min:0',
            'table_id' => 'nullable|exists:tables,id',
            'table_ids' => 'nullable|array',
            'table_ids.*' => 'exists:tables,id',
            'reservation_date' => 'required|date',
            'reservation_time' => 'required|string',
            'note' => 'nullable|string',
            'status' => 'nullable|in:pending,confirmed,cancelled,completed'
        ]);

        $hasDishesKey = in_array('dishes', array_keys($request->all()));
        
        $reservation = $this->reservationService->updateReservation($id, $validated, $hasDishesKey);

        return response()->json([
            'data' => $reservation,
            'message' => 'Reservation updated successfully!',
            'errors' => null
        ]);
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
