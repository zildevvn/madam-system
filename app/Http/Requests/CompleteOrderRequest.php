<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\Order;
use Illuminate\Support\Facades\Gate;

class CompleteOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'payment_method' => 'required|string|in:cash,bank,card,debt',
            'discount_type' => 'nullable|string|in:fixed,percent',
            'discount_value' => 'nullable|numeric|min:0',
            'cashier_note' => 'nullable|string|max:255',
            'sibling_order_ids' => 'nullable|array',
            'sibling_order_ids.*' => 'exists:orders,id'
        ];
    }
}
