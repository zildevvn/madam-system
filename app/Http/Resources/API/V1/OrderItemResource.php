<?php

namespace App\Http\Resources\API\V1;

use App\Traits\PriceCalculator;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderItemResource extends JsonResource
{
    use PriceCalculator;

    public function toArray(Request $request): array
    {
        $quantity = (int) $this->quantity;
        $price = (int) $this->price;
        $discount = (float) ($this->discount ?? 0);
        $discountType = $this->discount_type ?? 'fixed';

        $grossTotal = $quantity * $price;
        $finalPrice = (int) $this->calculateItemNetPrice($quantity, $price, $discount, $discountType);
        $discountAmount = max(0, $grossTotal - $finalPrice);

        return [
            'id' => $this->id,
            'order_id' => $this->order_id,
            'product_id' => $this->product_id,
            'table_id' => $this->table_id,

            'name' => $this->name ?? ($this->product->name ?? null),
            'product_name_vi' => $this->product->name_vi ?? null,
            'type' => $this->type,

            'quantity' => $quantity,
            'price' => $price,
            'gross_total' => $grossTotal,

            'discount' => $this->discount,
            'discount_type' => $discountType,
            'discount_amount' => $discountAmount,
            'final_price' => $finalPrice,

            'note' => $this->note,
            'status' => $this->status,
            'source' => $this->source,
            'sort_order' => $this->sort_order,

            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
