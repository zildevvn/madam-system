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

        $perPage = $filters['per_page'] ?? 20;
        $page = $filters['page'] ?? 1;


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
     */
    public function destroy(Order $order): JsonResponse
    {
        DB::transaction(function () use ($order) {
            $order->delete();
        });

        return response()->json(
            null,
            204
        );
    }

    /**
     * DELETE /api/v1/orders
     *
     * Body:
     * {
     *     "ids": [1, 2, 3]
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
            ->map(
                fn($id) => (int) $id
            )
            ->values()
            ->all();

        if (empty($existingIds)) {
            return response()->json([
                'message' => 'No matching orders found.',
            ], 404);
        }

        DB::transaction(function () use ($existingIds) {
            Order::query()
                ->whereIn('id', $existingIds)
                ->delete();
        });

        return response()->json([
            'deleted_ids' => $existingIds,
            'deleted_count' => count($existingIds),
            'not_found_ids' => array_values(
                array_diff(
                    $ids,
                    $existingIds
                )
            ),
        ]);
    }
}