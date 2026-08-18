<?php
use App\Models\Order;
use Carbon\Carbon;

$orders = Order::with('items')->where('created_at', '>=', Carbon::now()->subDays(30))->get();

$affectedOrders = 0;
$affectedItemsCount = 0;
$examples = [];

foreach ($orders as $order) {
    $hasMismatch = false;
    $orderItemsGroups = [];

    foreach ($order->items as $item) {
        $key = ($item->product_id ?: $item->name) . '-' . ($item->note ?: '');
        if (!isset($orderItemsGroups[$key])) {
            $orderItemsGroups[$key] = [];
        }
        $orderItemsGroups[$key][] = $item;
    }

    foreach ($orderItemsGroups as $key => $items) {
        $prices = array_unique(array_map(function($i) { return (float)$i->price; }, $items));
        if (count($prices) > 1) {
            $hasMismatch = true;
            $affectedItemsCount += count($items);
            if (count($examples) < 5) {
                $examples[] = [
                    'order_id' => $order->id,
                    'key' => $key,
                    'prices' => $prices,
                    'items_count' => count($items)
                ];
            }
        }
    }

    if ($hasMismatch) {
        $affectedOrders++;
    }
}

echo json_encode([
    'affected_orders' => $affectedOrders,
    'affected_items' => $affectedItemsCount,
    'examples' => $examples
], JSON_PRETTY_PRINT);
