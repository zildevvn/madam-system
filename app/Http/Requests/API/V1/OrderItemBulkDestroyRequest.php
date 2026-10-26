<?php

namespace App\Http\Requests\API\V1;

use Illuminate\Foundation\Http\FormRequest;

class OrderItemBulkDestroyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Normalize payload to accept either 'item_ids' or 'ids'
     */
    protected function prepareForValidation(): void
    {
        if (!$this->has('item_ids') && $this->has('ids')) {
            $this->merge([
                'item_ids' => $this->input('ids'),
            ]);
        }
    }

    public function rules(): array
    {
        return [
            'item_ids' => [
                'required',
                'array',
                'min:1',
                'max:100',
            ],
            'item_ids.*' => [
                'integer',
                'distinct',
                'min:1',
            ],
        ];
    }
}
