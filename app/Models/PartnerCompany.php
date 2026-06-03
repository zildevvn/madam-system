<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class PartnerCompany extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'phone',
        'email',
        'address',
        'notes',
    ];
    protected $appends = ['company_name'];

    public function getCompanyNameAttribute()
    {
        return $this->name;
    }
    public function reservations()
    {
        return $this->hasMany(Reservation::class, 'partner_company_id');
    }
}
