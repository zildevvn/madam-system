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
        $targetOrder = null;

        $result = DB::transaction(function () use ($order, $newTableId, $oldTableId, &$targetOrder) {
            // [WHY] Check if target table B already has an active order
            $targetOrder = Order::where('table_id', $newTableId)
                ->whereIn('status', ['draft', 'pending', 'processing'])
                ->where('id', '!=', $order->id)
                ->orderBy('id', 'asc')
                ->first();

            if ($targetOrder) {
                // --- MERGE FLOW ---

                // 1. Move all order items of source order to the target order
                \App\Models\OrderItem::where('order_id', $order->id)->update([
                    'order_id' => $targetOrder->id,
                    'table_id' => $newTableId
                ]);

                // 2. Reassign any child orders of the source order to the target order
                Order::where('parent_order_id', $order->id)->update([
                    'parent_order_id' => $targetOrder->id,
                    'table_id' => $newTableId
                ]);

                // 3. Combine guest counts and notes
                $targetOrder->guest_count = ($targetOrder->guest_count ?? 1) + ($order->guest_count ?? 1);
                
                if ($order->order_note) {
                    $targetOrder->order_note = trim(($targetOrder->order_note ? $targetOrder->order_note . ' | ' : '') . $order->order_note);
                }

                // 4. Combine printed states and counts
                $targetOrder->is_printed = $targetOrder->is_printed || $order->is_printed;
                $targetOrder->print_count = max($targetOrder->print_count ?? 0, $order->print_count ?? 0);

                // 5. Combine reservation if target doesn't have one but source does
                if (!$targetOrder->reservation_id && $order->reservation_id) {
                    $targetOrder->reservation_id = $order->reservation_id;
                }

                // 6. Recalculate target order totals
                $targetOrder->total_price = \App\Models\OrderItem::where('order_id', $targetOrder->id)->sum(DB::raw('quantity * price'));
                $targetOrder->subtotal = $targetOrder->total_price;

                // 7. Update merged tables string for the target order
                // Table A (oldTableId) is now empty and should be removed from the merged tables group.
                // Table B (newTableId) is included.
                $involvedTables = [];
                if ($order->merged_tables) {
                    $involvedTables = array_merge($involvedTables, explode('-', $order->merged_tables));
                }
                if ($targetOrder->merged_tables) {
                    $involvedTables = array_merge($involvedTables, explode('-', $targetOrder->merged_tables));
                } else {
                    $involvedTables[] = $newTableId;
                }
                $involvedTables[] = $newTableId;

                // Remove the old table ID since it becomes empty/available
                $involvedTables = array_filter($involvedTables, function($id) use ($oldTableId) {
                    return intval($id) !== intval($oldTableId);
                });

                $involvedTables = array_unique(array_filter(array_map('intval', $involvedTables)));
                sort($involvedTables);

                $newMergedTablesString = count($involvedTables) > 1 ? implode('-', $involvedTables) : null;
                $targetOrder->merged_tables = $newMergedTablesString;
                $targetOrder->save();

                // 8. Update any secondary orders in the new merge group to match the new merged tables string
                if ($newMergedTablesString) {
                    $ids = explode('-', $newMergedTablesString);
                    Order::whereIn('table_id', $ids)
                        ->where('id', '!=', $targetOrder->id)
                        ->whereIn('status', ['draft', 'pending', 'processing'])
                        ->update(['merged_tables' => $newMergedTablesString, 'total_price' => 0]);
                }

                // 9. Cancel or delete the source order so it is no longer active on Table A
                if ($order->status === 'draft') {
                    $order->delete();
                } else {
                    $order->update([
                        'status' => 'cancelled',
                        'total_price' => 0,
                        'subtotal' => 0,
                        'merged_tables' => null
                    ]);
                }

                // 10. Update table statuses
                // Update target tables to busy
                if ($newMergedTablesString) {
                    Table::whereIn('id', explode('-', $newMergedTablesString))->update(['status' => 'busy']);
                } else {
                    Table::where('id', $newTableId)->update(['status' => 'busy']);
                }

                // Free up Table A if no other active orders remain
                if ($oldTableId) {
                    $stillBusy = Order::where('table_id', $oldTableId)
                        ->whereIn('status', ['draft', 'pending', 'processing'])
                        ->where('id', '!=', $order->id)
                        ->exists();

                    if (!$stillBusy) {
                        Table::where('id', $oldTableId)->update(['status' => 'empty']);
                    }
                }

                return $targetOrder;
            } else {
                // --- REGULAR MOVE FLOW ---
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
            }
        });

        // Broadcast source order update first if a merge happened so other clients sync Table A status
        if ($targetOrder && $order->exists) {
            try {
                $order->load(['items.product:id,name,price,type', 'table:id,name']);
                broadcast(new OrderUpdated($order, 'order_updated'));
            } catch (\Exception $e) {
                Log::error('Broadcast failed for secondary order during merge: ' . $e->getMessage());
            }
        }

        $result->load(['items.product:id,name,price,type', 'table:id,name']);

        try {
            broadcast(new OrderUpdated($result, 'order_updated'));
        } catch (\Exception $e) {
            Log::error('Broadcast failed during table update: ' . $e->getMessage());
        }

        return $result;
    }
}
