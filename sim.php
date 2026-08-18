<?php
$order = \App\Models\Order::with('items')->find(6536);
$itemsMap = [];
foreach ($order->items as $item) {
    $key = ($item->product_id ?: $item->name) . '-' . ($item->note ?: '') . '-' . (float)$item->price;
    if (isset($itemsMap[$key])) {
        $itemsMap[$key]['quantity'] += $item->quantity;
    } else {
        $itemsMap[$key] = [
            'name' => $item->name,
            'price' => (float)$item->price,
            'quantity' => $item->quantity
        ];
    }
}
$rawItems = array_values($itemsMap);
echo json_encode(['rawItems' => $rawItems, 'total_price' => (float)$order->total_price], JSON_PRETTY_PRINT);
