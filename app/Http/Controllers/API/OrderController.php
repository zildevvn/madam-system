<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Services\OrderService;
use App\Services\PrintService;
use App\Models\Order;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    use \App\Traits\ApiResponse;
    use \App\Traits\AuthenticatesStatelessUser;

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
        return $this->success($order);
    }

    public function show($id)
    {
        $order = $this->orderService->getOrder($id);
        return $this->success($order);
    }

    public function store(\App\Http\Requests\StoreOrderRequest $request)
    {
        $validated = $request->validated();
        // [WHY] Auth session is stateless for this app (no Auth::login on the login endpoint).
        // The frontend sends the logged-in user's ID explicitly in the request body.
        $currentUser = $this->getCurrentUser($request);
        $userId = $currentUser ? $currentUser->id : ($validated['user_id'] ?? $request->header('X-User-Id'));
        
        $data = array_merge($validated, ['user_id' => $userId]);
        $order = $this->orderService->createOrder($data);

        return $this->success($order, 'Order created successfully', 201);
    }

    /**
     * complete
     * [WHY] Finalizes an order, records payment details, and releases the table.
     * [RULE] Status changes to 'completed'. Table status changes to 'available'.
     */
    public function complete(\App\Http\Requests\CompleteOrderRequest $request, $id)
    {
        $validated = $request->validated();
        
        $currentUser = $this->getCurrentUser($request);
        $cashierId = $currentUser ? $currentUser->id : $request->header('X-User-Id');
        
        $data = array_merge($validated, ['cashier_id' => $cashierId]);
        $order = $this->orderService->completeOrder($id, $data);

        return $this->success($order, 'Order completed successfully');
    }

    public function checkout(\App\Http\Requests\CheckoutOrderRequest $request, $id)
    {
        $validated = $request->validated();
        // [WHY] Auth session is stateless for this app (no Auth::login on the login endpoint).
        // The frontend sends the logged-in user's ID explicitly in the request body.
        $currentUser = $this->getCurrentUser($request);
        $userId = $currentUser ? $currentUser->id : ($validated['user_id'] ?? $request->header('X-User-Id'));
        
        $order = $this->orderService->checkoutOrder(
            $id,
            $validated['items'],
            $validated['merged_tables'] ?? null,
            $validated['order_note'] ?? null,
            $validated['guest_count'] ?? null,
            $userId
        );

        return $this->success($order, 'Order checkout successful');
    }

    public function updateItemStatus(Request $request, $itemId)
    {
        // \Illuminate\Support\Facades\Gate::authorize('updateItemStatus', Order::class);

        $validated = $request->validate([
            'status' => 'required|string|in:pending,cooking,ready,served',
            'quantity' => 'nullable|integer|min:1'
        ]);

        $item = $this->orderService->updateItemStatus($itemId, $validated['status'], $validated['quantity'] ?? null);

        return $this->success($item, 'Item status updated successfully');
    }

    public function updateTable(Request $request, $id)
    {
        // \Illuminate\Support\Facades\Gate::authorize('manage', Order::class);

        $validated = $request->validate([
            'table_id' => 'required|exists:tables,id'
        ]);

        $order = $this->orderService->updateTable($id, $validated['table_id']);

        return $this->success($order, 'Table updated successfully');
    }

    public function destroy(Request $request, $id)
    {
        // \Illuminate\Support\Facades\Gate::authorize('cancel', Order::findOrFail($id));

        $deleted = $this->orderService->cancelOrder($id, $request->all());

        if ($deleted) {
            return $this->success(null, 'Order cancelled seamlessly');
        }

        return $this->error(
            message: 'Order could not be cancelled or was not draft',
            errors: 'Deletion failed',
            status: 400
        );
    }

    // [WHY] Fetch completed orders for the History panel with optional pagination limit.
    public function history(Request $request)
    {
        $limit = $request->input('limit', 20);
        $date = $request->input('date', null);
        $orders = $this->orderService->getHistory($limit, $date);
        return $this->success($orders);
    }

    public function reopen($id)
    {
        // \Illuminate\Support\Facades\Gate::authorize('reopen', Order::class);

        try {
            $order = $this->orderService->reopenOrder($id);
            return $this->success($order, 'Order reopened successfully');
        } catch (\Exception $e) {
            return $this->error(
                message: $e->getMessage(),
                errors: 'Reopen failed',
                status: 400
            );
        }
    }

    /**
     * updatePayment
     * [WHY] Permite correcting payment details for historical bills without reopening the order.
     * [RULE] Propagates changes to all orders in a group reservation or merged set.
     */
    public function updatePayment(\App\Http\Requests\UpdatePaymentRequest $request, $id)
    {
        $currentUser = $this->getCurrentUser($request);
        if (!$currentUser) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $order = Order::with('payments')->findOrFail($id);

        if ($currentUser->role !== 'admin' && $currentUser->role !== 'accountant') {
            if ($currentUser->role === 'cashier') {
                if ($order->cashier_id != $currentUser->id) {
                    return response()->json([
                        'message' => 'You can only edit payment records for bills originally paid by you.'
                    ], 403);
                }
            } else {
                return response()->json([
                    'message' => 'You do not have permission to edit payment records.'
                ], 403);
            }
        }

        $validated = $request->validated();

        // Capture previous values
        $updatedOrder = $this->orderService->updatePayment($id, $validated);
        $updatedOrder->load('payments');

        return $this->success($updatedOrder, 'Payment updated successfully');
    }


    public function printDrinkBill(Request $request, $id)
    {
        $order = $this->orderService->getOrder($id);
        $title = $request->input('title', '');

        $success = $this->printService->printDrinkBill($order, $title);

        if ($success) {
            return $this->success($success, 'Print job sent successfully');
        }

        return $this->error(
            message: 'Printing failed',
            errors: 'Printer communication error',
            status: 500
        );
    }

    // [WHY] Dedicated endpoint to save the order-level staff note without requiring a full re-checkout.
    public function updateOrderNote(Request $request, $id)
    {
        // \Illuminate\Support\Facades\Gate::authorize('manage', Order::class);

        $validated = $request->validate([
            'order_note' => 'nullable|string|max:500'
        ]);

        $order = $this->orderService->updateOrderNote($id, $validated['order_note'] ?? '');

        return $this->success($order, 'Order note updated successfully');
    }

    public function updateGuestCount(Request $request, $id)
    {
        // \Illuminate\Support\Facades\Gate::authorize('manage', Order::class);

        $validated = $request->validate([
            'guest_count' => 'required|integer|min:1'
        ]);

        $order = $this->orderService->updateGuestCount($id, $validated['guest_count']);

        return $this->success($order, 'Guest count updated successfully');
    }

    public function split(\App\Http\Requests\SplitOrderRequest $request, $id)
    {
        $validated = $request->validated();
        $result = $this->orderService->splitItems($id, $validated['items']);

        return $this->success($result, 'Order split successfully');
    }

    public function markPrinted(Request $request, $id)
    {
        $validated = $request->validate([
            'sibling_order_ids' => 'nullable|array',
            'sibling_order_ids.*' => 'integer'
        ]);

        $siblingOrderIds = $validated['sibling_order_ids'] ?? [];
        $order = $this->orderService->markAsPrinted($id, $siblingOrderIds);

        return $this->success($order, 'Order marked as printed successfully');
    }

    public function mergeBack($id)
    {
        try {
            $result = app(\App\Services\OrderSplitService::class)->mergeBack($id);
            return $this->success($result, 'Order merged back successfully');
        } catch (\Exception $e) {
            return $this->error(
                message: $e->getMessage(),
                errors: 'Merge back failed',
                status: 400
            );
        }
    }
}
