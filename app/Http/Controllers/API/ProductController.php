<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index()
    {
        $products = Product::select('id', 'name', 'price', 'category_id', 'image')
            ->with(['category:id,name'])
            ->get();

        return response()->json([
            'data' => $products,
            'message' => 'Success',
            'errors' => null
        ]);
    }
}
