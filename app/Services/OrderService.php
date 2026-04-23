<?php

namespace App\Services;

use App\Models\Product;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Table;
use App\Events\OrderUpdated;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class OrderService
{
    protected $paymentService;
    protected $tableService;

    // [WHY] Initialize with specialized sub-services for modularity.
    public function __construct(OrderPaymentService $paymentService, OrderTableService $tableService)
    {
        $this->paymentService = $paymentService;
        $this->tableService = $tableService;
    }

    // [WHY] Get active order to display on tablet/pos
    // [RULE] Eager load only required fields for performance
    public function getActiveOrder($tableId)
    {
        return Order::where('table_id', $tableId)
            ->whereIn('status', ['draft', 'pending', 'processing'])
            ->where(function ($query) {
                $query->whereDoesntHave('reservation')
                    ->orWhereHas('reservation', function ($q) {
                        $q->where('type', '!=', 'group');
                    });
            })
            ->with([
                'items.product' => function ($query) {
                    $query->select('id', 'name', 'price', 'type');
                },
                'table:id,name',
                'server:id,name',
                'cashier:id,name'
            ])
            ->latest()
            ->first();
    }

    // [WHY] Fetch full details for a specific order
    public function getOrder($id)
    {
        return Order::with([
            'items.product' => function ($query) {
                $query->select('id', 'name', 'price', 'type');
            },
            'table:id,name',
            'server:id,name',
            'cashier:id,name'
        ])->findOrFail($id);
    }

    // [WHY] Delete orders that were never finalized
    public function cancelOrder($id)
    {
        $order = Order::find($id);
        if ($order && $order->status === 'draft') {
            $order->delete();
            return true;
        }
        return false;
    }

    // [WHY] Cleanup abandoned draft orders to keep the system tidy
    // [RULE] Drafts older than 10 minutes are considered abandoned
    public function cleanupDrafts()
    {
        Order::where('status', 'draft')
            ->where('created_at', '<', now()->subMinutes(10))
            ->delete();
    }

    // [WHY] Initialize a new order session
    public function createOrder(array $data)
    {
        $order = new Order();
        $order->table_id = $data['table_id'] ?? null;
        $order->user_id = $data['user_id'] ?? null;
        $order->merged_tables = $data['merged_tables'] ?? null;
        $order->order_type = $data['order_type'] ?? 'dine-in';
        $order->status = 'draft';
        $order->total_price = 0;
        $order->save();

        return $order->load([
            'items.product:id,name,price',
            'table:id,name',
            'server:id,name',
            'cashier:id,name'
        ]);
    }

    // [WHY] Submit kitchen order and sync items
    public function checkoutOrder($orderId, array $items, $mergedTables = null)
    {
        $result = DB::transaction(function () use ($orderId, $items, $mergedTables) {
            $order = Order::findOrFail($orderId);
            $totalPrice = 0;

            $existingItems = OrderItem::where('order_id', $orderId)
                ->get()
                ->keyBy('product_id');

            $productIds = collect($items)->pluck('product_id')->toArray();
            $productTypes = Product::whereIn('id', $productIds)->pluck('type', 'id');

            foreach ($items as $itemData) {
                $productId = $itemData['product_id'];
                $orderItem = $existingItems->get($productId);
                $productType = $productTypes->get($productId);

                if (!$productType) {
                    Log::warning("Order item checkout: Product ID {$productId} has no type defined. Defaulting to 'food'.");
                    $productType = 'food';
                }

                if ($orderItem) {
                    $orderItem->quantity = $itemData['quantity'];
                    $orderItem->table_id = $itemData['table_id'] ?? $order->table_id;
                    if (array_key_exists('note', $itemData)) {
                        $orderItem->note = $itemData['note'];
                    }
                    $orderItem->save();
                } else {
                    $orderItem = OrderItem::create([
                        'order_id' => $orderId,
                        'product_id' => $productId,
                        'table_id' => $itemData['table_id'] ?? $order->table_id,
                        'quantity' => $itemData['quantity'],
                        'price' => $itemData['price'],
                        'note' => $itemData['note'] ?? null,
                        'status' => 'pending'
                    ]);
                }

                $totalPrice += ($orderItem->price * $orderItem->quantity);
            }

            $itemProductIds = collect($items)->pluck('product_id')->toArray();
            OrderItem::where('order_id', $orderId)
                ->whereNotIn('product_id', $itemProductIds)
                ->delete();

            $wasDraft = $order->status === 'draft';
            $order->update([
                'total_price' => $totalPrice,
                'status' => 'pending',
                'merged_tables' => $mergedTables ?? $order->merged_tables
            ]);

            if ($order->table_id) {
                Table::where('id', $order->table_id)->update(['status' => 'busy']);
            }

            return ['order' => $order, 'wasDraft' => $wasDraft];
        });

        try {
            $orderObj = $result['order'];
            $orderObj->load(['items.product:id,name,price,type', 'table:id,name', 'server:id,name', 'cashier:id,name']);
            broadcast(new OrderUpdated($orderObj, $result['wasDraft'] ? 'order_created' : 'order_updated'));
        } catch (\Exception $e) {
            Log::error('Broadcast failed during checkout: ' . $e->getMessage());
        }

        return $orderObj;
    }

    // [WHY] Update progress of a specific item
    public function updateItemStatus($itemId, $status)
    {
        $item = OrderItem::findOrFail($itemId);
        $item->status = $status;
        $item->save();

        $order = $item->order;
        $order->load([
            'items.product:id,name,price',
            'table:id,name',
            'server:id,name',
            'cashier:id,name'
        ]);

        try {
            broadcast(new OrderUpdated($order, 'item_status_updated'));
        } catch (\Exception $e) {
            Log::error('Broadcast failed during item status update: ' . $e->getMessage());
        }

        return $order;
    }

    // --- Delegated Methods ---

    public function completeOrder($orderId, $data)
    {
        return $this->paymentService->completeOrder($orderId, $data);
    }

    public function reopenOrder($orderId)
    {
        return $this->paymentService->reopenOrder($orderId);
    }

    public function updatePayment($orderId, $data)
    {
        return $this->paymentService->updatePayment($orderId, $data);
    }

    public function getHistory($limit = 20)
    {
        return $this->paymentService->getHistory($limit);
    }

    public function updateTable($orderId, $newTableId)
    {
        return $this->tableService->updateTable($orderId, $newTableId);
    }
}