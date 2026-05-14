<?php

namespace App\Policies;

use App\Models\Order;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class OrderPolicy
{
    use HandlesAuthorization;

    public function before(User $user, $ability)
    {
        \Log::info("OrderPolicy Check (BYPASS): User ID {$user->id}, Ability: {$ability}");
        return true;
    }

    public function manage(User $user)
    {
        return true;
    }

    public function complete(User $user)
    {
        return true;
    }

    public function cancel(User $user, Order $order)
    {
        return true;
    }

    public function reopen(User $user)
    {
        return true;
    }

    public function updatePayment(User $user)
    {
        return true;
    }

    public function split(User $user)
    {
        return true;
    }

    public function updateItemStatus(User $user)
    {
        return true;
    }
}
