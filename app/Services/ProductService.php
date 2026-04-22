<?php

namespace App\Services;

use App\Models\Product;
use Illuminate\Support\Facades\Storage;

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
     * [WHY] Create a new product with optional image upload
     */
    public function createProduct(array $data, $imageFile = null)
    {
        if ($imageFile) {
            $data['image'] = $imageFile->store('products', 'public');
        }
        return Product::create($data);
    }

    /**
     * [WHY] Update product details and manage image replacement
     */
    public function updateProduct($id, array $data, $imageFile = null)
    {
        $product = Product::findOrFail($id);
        
        // [WHY] Ensure we don't overwrite the image column with null if no new file is uploaded
        unset($data['image']);
        
        if ($imageFile) {
            // [WHY] Delete old image if it exists
            if ($product->image) {
                Storage::disk('public')->delete($product->image);
            }
            $data['image'] = $imageFile->store('products', 'public');
        }
        
        $product->update($data);
        return $product;
    }

    /**
     * [WHY] Remove product and its associated image from system
     */
    public function deleteProduct($id)
    {
        $product = Product::findOrFail($id);
        
        // [WHY] Delete associated image file
        if ($product->image) {
            Storage::disk('public')->delete($product->image);
        }
        
        $product->delete();
    }
}
