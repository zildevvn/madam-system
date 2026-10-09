<?php

namespace App\Http\Controllers\API\External;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    /**
     * List orders for external clients.
     *
     * Supported filters:
     * - search
     * - status
     * - order_type
     * - table_id
     * - reservation_id
     * - parent_order_id
     * - user_id
     * - cashier_id
     * - date_from
     * - date_to
     * - per_page
     * - page
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],

            'status' => [
                'nullable',
                'in:draft,pending,processing,completed,cancelled',
            ],

            'order_type' => [
                'nullable',
                'in:dine-in,takeout',
            ],

            'table_id' => [
                'nullable',
                'integer',
                'min:1',
            ],

            'reservation_id' => [
                'nullable',
                'integer',
                'min:1',
            ],

            'parent_order_id' => [
                'nullable',
                'integer',
                'min:1',
            ],

            'user_id' => [
                'nullable',
                'integer',
                'min:1',
            ],

            'cashier_id' => [
                'nullable',
                'integer',
                'min:1',
            ],

            'date_from' => [
                'nullable',
                'date',
            ],

            'date_to' => [
                'nullable',
                'date',
                'after_or_equal:date_from',
            ],

            'per_page' => [
                'nullable',
                'integer',
                'min:1',
                'max:100',
            ],

            'page' => [
                'nullable',
                'integer',
                'min:1',
            ],
        ]);

        $perPage = $validated['per_page'] ?? 20;

        $query = Order::query()
            ->with([
                'items',
                'payments',
                'table:id,name',
                'reservation:id,lead_name,phone',
                'parentOrder:id,parent_order_id,status',
                'childOrders:id,parent_order_id,status',
            ])
            ->orderByDesc('id');

        /*
         * Search
         *
         * Searches:
         * - order ID
         * - cashier note
         * - order note
         * - table name
         */
        if (!empty($validated['search'])) {
            $search = $validated['search'];

            $query->where(function ($q) use ($search) {
                $q->where('orders.id', 'like', "%{$search}%")
                    ->orWhere('orders.cashier_note', 'like', "%{$search}%")
                    ->orWhere('orders.order_note', 'like', "%{$search}%")
                    ->orWhereHas('table', function ($tableQuery) use ($search) {
                        $tableQuery->where('name', 'like', "%{$search}%");
                    });
            });
        }

        if (isset($validated['status'])) {
            $query->where('status', $validated['status']);
        }

        if (isset($validated['order_type'])) {
            $query->where('order_type', $validated['order_type']);
        }

        if (isset($validated['table_id'])) {
            $query->where('table_id', $validated['table_id']);
        }

        if (isset($validated['reservation_id'])) {
            $query->where('reservation_id', $validated['reservation_id']);
        }

        if (isset($validated['parent_order_id'])) {
            $query->where('parent_order_id', $validated['parent_order_id']);
        }

        if (isset($validated['user_id'])) {
            $query->where('user_id', $validated['user_id']);
        }

        if (isset($validated['cashier_id'])) {
            $query->where('cashier_id', $validated['cashier_id']);
        }

        if (isset($validated['date_from'])) {
            $query->whereDate('created_at', '>=', $validated['date_from']);
        }

        if (isset($validated['date_to'])) {
            $query->whereDate('created_at', '<=', $validated['date_to']);
        }

        $orders = $query->paginate(
            $perPage,
            ['*'],
            'page',
            $validated['page'] ?? 1
        );

        return response()->json([
            'success' => true,
            'data' => $orders->items(),
            'meta' => [
                'current_page' => $orders->currentPage(),
                'per_page' => $orders->perPage(),
                'total' => $orders->total(),
                'last_page' => $orders->lastPage(),
                'from' => $orders->firstItem(),
                'to' => $orders->lastItem(),
                'has_more_pages' => $orders->hasMorePages(),
            ],
        ]);
    }

    /**
     * Get a single order.
     */
    public function show(int $id): JsonResponse
    {
        $order = Order::query()
            ->with([
                'items',
                'payments',
                'table:id,name',
                'reservation',
                'parentOrder',
                'childOrders',
            ])
            ->find($id);

        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Order not found.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $order,
        ]);
    }

    /**
     * Hard delete a single order.
     *
     * Database handles:
     * - order_items -> CASCADE
     * - order_payments -> CASCADE
     * - child orders -> CASCADE
     * - reservation -> remains, order.reservation_id -> NULL
     */
    public function destroy(int $id): JsonResponse
    {
        $order = Order::find($id);

        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Order not found.',
            ], 404);
        }

        DB::transaction(function () use ($order) {
            $order->delete();
        });

        return response()->json([
            'success' => true,
            'message' => 'Order deleted successfully.',
            'data' => [
                'deleted_id' => $id,
            ],
        ]);
    }

    /**
     * Hard delete multiple orders.
     *
     * Body:
     * {
     *     "ids": [123, 124, 125]
     * }
     */
    public function bulkDestroy(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => [
                'required',
                'array',
                'min:1',
                'max:100',
            ],

            'ids.*' => [
                'integer',
                'distinct',
                'min:1',
            ],
        ]);

        $ids = $validated['ids'];

        $existingIds = Order::query()
            ->whereIn('id', $ids)
            ->pluck('id')
            ->map(fn($id) => (int) $id)
            ->values()
            ->all();

        if (empty($existingIds)) {
            return response()->json([
                'success' => false,
                'message' => 'No matching orders found.',
            ], 404);
        }

        DB::transaction(function () use ($existingIds) {
            Order::query()
                ->whereIn('id', $existingIds)
                ->delete();
        });

        $notFoundIds = array_values(
            array_diff($ids, $existingIds)
        );

        return response()->json([
            'success' => true,
            'message' => 'Orders deleted successfully.',
            'data' => [
                'deleted_ids' => $existingIds,
                'deleted_count' => count($existingIds),
                'not_found_ids' => $notFoundIds,
            ],
        ]);
    }
}