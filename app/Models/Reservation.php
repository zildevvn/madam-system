<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;
use App\Models\Table;
use App\Models\ReservationItem;

class Reservation extends Model
{
    public const STATUS_PENDING = 'pending';
    public const STATUS_CONFIRMED = 'confirmed';
    public const STATUS_CANCELLED = 'cancelled';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_SEATED = 'seated';
    protected $fillable = [
        'type',
        'lead_name',
        'phone',
        'number_of_guests',
        'email',
        'nationality',
        'tour_guide_name',
        'company_name',
        'partner_company_id',
        'set_menu',
        'table_id',
        'table_ids',
        'reservation_date',
        'reservation_time',
        'note',
        'status',
        'updated_by',
        'staff_id',
        'apply_vat',
        'vat_percentage'
    ];

    protected $casts = [
        'table_ids' => 'array',
        'reservation_date' => 'date:Y-m-d',
        'apply_vat' => 'boolean',
        'vat_percentage' => 'integer',
        'partner_company_id' => 'integer'
    ];

    protected $appends = ['dishes'];

    public function getDishesAttribute()
    {
        return $this->items;
    }

    public function getCompanyNameAttribute($value)
    {
        if ($this->relationLoaded('partnerCompany') && $this->partnerCompany) {
            return $this->partnerCompany->company_name;
        }
        if (!$this->relationLoaded('partnerCompany') && $this->partner_company_id) {
            return $this->partnerCompany?->company_name ?? $value;
        }
        return $value;
    }

    public function partnerCompany()
    {
        return $this->belongsTo(PartnerCompany::class, 'partner_company_id');
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

    public function histories()
    {
        return $this->hasMany(ReservationHistory::class)->with('user:id,name')->latest();
    }
}
