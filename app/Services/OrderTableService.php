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
            // [WHY] Check if the destination table already has an active order to trigger merge
            $destinationOrder = Order::where('table_id', $newTableId)
                ->whereIn('status', ['pending', 'processing', 'draft'])
                ->where('id', '!=', $order->id)
                ->first();

            if ($destinationOrder) {
                // --- TABLE MERGE FLOW ---
                
                // 1. Transfer/merge all items from source order to destination order
                $sourceItems = $order->items()->get();
                foreach ($sourceItems as $sourceItem) {
                    $match = $destinationOrder->items()
                        ->where(function ($q) use ($sourceItem) {
                            if (is_null($sourceItem->product_id)) {
                                $q->whereNull('product_id')->where('name', $sourceItem->name);
                            } else {
                                $q->where('product_id', $sourceItem->product_id);
                            }
                        })
                        ->where('price', $sourceItem->price)
                        ->where('discount', $sourceItem->discount)
                        ->where('discount_type', $sourceItem->discount_type)
                        ->where('note', $sourceItem->note)
                        ->where('status', $sourceItem->status)
                        ->first();

                    if ($match) {
                        // [WHY] Increment quantity of identical existing items to avoid duplicates
                        $match->increment('quantity', $sourceItem->quantity);
                        $sourceItem->delete();
                    } else {
                        // [WHY] Re-assign the unique item to the destination order
                        $sourceItem->update([
                            'order_id' => $destinationOrder->id,
                            'table_id' => $newTableId
                        ]);
                    }
                }

                // 2. Combine guest count, notes, and statuses
                $destinationOrder->guest_count += $order->guest_count;

                if ($order->order_note) {
                    if ($destinationOrder->order_note) {
                        $destinationOrder->order_note .= " | " . $order->order_note;
                    } else {
                        $destinationOrder->order_note = $order->order_note;
                    }
                }

                // [WHY] Status priority: processing > pending > draft
                $statusPriority = ['processing' => 3, 'pending' => 2, 'draft' => 1];
                $sourcePriority = $statusPriority[$order->status] ?? 0;
                $destPriority = $statusPriority[$destinationOrder->status] ?? 0;
                if ($sourcePriority > $destPriority) {
                    $destinationOrder->status = $order->status;
                }

                if (!$destinationOrder->user_id) {
                    $destinationOrder->user_id = $order->user_id;
                }

                if ($order->reservation_id && !$destinationOrder->reservation_id) {
                    $destinationOrder->reservation_id = $order->reservation_id;
                }

                // 3. Consolidate merged_tables string, removing Table A since it becomes empty/available
                $allTableIds = collect();
                $addTables = function ($o) use ($allTableIds) {
                    if ($o->merged_tables) {
                        foreach (explode('-', $o->merged_tables) as $id) {
                            if (is_numeric($id)) $allTableIds->push((int)$id);
                        }
                    } else {
                        $allTableIds->push((int)$o->table_id);
                    }
                };
                $addTables($order);
                $addTables($destinationOrder);
                
                $allTableIds = $allTableIds->reject(fn($id) => $id == $oldTableId)->unique()->sort()->values();
                if ($allTableIds->count() > 1) {
                    $destinationOrder->merged_tables = $allTableIds->implode('-');
                } else {
                    $destinationOrder->merged_tables = null;
                }

                // 4. Recalculate total_price for destination order
                $newTotalPrice = 0;
                foreach ($destinationOrder->items()->get() as $item) {
                    $itemGross = $item->price * $item->quantity;
                    $itemDiscountAmount = 0;
                    if ($item->discount > 0) {
                        if ($item->discount_type === 'percent') {
                            $itemDiscountAmount = ($itemGross * $item->discount) / 100;
                        } else {
                            $itemDiscountAmount = $item->discount * $item->quantity;
                        }
                    }
                    $newTotalPrice += ($itemGross - $itemDiscountAmount);
                }
                $destinationOrder->total_price = $newTotalPrice;
                $destinationOrder->save();

                // 5. Delete source order as all its content has been merged
                $order->delete();

                // 6. Update table statuses (Destination becomes busy, Source becomes empty if no active orders remain)
                Table::where('id', $newTableId)->update(['status' => 'busy']);
                if ($oldTableId) {
                    $stillBusy = Order::where('table_id', $oldTableId)
                        ->whereIn('status', ['pending', 'processing', 'draft'])
                        ->exists();

                    if (!$stillBusy) {
                        Table::where('id', $oldTableId)->update(['status' => 'empty']);
                    }
                }

                return $destinationOrder;

            } else {
                // --- SIMPLE MOVE FLOW ---
                $order->update(['table_id' => $newTableId]);
                $order->items()->update(['table_id' => $newTableId]);

                // Update new table status
                Table::where('id', $newTableId)->update(['status' => 'busy']);

                // Update old table status ONLY if no other active orders remain
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

        $result->load(['items.product:id,name,name_vi,price,type', 'table:id,name']);

        try {
            broadcast(new OrderUpdated($result, 'order_updated'));
            
            // [WHY] Broadcast old table A order removal to update frontend clients instantly
            if ($result->id != $orderId) {
                $deletedOrderRepresentation = clone $order;
                $deletedOrderRepresentation->table_id = $oldTableId;
                $deletedOrderRepresentation->status = 'cancelled';
                broadcast(new OrderUpdated($deletedOrderRepresentation, 'order_updated'));
            }
        } catch (\Exception $e) {
            Log::error('Broadcast failed during table update: ' . $e->getMessage());
        }

        return $result;
    }
}
