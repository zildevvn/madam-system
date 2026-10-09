<?php

namespace App\Http\Requests\API\V1;

use Illuminate\Foundation\Http\FormRequest;

class OrderIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:100'],
            'order_id' => ['nullable', 'integer', 'min:1'],

            'status' => [
                'nullable',
                'in:draft,pending,processing,completed,cancelled'
            ],

            'order_type' => ['nullable', 'in:dine-in,takeout'],
            'table_id' => ['nullable', 'integer', 'min:1'],
            'reservation_id' => ['nullable', 'integer', 'min:1'],
            'parent_order_id' => ['nullable', 'integer', 'min:1'],
            'user_id' => ['nullable', 'integer', 'min:1'],
            'cashier_id' => ['nullable', 'integer', 'min:1'],

            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],

            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
        ];
    }
}