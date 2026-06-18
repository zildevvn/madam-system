<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    public const ROLE_ADMIN = 'admin';
    public const ROLE_ACCOUNTANT = 'accountant';
    public const ROLE_CASHIER = 'cashier';

    /**
     * Determine if the user is authorized to access and export order data.
     */
    public function canExportOrders(): bool
    {
        return in_array($this->role, [
            self::ROLE_ADMIN,
            self::ROLE_ACCOUNTANT,
            self::ROLE_CASHIER
        ]);
    }

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'plain_password',
        'session_token',
        'role',
        'join_date',
        'date_of_birth',
        'work_shift',
        'flexible_shifts',
        'salary',
        'bonus',
        'address',
        'id_card_image',
        'contract_image',
        'photo',
        'status',
        'phone',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'flexible_shifts' => 'array',
        ];
    }

    public function readSystemMessages()
    {
        return $this->belongsToMany(SystemMessage::class, 'system_message_user')->withPivot('read_at')->withTimestamps();
    }
}
