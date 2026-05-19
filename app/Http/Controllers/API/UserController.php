<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Services\UserService;
use Illuminate\Http\Request;

class UserController extends Controller
{
    protected $userService;

    public function __construct(UserService $userService)
    {
        $this->userService = $userService;
    }

    /**
     * Display a listing of the users.
     */
    public function index()
    {
        $users = $this->userService->getAllUsers();
        return response()->json([
            'data' => $users,
            'message' => 'Success',
            'errors' => null
        ]);
    }

    /**
     * Display the specified user.
     */
    public function show($id)
    {
        $user = $this->userService->getUserById($id);
        return response()->json([
            'data' => $user,
            'message' => 'Success',
            'errors' => null
        ]);
    }

    /**
     * Authenticate a user.
     */
    public function login(Request $request)
    {
        $request->validate([
            'username' => 'required',
            'password' => 'required',
        ]);

        $user = $this->userService->authenticate($request->username, $request->password);

        if (!$user) {
            return response()->json([
                'message' => 'Invalid credentials'
            ], 401);
        }

        return response()->json([
            'data' => $user,
            'message' => 'Login successful',
            'errors' => null
        ]);
    }

    /**
     * Update the user's role.
     */
    public function updateRole(Request $request, $id)
    {
        $validated = $request->validate([
            'role' => 'required|string|in:admin,manager,order_staff,kitchen,bar,cashier,bill,seller'
        ]);

        $user = $this->userService->updateRole($id, $validated['role']);

        return response()->json([
            'data' => $user,
            'message' => 'User role updated successfully',
            'errors' => null
        ]);
    }

    /**
     * Store a new user.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'role' => 'required|string|in:admin,manager,order_staff,kitchen,bar,cashier,bill,seller',
            'join_date' => 'required|date',
            'date_of_birth' => 'required|date',
            'work_shift' => 'required|string',
            'salary' => 'required|numeric|min:0',
            'bonus' => 'required|numeric|min:0',
            'address' => 'nullable|string',
            'id_card_image' => 'nullable|file|image|max:2048',
            'contract_image' => 'nullable|file|image|max:2048',
        ]);

        $user = $this->userService->createUser($validated, $request->file('id_card_image'), $request->file('contract_image'));

        return response()->json([
            'data' => $user,
            'message' => 'User created successfully',
            'errors' => null
        ], 201);
    }

    /**
     * Update an existing user.
     */
    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $id,
            'password' => 'sometimes|nullable|string|min:6',
            'role' => 'sometimes|string|in:admin,manager,order_staff,kitchen,bar,cashier,bill,seller',
            'join_date' => 'sometimes|date',
            'date_of_birth' => 'sometimes|date',
            'work_shift' => 'sometimes|string',
            'salary' => 'sometimes|numeric|min:0',
            'bonus' => 'sometimes|numeric|min:0',
            'address' => 'nullable|string',
            'id_card_image' => 'nullable|file|image|max:2048',
            'contract_image' => 'nullable|file|image|max:2048',
        ]);

        $data = $validated;
        if (array_key_exists('password', $data) && empty($data['password'])) {
            unset($data['password']);
        }

        $user = $this->userService->updateUser($id, $data, $request->file('id_card_image'), $request->file('contract_image'));

        return response()->json([
            'data' => $user,
            'message' => 'User updated successfully',
            'errors' => null
        ]);
    }

    /**
     * Delete a user.
     */
    public function destroy(Request $request, $id)
    {
        // Simple protection: don't let a user delete themselves 
        // (assuming the current user can be checked e.g. via token if auth were fully integrated)
        // For now we just implement the capability.
        $this->userService->deleteUser($id);

        return response()->json([
            'message' => 'User deleted successfully',
            'data' => null,
            'errors' => null
        ]);
    }

    /**
     * Get day-off dates for a specific user.
     */
    public function getDayOffs($userId)
    {
        $user = $this->userService->getUserById($userId);
        if (!$user) {
            return response()->json([
                'message' => 'User not found',
                'errors' => 'User not found'
            ], 404);
        }

        $dayOffs = $user->dayOffs;

        return response()->json([
            'data' => $dayOffs,
            'message' => 'Success',
            'errors' => null
        ]);
    }

    /**
     * Store a new day-off date.
     */
    public function storeDayOff(Request $request, $userId)
    {
        $user = $this->userService->getUserById($userId);
        if (!$user) {
            return response()->json([
                'message' => 'User not found',
                'errors' => 'User not found'
            ], 404);
        }

        $validated = $request->validate([
            'off_date' => 'required|date',
            'reason' => 'nullable|string|max:1000'
        ]);

        // Prevent duplicate day-off entries
        $exists = \App\Models\DayOff::where('user_id', $userId)
            ->where('off_date', $validated['off_date'])
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'Ngày nghỉ này đã được đăng ký trước đó.',
                'errors' => ['off_date' => ['Ngày nghỉ này đã được đăng ký trước đó.']]
            ], 422);
        }

        $dayOff = \App\Models\DayOff::create([
            'user_id' => $userId,
            'off_date' => $validated['off_date'],
            'reason' => $validated['reason'] ?? null
        ]);

        return response()->json([
            'data' => $dayOff,
            'message' => 'Day off registered successfully',
            'errors' => null
        ], 201);
    }

    /**
     * Delete/cancel a day-off date.
     */
    public function destroyDayOff($id)
    {
        $dayOff = \App\Models\DayOff::find($id);
        if (!$dayOff) {
            return response()->json([
                'message' => 'Day off not found',
                'errors' => 'Day off not found'
            ], 404);
        }

        $dayOff->delete();

        return response()->json([
            'message' => 'Day off cancelled successfully',
            'data' => null,
            'errors' => null
        ]);
    }
}
