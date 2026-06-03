<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use App\Models\User;
use Illuminate\Http\Request;

class SystemSettingController extends Controller
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
     * Display a listing of system settings.
     */
    public function index()
    {
        $settings = SystemSetting::all()->pluck('value', 'key');
        return response()->json([
            'data' => $settings,
            'message' => 'Success'
        ]);
    }

    /**
     * Update system settings.
     */
    public function update(Request $request)
    {
        $currentUser = $this->getCurrentUser($request);
        if (!$currentUser || $currentUser->role !== 'admin') {
            return response()->json([
                'message' => 'Forbidden'
            ], 403);
        }

        $validated = $request->validate([
            'attendance_enabled' => 'required|string|in:true,false'
        ]);

        SystemSetting::setVal('attendance_enabled', $validated['attendance_enabled']);

        return response()->json([
            'data' => [
                'attendance_enabled' => SystemSetting::getVal('attendance_enabled')
            ],
            'message' => 'Settings updated successfully'
        ]);
    }
}
