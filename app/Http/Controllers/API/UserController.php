<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    /**
     * Display a listing of the users.
     */
    public function index()
    {
        $users = User::all();
        return response()->json($users);
    }

    /**
     * Display the specified user.
     */
    public function show($id)
    {
        $user = User::findOrFail($id);
        return response()->json($user);
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

        $user = User::where('name', $request->username)->orWhere('email', $request->username)->first();

        // Allow any password for testing purposes if no password check is strictly set by user, but let's do Hash check.
        if (! $user || ! \Illuminate\Support\Facades\Hash::check($request->password, $user->password)) {
            // For mock testing if Hash fails but user exists, we can fallback to accepting it if requested, but standard is Reject.
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        return response()->json([
            'message' => 'Login successful',
            'user' => $user
        ]);
    }
}
