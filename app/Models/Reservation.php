<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Reservation extends Model
{
    protected $fillable = [
        'type',
        'lead_name',
        'phone',
        'number_of_guests',
        'email',
        'nationality',
        'tour_guide_name',
        'company_name',
        'set_menu',
        'table_id',
        'table_ids',
        'reservation_date',
        'reservation_time',
        'note',
        'status',
        'staff_id'
    ];

    protected $casts = [
        'table_ids' => 'array',
        'reservation_date' => 'date'
    ];

    protected $appends = ['dishes'];

    public function getDishesAttribute()
    {
        return $this->items;
    }

    public function table()
    {
        return $this->belongsTo(Table::class);
    }

    public function items()
    {
        return $this->hasMany(ReservationItem::class);
    }
}
