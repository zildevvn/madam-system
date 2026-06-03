<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\User;
use App\Models\LeaveRequest;
use Illuminate\Http\Request;
use Carbon\Carbon;

class AttendanceController extends Controller
{
    private function getCurrentUser(Request $request)
    {
        $userId = $request->header('X-User-Id');
        if (!$userId) {
            return null;
        }
        return User::find($userId);
    }

    /**
     * Display a listing of employee attendance records by date.
     */
    public function index(Request $request)
    {
        $currentUser = $this->getCurrentUser($request);
        if (!$currentUser || ($currentUser->role !== 'admin' && $currentUser->role !== 'manager')) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $dateStr = $request->query('date', Carbon::today()->toDateString());

        // Fetch all active employees
        $employees = User::where('status', 'active')
            ->where('role', '!=', 'admin')
            ->orderBy('name')
            ->get();

        // Fetch all attendance records for this date
        $attendances = Attendance::where('date', $dateStr)->get()->keyBy('user_id');

        // Fetch approved leaves for this date
        $leaves = LeaveRequest::where('status', 'approved')
            ->whereDate('start_date', '<=', $dateStr)
            ->whereDate('end_date', '>=', $dateStr)
            ->get()
            ->keyBy('user_id');

        $data = $employees->map(function ($employee) use ($dateStr, $attendances, $leaves) {
            $attendance = $attendances->get($employee->id);
            $onLeave = $leaves->has($employee->id);

            // Determine scheduled shift
            $scheduledShift = null;
            if ($employee->flexible_shifts && isset($employee->flexible_shifts[$dateStr])) {
                $scheduledShift = $employee->flexible_shifts[$dateStr];
            } else if ($employee->work_shift) {
                // If it is fixed shift, assume working unless on leave
                $scheduledShift = $employee->work_shift;
            }

            // Determine status
            $status = 'off_day';
            if ($attendance) {
                $status = $attendance->status;
            } else if ($onLeave) {
                $status = 'off_day';
            } else if ($scheduledShift) {
                $status = 'not_checked_in';
            } else {
                $status = 'off_day';
            }

            return [
                'employee_id' => $employee->id,
                'employee_name' => $employee->name,
                'employee_role' => $employee->role,
                'employee_avatar' => $employee->photo,
                'scheduled_shift' => $scheduledShift,
                'on_leave' => $onLeave,
                'attendance_id' => $attendance ? $attendance->id : null,
                'check_in' => $attendance ? $attendance->check_in : null,
                'check_out' => $attendance ? $attendance->check_out : null,
                'total_hours' => $attendance ? floatval($attendance->total_hours) : 0,
                'status' => $status,
            ];
        });

        return response()->json([
            'data' => $data,
            'date' => $dateStr,
            'message' => 'Attendance list retrieved successfully'
        ]);
    }

    /**
     * Store or update manual attendance record.
     */
    public function store(Request $request)
    {
        $currentUser = $this->getCurrentUser($request);
        if (!$currentUser || ($currentUser->role !== 'admin' && $currentUser->role !== 'manager')) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $request->validate([
            'user_id' => 'required|exists:users,id',
            'date' => 'required|date',
            'check_in' => 'nullable|string',
            'check_out' => 'nullable|string',
            'status' => 'required|string|in:working,checked_out,missing_checkout,off_day,not_checked_in,pending,rejected,checkout_pending,checkout_rejected'
        ]);

        $userId = $request->user_id;
        $date = $request->date;
        $checkIn = $request->check_in;
        $checkOut = $request->check_out;
        $status = $request->status;

        // Overlap or invalid check validation
        if ($checkIn && $checkOut) {
            $start = strtotime($checkIn);
            $end = strtotime($checkOut);
            if ($start === $end) {
                return response()->json([
                    'message' => 'Giờ check-out không được trùng với giờ check-in.'
                ], 422);
            }
        }

        // If status is not_checked_in or off_day and no check-in exists, we can delete or keep empty record.
        // Let's delete attendance entry if status is set back to 'not_checked_in' to restore base schedule calculations!
        if (in_array($status, ['not_checked_in'])) {
            Attendance::where('user_id', $userId)->where('date', $date)->delete();
            return response()->json([
                'message' => 'Đã đặt lại trạng thái chấm công về mặc định.'
            ]);
        }

        // Find or create
        $attendance = Attendance::updateOrCreate(
            ['user_id' => $userId, 'date' => $date],
            [
                'check_in' => $checkIn,
                'check_out' => $checkOut,
                'status' => $status
            ]
        );

        return response()->json([
            'data' => $attendance,
            'message' => 'Cập nhật chấm công thành công'
        ]);
    }

    /**
     * Delete attendance record.
     */
    public function destroy(Request $request, $id)
    {
        $currentUser = $this->getCurrentUser($request);
        if (!$currentUser || ($currentUser->role !== 'admin' && $currentUser->role !== 'manager')) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $attendance = Attendance::find($id);
        if (!$attendance) {
            return response()->json(['message' => 'Attendance record not found'], 404);
        }

        $attendance->delete();

        return response()->json([
            'message' => 'Xóa bản ghi chấm công thành công'
        ]);
    }

    /**
     * Get today's attendance status for the current user.
     */
    public function todayStatus(Request $request)
    {
        $currentUser = $this->getCurrentUser($request);
        if (!$currentUser) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        if (\App\Models\SystemSetting::getVal('attendance_enabled') !== 'true') {
            return response()->json([
                'date' => Carbon::today()->toDateString(),
                'status' => 'working',
                'attendance' => null,
                'on_leave' => false
            ]);
        }

        $dateStr = Carbon::today()->toDateString();
        $attendance = Attendance::where('user_id', $currentUser->id)
            ->where('date', $dateStr)
            ->first();

        // Check if there is an approved leave
        $onLeave = LeaveRequest::where('user_id', $currentUser->id)
            ->where('status', 'approved')
            ->whereDate('start_date', '<=', $dateStr)
            ->whereDate('end_date', '>=', $dateStr)
            ->exists();

        $status = 'not_checked_in';
        if ($attendance) {
            $status = $attendance->status;
        } else if ($onLeave) {
            $status = 'off_day';
        }

        return response()->json([
            'date' => $dateStr,
            'status' => $status,
            'attendance' => $attendance,
            'on_leave' => $onLeave
        ]);
    }

    /**
     * Request check-in for the current user today.
     */
    public function requestCheckIn(Request $request)
    {
        $currentUser = $this->getCurrentUser($request);
        if (!$currentUser) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $dateStr = Carbon::today()->toDateString();

        // Check if a record already exists to prevent duplicate requests
        $existing = Attendance::where('user_id', $currentUser->id)
            ->where('date', $dateStr)
            ->first();

        if ($existing && in_array($existing->status, ['pending', 'working', 'checked_out'])) {
            return response()->json([
                'message' => 'Bạn đã gửi yêu cầu hoặc đã check-in hôm nay rồi.',
                'data' => $existing
            ], 422);
        }

        $nowTime = Carbon::now()->toTimeString();

        $attendance = Attendance::updateOrCreate(
            ['user_id' => $currentUser->id, 'date' => $dateStr],
            [
                'check_in' => $nowTime,
                'check_out' => null,
                'status' => 'pending'
            ]
        );

        return response()->json([
            'data' => $attendance,
            'message' => 'Gửi yêu cầu check-in thành công. Vui lòng chờ quản lý duyệt!'
        ]);
    }

    /**
     * Approve a pending check-in/out request.
     */
    public function approveRequest(Request $request, $id)
    {
        $currentUser = $this->getCurrentUser($request);
        if (!$currentUser || ($currentUser->role !== 'admin' && $currentUser->role !== 'manager')) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $attendance = Attendance::find($id);
        if (!$attendance) {
            return response()->json(['message' => 'Bản ghi không tồn tại'], 404);
        }

        if ($attendance->status === 'checkout_pending') {
            $attendance->check_out = Carbon::now()->toTimeString();
            $attendance->status = 'checked_out';
            $msg = 'Đã duyệt yêu cầu check-out';
        } else {
            $attendance->status = 'working';
            $msg = 'Đã duyệt yêu cầu check-in';
        }
        
        $attendance->save();

        return response()->json([
            'data' => $attendance,
            'message' => $msg
        ]);
    }

    /**
     * Reject a pending check-in/out request.
     */
    public function rejectRequest(Request $request, $id)
    {
        $currentUser = $this->getCurrentUser($request);
        if (!$currentUser || ($currentUser->role !== 'admin' && $currentUser->role !== 'manager')) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $attendance = Attendance::find($id);
        if (!$attendance) {
            return response()->json(['message' => 'Bản ghi không tồn tại'], 404);
        }

        if ($attendance->status === 'checkout_pending') {
            $attendance->status = 'checkout_rejected';
            $msg = 'Đã từ chối yêu cầu check-out';
        } else {
            $attendance->status = 'rejected';
            $msg = 'Đã từ chối yêu cầu check-in';
        }
        
        $attendance->save();

        return response()->json([
            'data' => $attendance,
            'message' => $msg
        ]);
    }

    /**
     * Request checkout/end-shift for the current user today.
     */
    public function requestCheckout(Request $request)
    {
        $currentUser = $this->getCurrentUser($request);
        if (!$currentUser) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $dateStr = Carbon::today()->toDateString();
        $attendance = Attendance::where('user_id', $currentUser->id)
            ->where('date', $dateStr)
            ->first();

        if (!$attendance) {
            return response()->json(['message' => 'Bạn chưa check-in hôm nay.'], 422);
        }

        if ($attendance->status === 'checkout_pending') {
            return response()->json(['message' => 'Bạn đã gửi yêu cầu checkout rồi, đang chờ duyệt.'], 422);
        }

        if ($attendance->status === 'checked_out') {
            return response()->json(['message' => 'Bạn đã checkout hôm nay rồi.'], 422);
        }

        $attendance->status = 'checkout_pending';
        $attendance->save();

        return response()->json([
            'data' => $attendance,
            'message' => 'Gửi yêu cầu checkout thành công. Vui lòng chờ quản lý duyệt!'
        ]);
    }
}
