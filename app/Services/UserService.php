<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserService
{
    public function getAllUsers()
    {
        return User::all();
    }

    public function getUserById($id)
    {
        return User::findOrFail($id);
    }

    public function authenticate($username, $password)
    {
        $user = User::where('name', $username)->orWhere('email', $username)->first();

        if (! $user || ! Hash::check($password, $user->password)) {
            return null;
        }

        return $user;
    }

    public function updateRole($id, $role)
    {
        $user = User::findOrFail($id);
        $user->role = $role;
        $user->save();
        return $user;
    }
}
