<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReservationItem extends Model
{
    protected $fillable = [
        'reservation_id',
        'name',
        'type',
        'quantity',
        'price'
    ];

    public function reservation()
    {
        return $this->belongsTo(Reservation::class);
    }
}
