<?php

namespace App\Traits;

trait PriceCalculator
{
    /**
     * Calculate the net price of an item after discount.
     * Ensures discount does not exceed the gross price.
     */
    protected function calculateItemNetPrice($quantity, $price, $discount, $discountType)
    {
        $gross = $quantity * $price;
        $discountAmount = 0;
        
        if ($discount > 0) {
            if ($discountType === 'percent') {
                $discountAmount = ($gross * $discount) / 100;
            } else {
                $discountAmount = $discount * $quantity;
            }
            
            // Clamp discount to not exceed gross price
            $discountAmount = min($discountAmount, $gross);
        }
        
        return $gross - $discountAmount;
    }
}
