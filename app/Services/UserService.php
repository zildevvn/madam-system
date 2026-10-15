<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

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

    public function createUser(array $data, $idCardFile = null, $contractFile = null, $photoFile = null)
    {
        if ($idCardFile) {
            $data['id_card_image'] = $idCardFile->store('employees', 'public');
        }
        if ($contractFile) {
            $data['contract_image'] = $contractFile->store('employees', 'public');
        }
        if ($photoFile) {
            $data['photo'] = $photoFile->store('employees', 'public');
        }

        return User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'role' => $data['role'] ?? 'order_staff',
            'join_date' => $data['join_date'] ?? null,
            'date_of_birth' => $data['date_of_birth'] ?? null,
            'work_shift' => $data['work_shift'] ?? null,
            'flexible_shifts' => $data['flexible_shifts'] ?? null,
            'salary' => $data['salary'] ?? null,
            'bonus' => $data['bonus'] ?? null,
            'address' => $data['address'] ?? null,
            'id_card_image' => $data['id_card_image'] ?? null,
            'contract_image' => $data['contract_image'] ?? null,
            'photo' => $data['photo'] ?? null,
            'status' => $data['status'] ?? 'active',
            'phone' => $data['phone'] ?? null,
        ]);
    }

    public function updateUser($id, array $data, $idCardFile = null, $contractFile = null, $photoFile = null)
    {
        $user = User::findOrFail($id);
        
        $updateData = [];
        if (isset($data['name'])) $updateData['name'] = $data['name'];
        if (isset($data['email'])) $updateData['email'] = $data['email'];
        if (isset($data['role'])) $updateData['role'] = $data['role'];

        foreach (['join_date', 'date_of_birth', 'work_shift', 'flexible_shifts', 'salary', 'bonus', 'address', 'status', 'phone'] as $field) {
            if (array_key_exists($field, $data)) {
                $updateData[$field] = $data[$field];
            }
        }

        if (!empty($data['password'])) {
            $updateData['password'] = Hash::make($data['password']);
            $user->tokens()->delete();
        }

        if (isset($data['remove_id_card_image']) && $data['remove_id_card_image'] == true) {
            if ($user->id_card_image) {
                Storage::disk('public')->delete($user->id_card_image);
            }
            $updateData['id_card_image'] = null;
        } elseif ($idCardFile) {
            if ($user->id_card_image) {
                Storage::disk('public')->delete($user->id_card_image);
            }
            $updateData['id_card_image'] = $idCardFile->store('employees', 'public');
        }

        if (isset($data['remove_contract_image']) && $data['remove_contract_image'] == true) {
            if ($user->contract_image) {
                Storage::disk('public')->delete($user->contract_image);
            }
            $updateData['contract_image'] = null;
        } elseif ($contractFile) {
            if ($user->contract_image) {
                Storage::disk('public')->delete($user->contract_image);
            }
            $updateData['contract_image'] = $contractFile->store('employees', 'public');
        }

        if ($photoFile) {
            if ($user->photo) {
                Storage::disk('public')->delete($user->photo);
            }
            $updateData['photo'] = $photoFile->store('employees', 'public');
        }

        $user->update($updateData);
        return $user;
    }

    public function deleteUser($id)
    {
        $user = User::findOrFail($id);
        if ($user->id_card_image) {
            Storage::disk('public')->delete($user->id_card_image);
        }
        if ($user->contract_image) {
            Storage::disk('public')->delete($user->contract_image);
        }
        if ($user->photo) {
            Storage::disk('public')->delete($user->photo);
        }
        return $user->delete();
    }
}
