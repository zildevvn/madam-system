<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    public const STATUS_PENDING = 'pending';
    public const STATUS_PROCESSING = 'processing';
    public const STATUS_DRAFT = 'draft';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'table_id',
        'reservation_id',
        'user_id',
        'cashier_id',
        'merged_tables',
        'order_type',
        'status',
        'is_printed',
        'printed_at',
        'print_count',
        'subtotal',
        'total_price',
        'discount_type',
        'discount_value',
        'discount_amount',
        'payment_method',
        'cashier_note',
        'order_note',
        'guest_count',
        'parent_order_id',
        'completed_at',
    ];

    protected $casts = [
        'completed_at' => 'datetime',
        'printed_at' => 'datetime',
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
        return $this->hasMany(OrderItem::class)->orderBy('sort_order');
    }

    public function parentOrder()
    {
        return $this->belongsTo(Order::class, 'parent_order_id');
    }

    public function childOrders()
    {
        return $this->hasMany(Order::class, 'parent_order_id')->orderBy('id', 'asc');
    }

    public function payments()
    {
        return $this->hasMany(OrderPayment::class);
    }
}
