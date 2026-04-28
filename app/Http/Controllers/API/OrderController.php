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

    // [WHY] Fetch the currently active order for a given table to display in the workspace.
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
            'order_type' => 'string|in:dine-in,takeout',
            'guest_count' => 'nullable|integer|min:1'
        ]);

        $data = array_merge($validated, ['user_id' => $request->user()?->id]);
        $order = $this->orderService->createOrder($data);

        return response()->json([
            'data' => $order,
            'message' => 'Order created successfully',
            'errors' => null
        ], 201);
    }

    /**
     * complete
     * [WHY] Finalizes an order, records payment details, and releases the table.
     * [RULE] Status changes to 'completed'. Table status changes to 'available'.
     */
    public function complete(Request $request, $id)
    {
        $validated = $request->validate([
            'payment_method' => 'required|string|in:cash,bank,card,debt',
            'discount_type' => 'nullable|string|in:fixed,percent',
            'discount_value' => 'nullable|numeric|min:0',
            'cashier_note' => 'nullable|string|max:255'
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
            'order_note' => 'nullable|string|max:500',
            'guest_count' => 'nullable|integer|min:1',
        ]);

        $order = $this->orderService->checkoutOrder(
            $id,
            $validated['items'],
            $validated['merged_tables'] ?? null,
            $validated['order_note'] ?? null,
            $validated['guest_count'] ?? null
        );

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

    // [WHY] Fetch completed orders for the History panel with optional pagination limit.
    public function history(Request $request)
    {
        $limit = $request->input('limit', 20);
        $orders = $this->orderService->getHistory($limit);

        return response()->json([
            'data' => $orders,
            'message' => 'Success',
            'errors' => null
        ]);
    }

    public function reopen($id)
    {
        try {
            $order = $this->orderService->reopenOrder($id);
            return response()->json([
                'data' => $order,
                'message' => 'Order reopened successfully',
                'errors' => null
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'data' => null,
                'message' => $e->getMessage(),
                'errors' => 'Reopen failed'
            ], 400);
        }
    }

    /**
     * updatePayment
     * [WHY] Permite correcting payment details for historical bills without reopening the order.
     * [RULE] Propagates changes to all orders in a group reservation or merged set.
     */
    public function updatePayment(Request $request, $id)
    {
        $validated = $request->validate([
            'payment_method' => 'string|in:cash,bank,card,debt',
            'discount_type' => 'nullable|string|in:fixed,percent',
            'discount_value' => 'nullable|numeric|min:0',
            'cashier_note' => 'nullable|string|max:255'
        ]);

        $order = $this->orderService->updatePayment($id, $validated);

        return response()->json([
            'data' => $order,
            'message' => 'Payment updated successfully',
            'errors' => null
        ]);
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

    // [WHY] Dedicated endpoint to save the order-level staff note without requiring a full re-checkout.
    public function updateOrderNote(Request $request, $id)
    {
        $validated = $request->validate([
            'order_note' => 'nullable|string|max:500'
        ]);

        $order = $this->orderService->updateOrderNote($id, $validated['order_note'] ?? '');

        return response()->json([
            'data' => $order,
            'message' => 'Order note updated successfully',
            'errors' => null
        ]);
    }

    public function updateGuestCount(Request $request, $id)
    {
        $validated = $request->validate([
            'guest_count' => 'required|integer|min:1'
        ]);

        $order = $this->orderService->updateGuestCount($id, $validated['guest_count']);

        return response()->json([
            'data' => $order,
            'message' => 'Guest count updated successfully',
            'errors' => null
        ]);
    }
}
