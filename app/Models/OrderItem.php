<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrderItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'product_id',
        'name',
        'type',
        'table_id',
        'quantity',
        'price',
        'note',
        'status',
        'source',
        'reservation_item_id'
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function reservationItem()
    {
        return $this->belongsTo(ReservationItem::class);
    }
}
