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
            'plain_password' => $data['password'],
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
        
        $updateData = [
            'name' => $data['name'] ?? $user->name,
            'email' => $data['email'] ?? $user->email,
            'role' => $data['role'] ?? $user->role,
            'join_date' => isset($data['join_date']) ? $data['join_date'] : $user->join_date,
            'date_of_birth' => isset($data['date_of_birth']) ? $data['date_of_birth'] : $user->date_of_birth,
            'work_shift' => isset($data['work_shift']) ? $data['work_shift'] : $user->work_shift,
            'flexible_shifts' => isset($data['flexible_shifts']) ? $data['flexible_shifts'] : $user->flexible_shifts,
            'salary' => isset($data['salary']) ? $data['salary'] : $user->salary,
            'bonus' => isset($data['bonus']) ? $data['bonus'] : $user->bonus,
            'address' => isset($data['address']) ? $data['address'] : $user->address,
            'status' => isset($data['status']) ? $data['status'] : $user->status,
            'phone' => isset($data['phone']) ? $data['phone'] : $user->phone,
        ];

        if (!empty($data['password'])) {
            $updateData['password'] = Hash::make($data['password']);
            $updateData['plain_password'] = $data['password'];
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
