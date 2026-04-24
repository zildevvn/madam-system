<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'table_id',
        'reservation_id',
        'user_id',
        'cashier_id',
        'merged_tables',
        'order_type',
        'status',
        'subtotal',
        'total_price',
        'discount_type',
        'discount_value',
        'discount_amount',
        'payment_method',
        'cashier_note',
        'order_note',
    ];

    public function server()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function cashier()
    {
        return $this->belongsTo(User::class, 'cashier_id');
    }

    public function table()
    {
        return $this->belongsTo(Table::class);
    }

    public function reservation()
    {
        return $this->belongsTo(Reservation::class);
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }
}
