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
            $relatedOrders = $this->getRelatedOrders($order, $involvedTableIds, [Order::STATUS_PENDING, Order::STATUS_PROCESSING, Order::STATUS_DRAFT], $data);

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
                $orderDiscount = 0;
                if ($remainingDiscount > 0) {
                    $orderDiscount = min($o->total_price, $remainingDiscount);
                    $remainingDiscount = max(0, $remainingDiscount - $orderDiscount);
                }

                $finalOrderPrice = max(0, $o->total_price - $orderDiscount);

                $updateData = [
                    'status' => Order::STATUS_COMPLETED,
                    'payment_method' => $data['payment_method'] ?? null,
                    'cashier_id' => $data['cashier_id'] ?? null,
                    'cashier_note' => $data['cashier_note'] ?? $o->cashier_note,
                    'subtotal' => $o->total_price,
                    'reservation_id' => $order->reservation_id,
                    'merged_tables' => $order->merged_tables,
                    'discount_type' => $isPrimary ? $discountType : null,
                    'discount_value' => $isPrimary ? $discountValue : 0,
                    'discount_amount' => $isPrimary ? $groupDiscountAmount : 0, // Keep full amount on primary for history
                    'total_price' => $finalOrderPrice,
                    'updated_at' => $now,
                ];

                $o->update($updateData);

                // Write payments
                if (method_exists($o, 'payments')) {
                    $o->payments()->delete();
                }
                $payments = $data['payments'] ?? [];
                if (empty($payments)) {
                    $paymentMethod = $data['payment_method'] ?? null;
                    if ($paymentMethod && $paymentMethod !== 'split') {
                        if (method_exists($o, 'payments')) {
                            $o->payments()->create([
                                'payment_method' => $paymentMethod,
                                'amount' => $finalOrderPrice,
                            ]);
                        } else {
                            $o->payments = collect([
                                (object)[
                                    'payment_method' => $paymentMethod,
                                    'amount' => $finalOrderPrice,
                                ]
                            ]);
                        }
                    }
                } else {
                    $groupFinalTotal = $groupSubtotal - $groupDiscountAmount;
                    if ($groupFinalTotal > 0) {
                        $ratio = $finalOrderPrice / $groupFinalTotal;
                        $remainingAmount = $finalOrderPrice;
                        
                        foreach ($payments as $idx => $p) {
                            $allocated = (int) round($p['amount'] * $ratio);
                            if ($idx === count($payments) - 1) {
                                $allocated = $remainingAmount;
                            } else {
                                $allocated = min($allocated, $remainingAmount);
                            }
                            $remainingAmount -= $allocated;

                            if ($allocated > 0) {
                                if (method_exists($o, 'payments')) {
                                    $o->payments()->create([
                                        'payment_method' => $p['payment_method'],
                                        'amount' => $allocated,
                                    ]);
                                } else {
                                    if (!isset($o->payments)) {
                                        $o->payments = collect();
                                    }
                                    $o->payments->push((object)[
                                        'payment_method' => $p['payment_method'],
                                        'amount' => $allocated,
                                    ]);
                                }
                            }
                        }
                    }
                }
            }

            // [WHY] Free tables ONLY if no more active orders remain
            foreach ($involvedTableIds as $tId) {
                $stillBusy = Order::where('table_id', $tId)
                    ->whereIn('status', [Order::STATUS_DRAFT, Order::STATUS_PENDING, Order::STATUS_PROCESSING])
                    ->exists();

                if (!$stillBusy) {
                    Table::where('id', $tId)->update(['status' => 'available']);
                }
            }

            // [WHY] Update reservation status if it's a group reservation
            if ($order->reservation) {
                if (method_exists($order->reservation, 'update')) {
                    if ($order->reservation->type === 'group') {
                        $order->reservation->update(['status' => Reservation::STATUS_COMPLETED]);
                    }
                } else {
                    if (($order->reservation->type ?? null) === 'group') {
                        $order->reservation->status = Reservation::STATUS_COMPLETED;
                    }
                }
            }

            return $order;
        });

        $result->load(['items' => function($q) {
                $q->select('id', 'order_id', 'product_id', 'name', 'type', 'quantity', 'price', 'discount', 'discount_type', 'note', 'status', 'table_id', 'reservation_item_id');
            }, 'items.product:id,name,name_vi,price,type', 'table:id,name', 'server:id,name', 'cashier:id,name', 'payments', 'reservation']);

        $this->broadcastOrderUpdates($result, 'complete', $result->reservation);

        return $result;
    }

    // [WHY] Reverts a completed order back to 'pending' to allow further edits.
    public function reopenOrder($orderId)
    {
        $result = DB::transaction(function () use ($orderId) {
            $order = Order::with('reservation')->findOrFail($orderId);

            $involvedTableIds = $this->getInvolvedTableIds($order);
            $relatedOrders = $this->getRelatedOrders($order, $involvedTableIds, [Order::STATUS_COMPLETED]);

            $now = now();
            foreach ($relatedOrders as $o) {
                if ($o->table_id) {
                    $isTableOccupied = Order::where('table_id', $o->table_id)
                        ->whereIn('status', [Order::STATUS_PENDING, Order::STATUS_PROCESSING, Order::STATUS_DRAFT])
                        ->exists();

                    if ($isTableOccupied) {
                        throw new \Exception("Cannot reopen order: Table {$o->table_id} is currently occupied by another active order.");
                    }
                }

                $o->update([
                    'status' => Order::STATUS_PENDING,
                    'payment_method' => null,
                    'cashier_id' => null,
                    'discount_type' => null,
                    'discount_value' => 0,
                    'discount_amount' => 0,
                    'updated_at' => $now
                ]);

                // Clear payment records on reopen
                $o->payments()->delete();

                if ($o->table_id) {
                    Table::where('id', $o->table_id)->update(['status' => 'busy']);
                }
            }

            if ($order->reservation) {
                if (method_exists($order->reservation, 'update')) {
                    if ($order->reservation->status === Reservation::STATUS_COMPLETED) {
                        $order->reservation->update(['status' => Reservation::STATUS_CONFIRMED]);
                    }
                } else {
                    if (($order->reservation->status ?? null) === Reservation::STATUS_COMPLETED) {
                        $order->reservation->status = Reservation::STATUS_CONFIRMED;
                    }
                }
            }

            return $order;
        });

        $result->load(['items.product:id,name,name_vi,price,type', 'table:id,name', 'server:id,name', 'cashier:id,name', 'payments', 'reservation']);

        $this->broadcastOrderUpdates($result, 'reopen', $result->reservation);

        return $result;
    }

    // [WHY] Updates payment metadata (note, method, discount) for finalized bills.
    public function updatePayment($orderId, $data)
    {
        $result = DB::transaction(function () use ($orderId, $data) {
            $order = Order::findOrFail($orderId);

            $involvedTableIds = $this->getInvolvedTableIds($order);
            $relatedOrders = $this->getRelatedOrders($order, $involvedTableIds, [Order::STATUS_COMPLETED], $data);

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
            $groupFinalTotal = $groupSubtotal - $groupDiscountAmount;

            // [WHY] Update ALL related orders by distributing the group discount
            $remainingDiscount = $groupDiscountAmount;
            
            foreach ($relatedOrders as $o) {
                $isPrimary = $o->id == $orderId;
                
                // [WHY] Subtract as much discount as possible from this order's price
                $sourcePrice = $o->subtotal ?? $o->total_price;
                $orderDiscount = 0;
                if ($remainingDiscount > 0) {
                    $orderDiscount = min($sourcePrice, $remainingDiscount);
                    $remainingDiscount = max(0, $remainingDiscount - $orderDiscount);
                }

                $finalOrderPrice = max(0, $sourcePrice - $orderDiscount);

                $updateData = [
                    'payment_method' => $data['payment_method'] ?? $o->payment_method,
                    'cashier_note' => $data['cashier_note'] ?? $o->cashier_note,
                    'discount_type' => $isPrimary ? $discountType : null,
                    'discount_value' => $isPrimary ? $discountValue : 0,
                    'discount_amount' => $isPrimary ? $groupDiscountAmount : 0,
                    'total_price' => $finalOrderPrice,
                ];

                $originalTimestamps = $o->timestamps;
                try {
                    $o->timestamps = false;
                    $o->update($updateData);
                } finally {
                    $o->timestamps = $originalTimestamps;
                }

                // Update payments
                if (method_exists($o, 'payments')) {
                    $o->payments()->delete();
                }
                $payments = $data['payments'] ?? [];
                if (empty($payments)) {
                    $paymentMethod = $data['payment_method'] ?? $o->payment_method;
                    if ($paymentMethod && $paymentMethod !== 'split') {
                        if (method_exists($o, 'payments')) {
                            $o->payments()->create([
                                'payment_method' => $paymentMethod,
                                'amount' => $finalOrderPrice,
                            ]);
                        } else {
                            $o->payments = collect([
                                (object)[
                                    'payment_method' => $paymentMethod,
                                    'amount' => $finalOrderPrice,
                                ]
                            ]);
                        }
                    }
                } else {
                    if ($groupFinalTotal > 0) {
                        $ratio = $finalOrderPrice / $groupFinalTotal;
                        $remainingAmount = $finalOrderPrice;
                        
                        foreach ($payments as $idx => $p) {
                            $allocated = (int) round($p['amount'] * $ratio);
                            if ($idx === count($payments) - 1) {
                                $allocated = $remainingAmount;
                            } else {
                                $allocated = min($allocated, $remainingAmount);
                            }
                            $remainingAmount -= $allocated;

                            if ($allocated > 0) {
                                if (method_exists($o, 'payments')) {
                                    $o->payments()->create([
                                        'payment_method' => $p['payment_method'],
                                        'amount' => $allocated,
                                    ]);
                                } else {
                                    if (!isset($o->payments)) {
                                        $o->payments = collect();
                                    }
                                    $o->payments->push((object)[
                                        'payment_method' => $p['payment_method'],
                                        'amount' => $allocated,
                                    ]);
                                }
                            }
                        }
                    }
                }
            }

            return $order;
        });

        $result->load(['items.product:id,name,name_vi,price,type', 'table:id,name', 'server:id,name', 'cashier:id,name', 'payments']);

        $this->broadcastOrderUpdates($result, 'update');

        return $result;
    }

    // [WHY] Returns a list of finalized orders for the cashier history view.
    public function getHistory($limit = 20, $date = null)
    {
        $query = Order::with(['items' => function($q) {
                $q->select('id', 'order_id', 'product_id', 'name', 'type', 'quantity', 'price', 'discount', 'discount_type', 'note', 'status', 'table_id', 'reservation_item_id');
            }, 'items.product:id,name,name_vi,price,type', 'table:id,name', 'server:id,name', 'cashier:id,name', 'reservation', 'payments'])
            ->where('status', Order::STATUS_COMPLETED);

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

        return collect($involvedTableIds)
            ->map(fn ($id) => (int) $id)
            ->filter()
            ->unique()
            ->values()
            ->all();
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
                    $query->where('reservation_id', $order->reservation_id);
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

    /**
     * Centralized broadcast logic for order and reservation updates.
     */
    private function broadcastOrderUpdates(Order $order, string $actionContext, ?Reservation $reservation = null): void
    {
        try {
            broadcast(new OrderUpdated($order, 'order_updated'));

            if ($reservation) {
                if ($actionContext === 'complete' && $reservation->type === 'group') {
                    broadcast(new ReservationUpdated($reservation, 'updated'));
                } elseif ($actionContext === 'reopen') {
                    broadcast(new ReservationUpdated($reservation, 'updated'));
                }
            }
        } catch (\Exception $e) {
            Log::error("Broadcast failed during order {$actionContext}: " . $e->getMessage());
        }
    }
}
