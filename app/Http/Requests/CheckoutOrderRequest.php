<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\Order;
use Illuminate\Support\Facades\Gate;

class CheckoutOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'items' => 'required|array',
            'items.*.product_id' => 'nullable|exists:products,id',
            'items.*.order_item_id' => 'nullable|exists:order_items,id',
            'items.*.name' => 'nullable|string|max:255',
            'items.*.type' => 'nullable|string|in:food,drink,packaged_drink',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric|min:0',
            'items.*.note' => 'nullable|string|max:255',
            'items.*.discount' => 'nullable|numeric|min:0',
            'items.*.discount_type' => 'nullable|string|in:fixed,percent',
            'items.*.table_id' => 'nullable|exists:tables,id',
            'merged_tables' => 'nullable|string|max:255',
            'order_note' => 'nullable|string|max:500',
            'guest_count' => 'nullable|integer|min:1',
            'user_id' => 'nullable|integer|exists:users,id',
        ];
    }
}
