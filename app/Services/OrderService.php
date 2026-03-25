<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderItem;
use App\Events\OrderUpdated;
use Illuminate\Support\Facades\DB;

class OrderService
{
    public function getActiveOrder($tableId)
    {
        return Order::where('table_id', $tableId)
            ->whereIn('status', ['draft', 'pending', 'processing'])
            ->with(['items.product', 'table'])
            ->first();
    }

    public function cancelOrder($id)
    {
        $order = Order::find($id);
        if ($order && $order->status === 'draft') {
            $order->delete();
            return true;
        }
        return false;
    }

    public function cleanupDrafts()
    {
        Order::where('status', 'draft')
            ->where('created_at', '<', now()->subMinutes(10))
            ->delete();
    }

    public function createOrder(array $data)
    {
        $order = new Order();
        $order->table_id = $data['table_id'] ?? null;
        $order->order_type = $data['order_type'] ?? 'dine-in';
        $order->status = 'draft';
        $order->total_price = 0;
        $order->save();

        return $order->load('items.product', 'table');
    }

    public function checkoutOrder($orderId, array $items)
    {
        return DB::transaction(function () use ($orderId, $items) {
            $order = Order::findOrFail($orderId);
            $totalPrice = $order->total_price;

            foreach ($items as $itemData) {
                // If item exists, we could update, but for simplicity we append or update matching product_id
                $orderItem = OrderItem::where('order_id', $orderId)
                    ->where('product_id', $itemData['product_id'])
                    ->first();

                if ($orderItem) {
                    $orderItem->quantity += $itemData['quantity'];
                    if (array_key_exists('note', $itemData)) {
                        $orderItem->note = $itemData['note'];
                    }
                    $orderItem->save();
                    $totalPrice += ($itemData['price'] * $itemData['quantity']);
                } else {
                    OrderItem::create([
                        'order_id' => $orderId,
                        'product_id' => $itemData['product_id'],
                        'quantity' => $itemData['quantity'],
                        'price' => $itemData['price'],
                        'note' => $itemData['note'] ?? null,
                        'status' => 'pending'
                    ]);
                    $totalPrice += ($itemData['price'] * $itemData['quantity']);
                }
            }

            $order->update([
                'total_price' => $totalPrice,
                'status' => 'pending'
            ]);

            if ($order->table_id) {
                \App\Models\Table::where('id', $order->table_id)->update(['status' => 'busy']);
            }

            $order->load(['items.product', 'table']);

            // Broadcast the real-time event
            broadcast(new OrderUpdated($order, 'checkout'));

            return $order;
        });
    }
}
