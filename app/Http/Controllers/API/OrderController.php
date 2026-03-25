<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Services\OrderService;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    protected $orderService;

    public function __construct(OrderService $orderService)
    {
        $this->orderService = $orderService;
    }

    public function activeOrder($tableId)
    {
        $order = $this->orderService->getActiveOrder($tableId);
        
        return response()->json([
            'data' => $order,
            'message' => 'Success'
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'table_id' => 'nullable|exists:tables,id',
            'order_type' => 'string|in:dine-in,takeout'
        ]);

        $order = $this->orderService->createOrder($validated);

        return response()->json([
            'data' => $order,
            'message' => 'Order created successfully'
        ], 201);
    }

    public function checkout(Request $request, $id)
    {
        $validated = $request->validate([
            'items' => 'required|array',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric|min:0',
            'items.*.note' => 'nullable|string|max:255',
        ]);

        $order = $this->orderService->checkoutOrder($id, $validated['items']);

        return response()->json([
            'data' => $order,
            'message' => 'Order checkout successful'
        ]);
    }

    public function destroy($id)
    {
        $deleted = $this->orderService->cancelOrder($id);
        
        if ($deleted) {
            return response()->json(['message' => 'Order cancelled seamlessly']);
        }

        return response()->json(['message' => 'Order could not be cancelled or was not draft'], 400);
    }
}
