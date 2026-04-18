<?php

namespace App\Services;

use App\Models\Category;
use App\Models\Product;
use Exception;
use Illuminate\Support\Facades\DB;

class CategoryService
{
    /**
     * Create a new category.
     */
    public function create(array $data)
    {
        return Category::create($data);
    }

    /**
     * Update an existing category.
     */
    public function update(int $id, array $data)
    {
        $category = Category::findOrFail($id);
        $category->update($data);
        return $category;
    }

    /**
     * Delete a category.
     * 
     * @throws Exception if category has products
     */
    public function delete(int $id)
    {
        $category = Category::findOrFail($id);

        // Check if there are any products linked to this category
        $productCount = Product::where('category_id', $id)->count();
        if ($productCount > 0) {
            throw new Exception("Không thể xóa danh mục này vì vẫn còn {$productCount} món đang thuộc danh mục này.");
        }

        return $category->delete();
    }
}
