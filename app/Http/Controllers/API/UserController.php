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
            'message' => 'Success'
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
            'message' => 'Success'
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
        ]);
    }
}
