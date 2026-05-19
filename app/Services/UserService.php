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

    public function createUser(array $data, $idCardFile = null, $contractFile = null)
    {
        $userData = [
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'plain_password' => $data['password'],
            'role' => $data['role'] ?? 'order_staff',
            'join_date' => $data['join_date'] ?? null,
            'date_of_birth' => $data['date_of_birth'] ?? null,
            'work_shift' => $data['work_shift'] ?? null,
            'salary' => $data['salary'] ?? 0,
            'bonus' => $data['bonus'] ?? 0,
            'address' => $data['address'] ?? null,
        ];

        if ($idCardFile) {
            $userData['id_card_image'] = $idCardFile->store('employees', 'public');
        }
        if ($contractFile) {
            $userData['contract_image'] = $contractFile->store('employees', 'public');
        }

        return User::create($userData);
    }

    public function updateUser($id, array $data, $idCardFile = null, $contractFile = null)
    {
        $user = User::findOrFail($id);
        
        $updateData = [
            'name' => $data['name'] ?? $user->name,
            'email' => $data['email'] ?? $user->email,
            'role' => $data['role'] ?? $user->role,
            'join_date' => $data['join_date'] ?? $user->join_date,
            'date_of_birth' => $data['date_of_birth'] ?? $user->date_of_birth,
            'work_shift' => $data['work_shift'] ?? $user->work_shift,
            'salary' => $data['salary'] ?? $user->salary,
            'bonus' => $data['bonus'] ?? $user->bonus,
            'address' => $data['address'] ?? $user->address,
        ];

        if (!empty($data['password'])) {
            $updateData['password'] = Hash::make($data['password']);
            $updateData['plain_password'] = $data['password'];
        }

        if ($idCardFile) {
            if ($user->id_card_image) {
                Storage::disk('public')->delete($user->id_card_image);
            }
            $updateData['id_card_image'] = $idCardFile->store('employees', 'public');
        }

        if ($contractFile) {
            if ($user->contract_image) {
                Storage::disk('public')->delete($user->contract_image);
            }
            $updateData['contract_image'] = $contractFile->store('employees', 'public');
        }

        $user->update($updateData);
        return $user;
    }

    public function deleteUser($id)
    {
        $user = User::findOrFail($id);
        return $user->delete();
    }
}
