<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\Order;
use Illuminate\Support\Facades\Gate;

class StoreOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'table_id' => 'nullable|exists:tables,id',
            'merged_tables' => 'nullable|string|max:255',
            'order_type' => 'string|in:dine-in,takeout',
            'guest_count' => 'nullable|integer|min:1'
        ];
    }
}
