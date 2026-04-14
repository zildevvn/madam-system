<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Table extends Model
{
    protected $guarded = [];

    public function activeOrder()
    {
        return $this->hasOne(Order::class)->whereIn('status', ['draft', 'pending', 'processing'])->latestOfMany();
    }

    public function activeOrders()
    {
        return $this->hasMany(Order::class)->whereIn('status', ['draft', 'pending', 'processing']);
    }
}
