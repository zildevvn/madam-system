<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Services\CategoryService;
use Illuminate\Http\Request;
use Exception;

class CategoryController extends Controller
{
    protected $categoryService;

    public function __construct(CategoryService $categoryService)
    {
        $this->categoryService = $categoryService;
    }

    /**
     * Display a listing of the categories.
     */
    public function index()
    {
        $categories = Category::select('id', 'name', 'type')->get();

        return response()->json([
            'data' => $categories,
            'message' => 'Success',
            'errors' => null
        ]);
    }

    /**
     * Store a newly created category.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:food,drink',
        ]);

        try {
            $category = $this->categoryService->create($validated);
            return response()->json([
                'data' => $category,
                'message' => 'Category created successfully',
                'errors' => null
            ], 201);
        } catch (Exception $e) {
            return response()->json([
                'data' => null,
                'message' => 'Failed to create category',
                'errors' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified category.
     */
    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:food,drink',
        ]);

        try {
            $category = $this->categoryService->update((int)$id, $validated);
            return response()->json([
                'data' => $category,
                'message' => 'Category updated successfully',
                'errors' => null
            ]);
        } catch (Exception $e) {
            return response()->json([
                'data' => null,
                'message' => 'Failed to update category',
                'errors' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified category.
     */
    public function destroy($id)
    {
        try {
            $this->categoryService->delete((int)$id);
            return response()->json([
                'data' => null,
                'message' => 'Category deleted successfully',
                'errors' => null
            ]);
        } catch (Exception $e) {
            return response()->json([
                'data' => null,
                'message' => 'Failed to delete category',
                'errors' => $e->getMessage()
            ], 400); // Bad request because of linked products
        }
    }
}
