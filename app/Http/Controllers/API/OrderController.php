<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Services\OrderService;
use App\Services\PrintService;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    protected $orderService;
    protected $printService;

    public function __construct(OrderService $orderService, PrintService $printService)
    {
        $this->orderService = $orderService;
        $this->printService = $printService;
    }

    public function activeOrder($tableId)
    {
        $order = $this->orderService->getActiveOrder($tableId);

        return response()->json([
            'data' => $order,
            'message' => 'Success',
            'errors' => null
        ]);
    }

    public function show($id)
    {
        $order = $this->orderService->getOrder($id);

        return response()->json([
            'data' => $order,
            'message' => 'Success',
            'errors' => null
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'table_id' => 'nullable|exists:tables,id',
            'merged_tables' => 'nullable|string|max:255',
            'order_type' => 'string|in:dine-in,takeout'
        ]);

        $data = array_merge($validated, ['user_id' => $request->user()?->id]);
        $order = $this->orderService->createOrder($data);

        return response()->json([
            'data' => $order,
            'message' => 'Order created successfully',
            'errors' => null
        ], 201);
    }

    public function complete(Request $request, $id)
    {
        $validated = $request->validate([
            'payment_method' => 'required|string|in:cash,bank,card',
            'discount_type' => 'nullable|string|in:fixed,percent',
            'discount_value' => 'nullable|numeric|min:0'
        ]);

        $data = array_merge($validated, ['cashier_id' => $request->user()?->id]);
        $order = $this->orderService->completeOrder($id, $data);

        return response()->json([
            'data' => $order,
            'message' => 'Order completed successfully',
            'errors' => null
        ]);
    }

    public function checkout(Request $request, $id)
    {
        $validated = $request->validate([
            'items' => 'required|array',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric|min:0',
            'items.*.note' => 'nullable|string|max:255',
            'merged_tables' => 'nullable|string|max:255',
        ]);

        $order = $this->orderService->checkoutOrder($id, $validated['items'], $validated['merged_tables'] ?? null);

        return response()->json([
            'data' => $order,
            'message' => 'Order checkout successful',
            'errors' => null
        ]);
    }

    public function updateItemStatus(Request $request, $itemId)
    {
        $validated = $request->validate([
            'status' => 'required|string|in:pending,cooking,ready,served'
        ]);

        $item = $this->orderService->updateItemStatus($itemId, $validated['status']);

        return response()->json([
            'data' => $item,
            'message' => 'Item status updated successfully',
            'errors' => null
        ]);
    }

    public function updateTable(Request $request, $id)
    {
        $validated = $request->validate([
            'table_id' => 'required|exists:tables,id'
        ]);

        $order = $this->orderService->updateTable($id, $validated['table_id']);

        return response()->json([
            'data' => $order,
            'message' => 'Table updated successfully',
            'errors' => null
        ]);
    }

    public function destroy($id)
    {
        $deleted = $this->orderService->cancelOrder($id);

        if ($deleted) {
            return response()->json([
                'data' => null,
                'message' => 'Order cancelled seamlessly',
                'errors' => null
            ]);
        }

        return response()->json([
            'data' => null,
            'message' => 'Order could not be cancelled or was not draft',
            'errors' => 'Deletion failed'
        ], 400);
    }

    public function printDrinkBill(Request $request, $id)
    {
        $order = $this->orderService->getOrder($id);
        $title = $request->input('title', '');

        $success = $this->printService->printDrinkBill($order, $title);

        return response()->json([
            'data' => $success,
            'message' => $success ? 'Print job sent successfully' : 'Printing failed',
            'errors' => $success ? null : 'Printer communication error'
        ], $success ? 200 : 500);
    }
}
