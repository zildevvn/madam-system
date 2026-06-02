<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Attendance extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'date',
        'check_in',
        'check_out',
        'total_hours',
        'status'
    ];

    protected static function boot()
    {
        parent::boot();

        static::saving(function ($model) {
            if ($model->check_in && $model->check_out) {
                $start = strtotime($model->check_in);
                $end = strtotime($model->check_out);
                if ($end >= $start) {
                    $model->total_hours = round(($end - $start) / 3600, 2);
                } else {
                    // Handle overnight shift by adding 24 hours
                    $model->total_hours = round((($end + 86400) - $start) / 3600, 2);
                }
            } else {
                $model->total_hours = null;
            }
        });
    }

    /**
     * Get the employee/user of this attendance.
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
