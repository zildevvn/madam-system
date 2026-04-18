<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Services\ProductService;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    protected $productService;

    public function __construct(ProductService $productService)
    {
        $this->productService = $productService;
    }

    public function index()
    {
        $products = $this->productService->getAllProducts();

        return response()->json([
            'data' => $products,
            'message' => 'Success',
            'errors' => null
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'category_id' => 'required|exists:categories,id',
            'name' => 'required|string|max:255',
            'price' => 'required|integer|min:0',
            'type' => 'required|in:food,drink',
            'image' => 'nullable|string'
        ]);

        $product = $this->productService->createProduct($validated);

        return response()->json([
            'data' => $product,
            'message' => 'Product created successfully',
            'errors' => null
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'category_id' => 'required|exists:categories,id',
            'name' => 'required|string|max:255',
            'price' => 'required|integer|min:0',
            'type' => 'required|in:food,drink',
            'image' => 'nullable|string'
        ]);

        $product = $this->productService->updateProduct($id, $validated);

        return response()->json([
            'data' => $product,
            'message' => 'Product updated successfully',
            'errors' => null
        ]);
    }

    public function destroy($id)
    {
        $this->productService->deleteProduct($id);

        return response()->json([
            'data' => null,
            'message' => 'Product deleted successfully',
            'errors' => null
        ]);
    }
}
