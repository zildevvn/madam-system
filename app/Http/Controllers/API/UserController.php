<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Services\UserService;
use App\Models\User;
use Illuminate\Http\Request;
use App\Traits\AuthenticatesStatelessUser;

class UserController extends Controller
{
    use AuthenticatesStatelessUser;
    protected $userService;

    public function __construct(UserService $userService)
    {
        $this->userService = $userService;
    }



    /**
     * Display a listing of the users.
     */
    public function index(Request $request)
    {
        $currentUser = $this->getCurrentUser($request);
        if (!$currentUser) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 401);
        }

        $users = $this->userService->getAllUsers();

        // Security filter: If not admin/manager/accountant/cashier, strip sensitive details
        if ($currentUser->role !== 'admin' && $currentUser->role !== 'manager' && $currentUser->role !== 'accountant' && $currentUser->role !== 'cashier') {
            $users = $users->map(function($u) {
                return [
                    'id' => $u->id,
                    'name' => $u->name,
                    'photo' => $u->photo,
                    'work_shift' => $u->work_shift,
                    'role' => $u->role,
                ];
            });
        }

        return response()->json([
            'data' => $users,
            'message' => 'Success',
            'errors' => null
        ]);
    }

    /**
     * Display the specified user.
     */
    public function show(Request $request, $id)
    {
        $currentUser = $this->getCurrentUser($request);
        
        // Proper authorization check: regular users can only fetch their own profile details
        if ($currentUser && $currentUser->role !== 'admin' && $currentUser->role !== 'manager' && $currentUser->role !== 'accountant' && $currentUser->role !== 'cashier' && $currentUser->id != $id) {
            return response()->json([
                'message' => 'Forbidden'
            ], 403);
        }

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
        $currentUser = $this->getCurrentUser($request);
        if (!$currentUser || ($currentUser->role !== 'admin' && $currentUser->role !== 'manager' && $currentUser->role !== 'accountant' && $currentUser->role !== 'cashier')) {
            return response()->json([
                'message' => 'Forbidden'
            ], 403);
        }

        $validated = $request->validate([
            'role' => 'required|string|in:admin,accountant,manager,order_staff,kitchen,bar,cashier,bill,seller'
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
        $currentUser = $this->getCurrentUser($request);
        if (!$currentUser || ($currentUser->role !== 'admin' && $currentUser->role !== 'manager' && $currentUser->role !== 'accountant' && $currentUser->role !== 'cashier')) {
            return response()->json([
                'message' => 'Forbidden'
            ], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'role' => 'required|string|in:admin,accountant,manager,order_staff,kitchen,bar,cashier,bill,seller',
            'join_date' => 'nullable|date',
            'date_of_birth' => 'required|date',
            'work_shift' => 'nullable|string|max:255',
            'salary' => 'nullable|numeric|min:0',
            'bonus' => 'nullable|numeric|min:0',
            'address' => 'nullable|string',
            'phone' => 'nullable|string|max:50',
            'status' => 'sometimes|required|string|in:active,inactive',
            'id_card_image' => 'nullable|image|max:1024',
            'contract_image' => 'nullable|image|max:1024',
            'photo' => 'nullable|image|max:1024',
        ]);

        $user = $this->userService->createUser(
            $validated,
            $request->file('id_card_image'),
            $request->file('contract_image'),
            $request->file('photo')
        );

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
        $currentUser = $this->getCurrentUser($request);
        
        // Proper authorization check: regular users can only edit their own profile
        if ($currentUser && $currentUser->role !== 'admin' && $currentUser->role !== 'manager' && $currentUser->role !== 'accountant' && $currentUser->role !== 'cashier' && $currentUser->id != $id) {
            return response()->json([
                'message' => 'Forbidden'
            ], 403);
        }

        if ($request->has('flexible_shifts') && is_string($request->input('flexible_shifts'))) {
            $decoded = json_decode($request->input('flexible_shifts'), true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $request->merge(['flexible_shifts' => $decoded]);
            }
        }

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|unique:users,email,' . $id,
            'password' => 'sometimes|nullable|string|min:6',
            'role' => 'sometimes|required|string|in:admin,accountant,manager,order_staff,kitchen,bar,cashier,bill,seller',
            'join_date' => 'sometimes|nullable|date',
            'date_of_birth' => 'sometimes|required|date',
            'work_shift' => 'sometimes|nullable|string|max:255',
            'flexible_shifts' => 'sometimes|nullable|array',
            'salary' => 'sometimes|nullable|numeric|min:0',
            'bonus' => 'sometimes|nullable|numeric|min:0',
            'address' => 'nullable|string',
            'phone' => 'nullable|string|max:50',
            'status' => 'sometimes|required|string|in:active,inactive',
            'id_card_image' => 'nullable|image|max:1024',
            'contract_image' => 'nullable|image|max:1024',
            'photo' => 'nullable|image|max:1024',
            'remove_id_card_image' => 'nullable|boolean',
            'remove_contract_image' => 'nullable|boolean',
        ]);

        // Security check: If not admin/manager/accountant/cashier, strip administrative parameters from being changed
        if ($currentUser && $currentUser->role !== 'admin' && $currentUser->role !== 'manager' && $currentUser->role !== 'accountant' && $currentUser->role !== 'cashier') {
            unset($validated['role']);
            unset($validated['salary']);
            unset($validated['bonus']);
            unset($validated['join_date']);
            unset($validated['status']);

            // Validate shift values if sent by non-admin/non-manager
            if (isset($validated['work_shift']) && !in_array($validated['work_shift'], ['Ca sáng', 'Ca tối', 'Ca full time'])) {
                return response()->json([
                    'message' => 'Ca làm việc không hợp lệ. Chỉ chấp nhận Ca sáng, Ca tối hoặc Ca full time.'
                ], 422);
            }
        }

        if (isset($validated['password']) && empty($validated['password'])) {
            unset($validated['password']);
        }

        $user = $this->userService->updateUser(
            $id,
            $validated,
            $request->file('id_card_image'),
            $request->file('contract_image'),
            $request->file('photo')
        );

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
        $currentUser = $this->getCurrentUser($request);
        if (!$currentUser || ($currentUser->role !== 'admin' && $currentUser->role !== 'manager' && $currentUser->role !== 'accountant' && $currentUser->role !== 'cashier')) {
            return response()->json([
                'message' => 'Forbidden'
            ], 403);
        }

        $this->userService->deleteUser($id);

        return response()->json([
            'message' => 'User deleted successfully',
            'data' => null,
            'errors' => null
        ]);
    }
}
