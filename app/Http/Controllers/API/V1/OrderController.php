<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\API\V1\OrderIndexRequest;
use App\Http\Resources\API\V1\OrderResource;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    /**
     * GET /api/v1/orders
     */
    public function index(
        OrderIndexRequest $request
    ): AnonymousResourceCollection {
        $filters = $request->validated();

        $perPage = $filters['per_page'] ?? 100;
        $page = $filters['page'] ?? 1;


        $query = Order::query()
            ->where('payment_method', 'cash')
            ->with([
                'items',
                'payments',
                'table:id,name',
                'reservation:id,lead_name,phone',
                'parentOrder:id,parent_order_id,status',
                'childOrders:id,parent_order_id,status',
            ])
            ->orderByDesc('id');

        if (isset($filters['order_id'])) {
            $query->where('orders.id', $filters['order_id']);
        }

        /*
         * Search
         */
        if (!empty($filters['search'])) {
            $search = $filters['search'];

            $query->where(function ($query) use ($search) {
                $query
                    ->where('orders.id', 'like', "%{$search}%")
                    ->orWhere(
                        'orders.cashier_note',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'orders.order_note',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhereHas('table', function ($tableQuery) use ($search) {
                        $tableQuery->where(
                            'name',
                            'like',
                            "%{$search}%"
                        );
                    });
            });
        }

        /*
         * Filters
         */
        if (isset($filters['status'])) {
            $query->where(
                'status',
                $filters['status']
            );
        }

        if (isset($filters['order_type'])) {
            $query->where(
                'order_type',
                $filters['order_type']
            );
        }

        if (isset($filters['table_id'])) {
            $query->where(
                'table_id',
                $filters['table_id']
            );
        }

        if (isset($filters['reservation_id'])) {
            $query->where(
                'reservation_id',
                $filters['reservation_id']
            );
        }

        if (isset($filters['parent_order_id'])) {
            $query->where(
                'parent_order_id',
                $filters['parent_order_id']
            );
        }

        if (isset($filters['user_id'])) {
            $query->where(
                'user_id',
                $filters['user_id']
            );
        }

        if (isset($filters['cashier_id'])) {
            $query->where(
                'cashier_id',
                $filters['cashier_id']
            );
        }

        /*
         * Date range
         */
        if (isset($filters['date_from'])) {
            $query->whereDate(
                'created_at',
                '>=',
                $filters['date_from']
            );
        }

        if (isset($filters['date_to'])) {
            $query->whereDate(
                'created_at',
                '<=',
                $filters['date_to']
            );
        }

        $orders = $query->paginate(
            $perPage,
            ['*'],
            'page',
            $page
        );

        return OrderResource::collection($orders);
    }

    /**
     * GET /api/v1/orders/{order}
     */
    public function show(Order $order): OrderResource
    {
        $order->load([
            'items',
            'payments',
            'table:id,name',
            'reservation',
            'parentOrder',
            'childOrders',
        ]);

        return new OrderResource($order);
    }

    /**
     * DELETE /api/v1/orders/{order}
     * Chỉ cho phép xoá order cash qua External API.
     */
    public function destroy(Order $order): JsonResponse
    {
        abort_unless($order->payment_method === 'cash', 404);

        DB::transaction(function () use ($order) {
            $this->deleteOrdersSafely([$order->id]);
        });

        return response()->json(null, 204);
    }


    /**
     * DELETE /api/v1/orders
     *
     * Xoá order đã chọn:
     * { "ids": [101, 102], "date_from": "2026-10-01", "date_to": "2026-10-07" }
     *
     * Xoá ngẫu nhiên 30%:
     * { "random_percent": 30, "date_from": "2026-10-01", "date_to": "2026-10-07" }
     */
    public function bulkDestroy(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => [
                'sometimes',
                'required_without:random_percent',
                'array',
                'min:1',
                'max:100',
            ],
            'ids.*' => [
                'integer',
                'distinct',
                'min:1',
            ],
            'random_percent' => [
                'sometimes',
                'required_without:ids',
                'integer',
                'in:30',
            ],
            'order_id' => ['nullable', 'integer', 'min:1'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
        ]);

        // Random deletion must be scoped to an active filter.
        if (isset($validated['random_percent'])) {
            $hasOrderId = !empty($validated['order_id']);
            $hasDateRange = !empty($validated['date_from'])
                && !empty($validated['date_to']);

            if (!$hasOrderId && !$hasDateRange) {
                return response()->json([
                    'message' => 'An Order ID or date range is required.',
                ], 422);
            }

            $matchingQuery = $this->filteredCashOrders($validated);
            $matchingCount = (clone $matchingQuery)->count();

            if ($matchingCount === 0) {
                return response()->json([
                    'deleted_ids' => [],
                    'deleted_count' => 0,
                    'matching_count' => 0,
                    'message' => 'No matching cash orders found.',
                ]);
            }

            // Round to the nearest whole order; delete at least one if matches exist.
            $deleteCount = max(
                1,
                (int) round($matchingCount * 0.30)
            );

            $ids = (clone $matchingQuery)
                ->inRandomOrder()
                ->limit($deleteCount)
                ->pluck('id')
                ->all();
        } else {
            $ids = $validated['ids'];

            $matchingQuery = $this->filteredCashOrders($validated)
                ->whereIn('orders.id', $ids);

            $ids = $matchingQuery->pluck('orders.id')->all();

            if (empty($ids)) {
                return response()->json([
                    'deleted_ids' => [],
                    'deleted_count' => 0,
                    'not_found_ids' => $validated['ids'],
                    'message' => 'No matching cash orders found.',
                ], 404);
            }
        }

        DB::transaction(function () use ($ids) {
            $this->deleteOrdersSafely($ids);
        });

        $deletedIds = array_map('intval', $ids);

        return response()->json([
            'deleted_ids' => $deletedIds,
            'deleted_count' => count($deletedIds),
            'matching_count' => isset($matchingCount)
                ? $matchingCount
                : null,
            'not_found_ids' => isset($validated['ids'])
                ? array_values(array_diff(
                    $validated['ids'],
                    $deletedIds
                ))
                : [],
        ]);
    }


    /**
     * Build the cash-order query using the active WordPress filters.
     */
    private function filteredCashOrders(array $filters)
    {
        $query = Order::query()
            ->where('orders.payment_method', 'cash');

        if (!empty($filters['order_id'])) {
            $query->where('orders.id', $filters['order_id']);
        }

        if (!empty($filters['date_from'])) {
            $query->whereDate(
                'orders.created_at',
                '>=',
                $filters['date_from']
            );
        }

        if (!empty($filters['date_to'])) {
            $query->whereDate(
                'orders.created_at',
                '<=',
                $filters['date_to']
            );
        }

        return $query;
    }

    /**
     * Delete order records and their direct items/payments.
     * Preserve unselected child orders by detaching them from selected parents.
     */
    private function deleteOrdersSafely(array $ids): void
    {
        $orders = Order::query()
            ->whereIn('id', $ids)
            ->where('payment_method', 'cash')
            ->get();

        $existingIds = $orders->modelKeys();

        if (empty($existingIds)) {
            return;
        }

        // Preserve children that are not part of this deletion request.
        Order::query()
            ->whereIn('parent_order_id', $existingIds)
            ->whereNotIn('id', $existingIds)
            ->update(['parent_order_id' => null]);

        // Break parent references among the orders being deleted.
        Order::query()
            ->whereIn('id', $existingIds)
            ->update(['parent_order_id' => null]);

        foreach ($orders as $order) {
            $order->items()->delete();
            $order->payments()->delete();
        }

        foreach ($orders as $order) {
            $order->delete();
        }
    }
}