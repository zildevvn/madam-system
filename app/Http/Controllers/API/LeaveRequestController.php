<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\LeaveRequest;
use App\Models\User;
use Illuminate\Http\Request;
use App\Traits\AuthenticatesStatelessUser;

class LeaveRequestController extends Controller
{
    use AuthenticatesStatelessUser;


    /**
     * Display a listing of day off requests.
     */
    public function index(Request $request)
    {
        $currentUser = $this->getCurrentUser($request);
        if (!$currentUser) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 401);
        }

        $query = LeaveRequest::with(['user', 'approver']);

        // Strict security boundaries: Regular employees can only view their own leave requests OR approved leave requests of colleagues
        if ($currentUser->role !== 'admin' && $currentUser->role !== 'manager') {
            $query->where(function($q) use ($currentUser) {
                $q->where('user_id', $currentUser->id)
                  ->orWhere('status', 'approved');
            });
        } else {
            // Admin or manager can filter by user_id if passed, otherwise view all
            if ($request->has('user_id')) {
                $query->where('user_id', $request->query('user_id'));
            }
        }

        $requests = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'data' => $requests,
            'message' => 'Leave requests retrieved successfully',
            'errors' => null
        ]);
    }

    /**
     * Store a newly created day off request in storage.
     */
    public function store(Request $request)
    {
        $currentUser = $this->getCurrentUser($request);
        if (!$currentUser) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 401);
        }

        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'leave_type' => 'required|string|in:paid,unpaid,sick,other',
            'reason' => 'nullable|string'
        ]);

        // Strict security checks: Regular employees can only request leave for themselves
        if ($currentUser->role !== 'admin' && $currentUser->role !== 'manager' && $validated['user_id'] != $currentUser->id) {
            return response()->json([
                'message' => 'Forbidden'
            ], 403);
        }

        $leave = LeaveRequest::create([
            'user_id' => $validated['user_id'],
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'leave_type' => $validated['leave_type'],
            'reason' => $validated['reason'] ?? null,
            'status' => 'pending'
        ]);

        $fullLeave = LeaveRequest::with(['user', 'approver'])->find($leave->id);
        try {
            broadcast(new \App\Events\LeaveRequestUpdated($fullLeave, 'created'));
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Broadcast failed for leave request creation: ' . $e->getMessage());
        }

        return response()->json([
            'data' => $fullLeave,
            'message' => 'Day off requested successfully',
            'errors' => null
        ], 201);
    }

    /**
     * Update approval/rejection status.
     */
    public function updateStatus(Request $request, $id)
    {
        $currentUser = $this->getCurrentUser($request);
        
        // Strict security checks: Only admin or manager roles can approve/reject leave requests
        if (!$currentUser || ($currentUser->role !== 'admin' && $currentUser->role !== 'manager')) {
            return response()->json([
                'message' => 'Forbidden'
            ], 403);
        }

        $validated = $request->validate([
            'status' => 'required|string|in:approved,rejected,approved_cancel,rejected_cancel',
            'approved_by' => 'required|exists:users,id'
        ]);

        $leave = LeaveRequest::findOrFail($id);
        $leave->status = $validated['status'];
        $leave->approved_by = $validated['approved_by'];
        $leave->save();

        $fullLeave = LeaveRequest::with(['user', 'approver'])->find($leave->id);
        try {
            broadcast(new \App\Events\LeaveRequestUpdated($fullLeave, 'updated'));
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Broadcast failed for leave request status update: ' . $e->getMessage());
        }

        return response()->json([
            'data' => $fullLeave,
            'message' => 'Day off status updated successfully',
            'errors' => null
        ]);
    }

    /**
     * Remove the specified request from storage.
     */
    public function destroy(Request $request, $id)
    {
        $currentUser = $this->getCurrentUser($request);
        if (!$currentUser) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 401);
        }

        $leave = LeaveRequest::findOrFail($id);

        // Strict security checks: Regular employees can only cancel their own future requests
        if ($currentUser->role !== 'admin' && $currentUser->role !== 'manager') {
            if ($leave->user_id != $currentUser->id) {
                return response()->json([
                    'message' => 'Forbidden'
                ], 403);
            }
            
            // Check if it is a future off request (start_date >= today in local time)
            $today = now()->toDateString();
            if ($leave->start_date < $today) {
                return response()->json([
                    'message' => 'Cannot cancel a past off request'
                ], 400);
            }
        }

        // If the request was approved or rejected_cancel, transition to pending_cancel instead of deleting
        if ($leave->status === 'approved' || $leave->status === 'rejected_cancel') {
            $leave->status = 'pending_cancel';
            $leave->save();

            $fullLeave = LeaveRequest::with(['user', 'approver'])->find($leave->id);
            try {
                broadcast(new \App\Events\LeaveRequestUpdated($fullLeave, 'updated'));
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('Broadcast failed for leave cancellation request: ' . $e->getMessage());
            }

            return response()->json([
                'data' => $fullLeave,
                'message' => 'Cancellation request submitted successfully. Waiting for approval.',
                'errors' => null
            ]);
        }

        $leaveCopy = clone $leave;
        $leave->delete();

        try {
            broadcast(new \App\Events\LeaveRequestUpdated($leaveCopy, 'deleted'));
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Broadcast failed for leave request cancellation: ' . $e->getMessage());
        }

        return response()->json([
            'data' => null,
            'message' => 'Day off request cancelled successfully',
            'errors' => null
        ]);
    }
}
