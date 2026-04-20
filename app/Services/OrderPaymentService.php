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
            $order = Order::findOrFail($orderId);

            // [WHY] Identify all involved table IDs in the merge group
            $involvedTableIds = [$order->table_id];
            if ($order->merged_tables) {
                $mergedIds = explode('-', $order->merged_tables);
                $involvedTableIds = array_merge($involvedTableIds, $mergedIds);
            }
            $involvedTableIds = array_unique(array_filter($involvedTableIds));

            // [WHY] Identify all active orders that should be completed together as a group
            $relatedOrders = Order::whereIn('status', ['pending', 'processing', 'draft'])
                ->where(function($query) use ($order, $involvedTableIds) {
                    $query->whereIn('table_id', $involvedTableIds);
                    if ($order->reservation_id) {
                        $query->orWhere('reservation_id', $order->reservation_id);
                    }
                })
                ->get();

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

            // [WHY] Finalize ALL related orders
            foreach ($relatedOrders as $o) {
                $isPrimary = $o->id == $orderId;
                
                $updateData = [
                    'status' => 'completed',
                    'payment_method' => $data['payment_method'] ?? null,
                    'cashier_id' => $data['cashier_id'] ?? null,
                    'cashier_note' => $data['cashier_note'] ?? $o->cashier_note,
                    'subtotal' => $o->total_price,
                    'reservation_id' => $order->reservation_id,
                    'merged_tables' => $order->merged_tables,
                ];

                if ($isPrimary) {
                    $updateData['discount_type'] = $discountType;
                    $updateData['discount_value'] = $discountValue;
                    $updateData['discount_amount'] = $groupDiscountAmount;
                    $updateData['total_price'] = $o->total_price - $groupDiscountAmount;
                } else {
                    $updateData['discount_type'] = null;
                    $updateData['discount_value'] = 0;
                    $updateData['discount_amount'] = 0;
                    $updateData['total_price'] = $o->total_price;
                }

                $o->update($updateData);
            }

            // [WHY] Free tables ONLY if no more active orders remain
            foreach ($involvedTableIds as $tId) {
                $stillBusy = Order::where('table_id', $tId)
                    ->whereIn('status', ['draft', 'pending', 'processing'])
                    ->exists();

                if (!$stillBusy) {
                    Table::where('id', $tId)->update(['status' => 'empty']);
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

        $result->load(['items.product:id,name,price,type', 'table:id,name', 'server:id,name', 'cashier:id,name']);

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
            
            $involvedTableIds = [$order->table_id];
            if ($order->merged_tables) {
                $mergedIds = explode('-', $order->merged_tables);
                $involvedTableIds = array_merge($involvedTableIds, $mergedIds);
            }
            $involvedTableIds = array_unique(array_filter($involvedTableIds));

            $relatedOrders = Order::where('status', 'completed')
                ->where(function($query) use ($order, $involvedTableIds) {
                    $query->whereIn('table_id', $involvedTableIds);
                    if ($order->reservation_id) {
                        $query->orWhere('reservation_id', $order->reservation_id);
                    }
                })
                ->where(function($query) use ($order) {
                    if ($order->merged_tables) {
                        $query->where('merged_tables', $order->merged_tables);
                    }
                    if ($order->reservation_id) {
                        $query->orWhere('reservation_id', $order->reservation_id);
                    }
                })
                ->get();

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
                    'discount_amount' => 0
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
        $order = Order::findOrFail($orderId);
        
        $involvedTableIds = [$order->table_id];
        if ($order->merged_tables) {
            $mergedIds = explode('-', $order->merged_tables);
            $involvedTableIds = array_merge($involvedTableIds, $mergedIds);
        }
        $involvedTableIds = array_unique(array_filter($involvedTableIds));

        $relatedOrders = Order::where('status', 'completed')
            ->where(function($query) use ($order, $involvedTableIds) {
                $query->whereIn('table_id', $involvedTableIds);
                if ($order->reservation_id) {
                    $query->orWhere('reservation_id', $order->reservation_id);
                }
            })
            ->where(function($query) use ($order) {
                if ($order->merged_tables) {
                    $query->where('merged_tables', $order->merged_tables);
                }
                if ($order->reservation_id) {
                    $query->orWhere('reservation_id', $order->reservation_id);
                }
            })
            ->get();

        $groupSubtotal = $relatedOrders->sum(function($o) {
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

        foreach ($relatedOrders as $o) {
            $isPrimary = $o->id == $orderId;
            
            $updateData = [
                'payment_method' => $data['payment_method'] ?? $o->payment_method,
                'cashier_note' => $data['cashier_note'] ?? $o->cashier_note,
            ];

            if ($isPrimary) {
                $updateData['discount_type'] = $discountType;
                $updateData['discount_value'] = $discountValue;
                $updateData['discount_amount'] = $groupDiscountAmount;
                $updateData['total_price'] = ($o->subtotal ?? $o->total_price) - $groupDiscountAmount;
            } else {
                $updateData['discount_type'] = null;
                $updateData['discount_value'] = 0;
                $updateData['discount_amount'] = 0;
                $updateData['total_price'] = ($o->subtotal ?? $o->total_price);
            }

            $o->update($updateData);
        }

        $order->load(['items.product:id,name,price,type', 'table:id,name', 'server:id,name', 'cashier:id,name']);
        
        try {
            broadcast(new OrderUpdated($order, 'order_updated'));
        } catch (\Exception $e) {
            Log::error('Broadcast failed during payment update: ' . $e->getMessage());
        }

        return $order;
    }

    // [WHY] Returns a list of finalized orders for the cashier history view.
    public function getHistory($limit = 20)
    {
        return Order::with(['items.product:id,name,price,type', 'table:id,name', 'server:id,name', 'cashier:id,name', 'reservation'])
            ->where('status', 'completed')
            ->whereDate('updated_at', now()->toDateString())
            ->orderBy('updated_at', 'desc')
            ->orderBy('id', 'desc')
            ->limit($limit)
            ->get();
    }
}
