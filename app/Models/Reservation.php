<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;
use App\Models\Table;
use App\Models\ReservationItem;

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
        'updated_by',
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

    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function items()
    {
        return $this->hasMany(ReservationItem::class);
    }
}
