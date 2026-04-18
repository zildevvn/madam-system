<?php

namespace App\Services;

use App\Models\Product;

class ProductService
{
    /**
     * [WHY] Fetch all products with their categories for the admin dashboard
     */
    public function getAllProducts()
    {
        return Product::with('category:id,name,type')->get();
    }

    /**
     * [WHY] Create a new product
     */
    public function createProduct(array $data)
    {
        return Product::create($data);
    }

    /**
     * [WHY] Update product details
     */
    public function updateProduct($id, array $data)
    {
        $product = Product::findOrFail($id);
        $product->update($data);
        return $product;
    }

    /**
     * [WHY] Remove product from system
     */
    public function deleteProduct($id)
    {
        $product = Product::findOrFail($id);
        $product->delete();
    }
}
