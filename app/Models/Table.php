<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Table extends Model
{
    protected $guarded = [];

    public function activeOrder()
    {
        return $this->hasOne(Order::class)->ofMany(
            ['id' => 'max'],
            function ($query) {
                $query->whereIn('status', ['draft', 'pending', 'processing']);
            }
        );
    }

    public function activeOrders()
    {
        return $this->hasMany(Order::class)->whereIn('status', ['draft', 'pending', 'processing'])->orderBy('id', 'asc');
    }
}
