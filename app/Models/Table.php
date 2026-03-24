<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Table extends Model
{
    protected $guarded = [];

    public function activeOrder()
    {
        return $this->hasOne(Order::class)->whereIn('status', ['pending', 'processing'])->latestOfMany();
    }
}
