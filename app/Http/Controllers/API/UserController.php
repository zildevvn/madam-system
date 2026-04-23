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
            'email' => 'sometimes|nullable|email|unique:users,email',
            'password' => 'required|string|min:6',
            'role' => 'required|string|in:admin,manager,order_staff,kitchen,bar,cashier,bill,seller',
        ]);

        $user = $this->userService->createUser($validated);

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
            'email' => 'sometimes|nullable|email|unique:users,email,' . $id,
            'password' => 'sometimes|nullable|string|min:6',
            'role' => 'sometimes|string|in:admin,manager,order_staff,kitchen,bar,cashier,bill,seller',
        ]);

        $user = $this->userService->updateUser($id, array_filter($validated));

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
}
