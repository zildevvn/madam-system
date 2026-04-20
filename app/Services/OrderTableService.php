<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Table;
use App\Events\OrderUpdated;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class OrderTableService
{
    // [WHY] Transfer order from one table to another
    // [RULE] Correctly updates both old and new table statuses
    public function updateTable($orderId, $newTableId)
    {
        $order = Order::findOrFail($orderId);
        $oldTableId = $order->table_id;

        $result = DB::transaction(function () use ($order, $newTableId, $oldTableId) {
            $order->update(['table_id' => $newTableId]);

            // [WHY] Update new table status
            Table::where('id', $newTableId)->update(['status' => 'busy']);

            // [WHY] Update old table status ONLY if no other active orders remain
            if ($oldTableId) {
                $stillBusy = Order::where('table_id', $oldTableId)
                    ->whereIn('status', ['pending', 'processing', 'draft'])
                    ->where('id', '!=', $order->id)
                    ->exists();

                if (!$stillBusy) {
                    Table::where('id', $oldTableId)->update(['status' => 'empty']);
                }
            }

            return $order;
        });

        $result->load(['items.product:id,name,price,type', 'table:id,name']);

        try {
            broadcast(new OrderUpdated($result, 'order_updated'));
        } catch (\Exception $e) {
            Log::error('Broadcast failed during table update: ' . $e->getMessage());
        }

        return $result;
    }
}
