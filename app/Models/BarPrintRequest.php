<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BarPrintRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'request_id',
        'order_id',
        'table_name',
        'table_id',
        'title',
        'items',
        'order_note',
        'staff_name',
        'status',
        'printed_at',
        'error_message',
    ];

    protected $casts = [
        'items' => 'array',
        'printed_at' => 'datetime',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }
}
