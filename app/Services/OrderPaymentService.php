<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Table;
use App\Models\Reservation;
use App\Events\OrderUpdated;
use App\Events\ReservationUpdated;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class OrderPaymentService
{
    // [WHY] Close order and release tables
    // [RULE] If Merged Tables or Group Reservation, propagates 'completed' status to all sibling orders.
    public function completeOrder($orderId, $data)
    {
        $result = DB::transaction(function () use ($orderId, $data) {
            $order = Order::with('reservation')->findOrFail($orderId);

            $involvedTableIds = $this->getInvolvedTableIds($order);
            $relatedOrders = $this->getRelatedOrders($order, $involvedTableIds, ['pending', 'processing', 'draft'], $data);

            // [CALC] Calculate combined subtotal across all related orders
            $groupSubtotal = $relatedOrders->sum('total_price');
            $discountType = $data['discount_type'] ?? null;
            $discountValue = $data['discount_value'] ?? 0;
            $groupDiscountAmount = 0;

            if ($discountType === 'percent') {
                $groupDiscountAmount = floor(($groupSubtotal * $discountValue) / 100);
            } elseif ($discountType === 'fixed') {
                $groupDiscountAmount = $discountValue;
            }

            $groupDiscountAmount = min($groupSubtotal, $groupDiscountAmount);

            // [WHY] Finalize ALL related orders by distributing the group discount
            $remainingDiscount = $groupDiscountAmount;
            $now = now();
            
            foreach ($relatedOrders as $o) {
                $isPrimary = $o->id == $orderId;
                
                // [WHY] Subtract as much discount as possible from this order's price
                $orderDiscount = min($o->total_price, $remainingDiscount);
                $remainingDiscount -= $orderDiscount;

                $updateData = [
                    'status' => 'completed',
                    'payment_method' => $data['payment_method'] ?? null,
                    'cashier_id' => $data['cashier_id'] ?? null,
                    'cashier_note' => $data['cashier_note'] ?? $o->cashier_note,
                    'subtotal' => $o->total_price,
                    'reservation_id' => $order->reservation_id,
                    'merged_tables' => $order->merged_tables,
                    'discount_type' => $isPrimary ? $discountType : null,
                    'discount_value' => $isPrimary ? $discountValue : 0,
                    'discount_amount' => $isPrimary ? $groupDiscountAmount : 0, // Keep full amount on primary for history
                    'total_price' => $o->total_price - $orderDiscount,
                    'updated_at' => $now,
                ];

                $o->update($updateData);
            }

            // [WHY] Free tables ONLY if no more active orders remain
            foreach ($involvedTableIds as $tId) {
                $stillBusy = Order::where('table_id', $tId)
                    ->whereIn('status', ['draft', 'pending', 'processing'])
                    ->exists();

                if (!$stillBusy) {
                    Table::where('id', $tId)->update(['status' => 'available']);
                }
            }

            // [WHY] Update reservation status if it's a group reservation
            if ($order->reservation_id) {
                $reservation = Reservation::find($order->reservation_id);
                if ($reservation && $reservation->type === 'group') {
                    $reservation->update(['status' => 'completed']);
                }
            }

            return $order;
        });

        $result->load(['items' => function($q) {
                $q->select('id', 'order_id', 'product_id', 'name', 'type', 'quantity', 'price', 'discount', 'discount_type', 'note', 'status', 'table_id', 'reservation_item_id');
            }, 'items.product:id,name,price,type', 'table:id,name', 'server:id,name', 'cashier:id,name']);

        try {
            broadcast(new OrderUpdated($result, 'order_updated'));
            if ($result->reservation_id) {
                $reservation = Reservation::find($result->reservation_id);
                if ($reservation && $reservation->type === 'group') {
                    broadcast(new ReservationUpdated($reservation, 'updated'));
                }
            }
        } catch (\Exception $e) {
            Log::error('Broadcast failed during order completion: ' . $e->getMessage());
        }

        return $result;
    }

    // [WHY] Reverts a completed order back to 'pending' to allow further edits.
    public function reopenOrder($orderId)
    {
        $result = DB::transaction(function () use ($orderId) {
            $order = Order::findOrFail($orderId);

            $involvedTableIds = $this->getInvolvedTableIds($order);
            $relatedOrders = $this->getRelatedOrders($order, $involvedTableIds, ['completed']);

            $now = now();
            foreach ($relatedOrders as $o) {
                if ($o->table_id) {
                    $isTableOccupied = Order::where('table_id', $o->table_id)
                        ->whereIn('status', ['pending', 'processing', 'draft'])
                        ->exists();

                    if ($isTableOccupied) {
                        throw new \Exception("Cannot reopen order: Table {$o->table_id} is currently occupied by another active order.");
                    }
                }

                $o->update([
                    'status' => 'pending',
                    'payment_method' => null,
                    'cashier_id' => null,
                    'discount_type' => null,
                    'discount_value' => 0,
                    'discount_amount' => 0,
                    'updated_at' => $now
                ]);

                if ($o->table_id) {
                    Table::where('id', $o->table_id)->update(['status' => 'busy']);
                }
            }

            if ($order->reservation_id) {
                $reservation = Reservation::find($order->reservation_id);
                if ($reservation && $reservation->status === 'completed') {
                    $reservation->update(['status' => 'confirmed']);
                }
            }

            return $order;
        });

        $result->load(['items.product:id,name,price,type', 'table:id,name', 'server:id,name', 'cashier:id,name']);

        try {
            broadcast(new OrderUpdated($result, 'order_updated'));
            if ($result->reservation_id) {
                $reservation = Reservation::find($result->reservation_id);
                if ($reservation) {
                    broadcast(new ReservationUpdated($reservation, 'updated'));
                }
            }
        } catch (\Exception $e) {
            Log::error('Broadcast failed during order reopen: ' . $e->getMessage());
        }

        return $result;
    }

    // [WHY] Updates payment metadata (note, method, discount) for finalized bills.
    public function updatePayment($orderId, $data)
    {
        $result = DB::transaction(function () use ($orderId, $data) {
            $order = Order::findOrFail($orderId);

            $involvedTableIds = $this->getInvolvedTableIds($order);
            $relatedOrders = $this->getRelatedOrders($order, $involvedTableIds, ['completed'], $data);

            $groupSubtotal = $relatedOrders->sum(function ($o) {
                return $o->subtotal ?? ($o->total_price + $o->discount_amount);
            });

            $discountType = $data['discount_type'] ?? $order->discount_type;
            $discountValue = $data['discount_value'] ?? $order->discount_value;
            $groupDiscountAmount = 0;

            if ($discountType === 'percent') {
                $groupDiscountAmount = floor(($groupSubtotal * $discountValue) / 100);
            } elseif ($discountType === 'fixed') {
                $groupDiscountAmount = $discountValue;
            }

            $groupDiscountAmount = min($groupSubtotal, $groupDiscountAmount);

            // [WHY] Update ALL related orders by distributing the group discount
            $remainingDiscount = $groupDiscountAmount;
            
            foreach ($relatedOrders as $o) {
                $isPrimary = $o->id == $orderId;
                
                // [WHY] Subtract as much discount as possible from this order's price
                $sourcePrice = $o->subtotal ?? $o->total_price;
                $orderDiscount = min($sourcePrice, $remainingDiscount);
                $remainingDiscount -= $orderDiscount;

                $updateData = [
                    'payment_method' => $data['payment_method'] ?? $o->payment_method,
                    'cashier_note' => $data['cashier_note'] ?? $o->cashier_note,
                    'discount_type' => $isPrimary ? $discountType : null,
                    'discount_value' => $isPrimary ? $discountValue : 0,
                    'discount_amount' => $isPrimary ? $groupDiscountAmount : 0,
                    'total_price' => $sourcePrice - $orderDiscount,
                ];

                // [FIX] Disable automatic timestamp updates so that editing a historical bill
                // does NOT change its updated_at. The history view filters by updated_at date,
                // so mutating it would incorrectly re-date the bill to today and make it
                // disappear from the original date in the Recently Paid Bills history.
                $o->timestamps = false;
                $o->update($updateData);
                $o->timestamps = true; // Restore for safety
            }

            return $order;
        });

        $result->load(['items.product:id,name,price,type', 'table:id,name', 'server:id,name', 'cashier:id,name']);

        try {
            broadcast(new OrderUpdated($result, 'order_updated'));
        } catch (\Exception $e) {
            Log::error('Broadcast failed during payment update: ' . $e->getMessage());
        }

        return $result;
    }

    // [WHY] Returns a list of finalized orders for the cashier history view.
    public function getHistory($limit = 20, $date = null)
    {
        $query = Order::with(['items' => function($q) {
                $q->select('id', 'order_id', 'product_id', 'name', 'type', 'quantity', 'price', 'discount', 'discount_type', 'note', 'status', 'table_id', 'reservation_item_id');
            }, 'items.product:id,name,price,type', 'table:id,name', 'server:id,name', 'cashier:id,name', 'reservation'])
            ->where('status', 'completed');

        if ($date) {
            $query->whereDate('updated_at', $date);
        } else {
            $query->whereDate('updated_at', now()->toDateString());
        }

        return $query->orderBy('updated_at', 'desc')
            ->orderBy('id', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Identify all involved table IDs in the merge group or reservation
     */
    public function getInvolvedTableIds(Order $order): array
    {
        $involvedTableIds = [$order->table_id];

        if ($order->merged_tables) {
            $mergedIds = explode('-', $order->merged_tables);
            $involvedTableIds = array_merge($involvedTableIds, $mergedIds);
        }

        if ($order->reservation && $order->reservation->table_ids) {
            $involvedTableIds = array_merge($involvedTableIds, (array) $order->reservation->table_ids);
        }

        return array_unique(array_filter($involvedTableIds));
    }

    /**
     * Identify all orders that should be processed together.
     * [RULE] Explicit sibling IDs from the frontend MUST override implicit merge/reservation logic
     * to support independent split-bill payments.
     */
    public function getRelatedOrders(Order $order, array $involvedTableIds, array $statuses, array $data = [])
    {
        return Order::whereIn('status', $statuses)
            ->where(function ($query) use ($order, $involvedTableIds, $data) {
                // [RULE] Group reservations ALWAYS complete the entire unified group.
                // This logic is prioritized to keep Group and Individual lanes strictly separate.
                if ($order->reservation && $order->reservation->type === 'group') {
                    $query->where('reservation_id', $order->reservation_id)
                        ->orWhereIn('table_id', $involvedTableIds);
                    return;
                }

                // [WHY] For individual/merged/split tables, if explicit sibling IDs are provided, 
                // we MUST isolate to that set to support independent split-bill payments.
                if (!empty($data['sibling_order_ids'])) {
                    $ids = array_unique(array_merge([$order->id], (array) $data['sibling_order_ids']));
                    $query->whereIn('id', $ids);
                    return;
                }

                // [FALLBACK] Standard merged orders use the table merge string
                $query->where('id', $order->id);
                if ($order->merged_tables) {
                    $query->orWhere('merged_tables', $order->merged_tables);
                }
            })
            ->get();
    }
}
