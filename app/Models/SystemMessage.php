<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SystemMessage extends Model
{
    /** @use HasFactory<\Database\Factories\SystemMessageFactory> */
    use HasFactory;

    protected $fillable = [
        'content',
        'user_id'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function readByUsers()
    {
        return $this->belongsToMany(User::class, 'system_message_user')->withPivot('read_at')->withTimestamps();
    }
}
