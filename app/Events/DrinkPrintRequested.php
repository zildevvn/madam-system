<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DrinkPrintRequested implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $requestId;
    public $orderId;
    public $tableName;
    public $tableId;
    public $title;
    public $items;
    public $orderNote;
    public $staffName;
    public $createdAt;

    /**
     * Create a new event instance.
     *
     * @param array $payload
     */
    public function __construct(array $payload)
    {
        $this->requestId = $payload['request_id'] ?? ('pr-' . ($payload['order_id'] ?? '0') . '-' . round(microtime(true) * 1000));
        $this->orderId = $payload['order_id'];
        $this->tableName = $payload['table_name'];
        $this->tableId = $payload['table_id'] ?? null;
        $this->title = $payload['title'] ?? 'PHIẾU PHA CHẾ';
        $this->items = $payload['items'];
        $this->orderNote = $payload['order_note'] ?? '';
        $this->staffName = $payload['staff_name'] ?? '';
        $this->createdAt = $payload['created_at'] ?? now()->toISOString();
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return \Illuminate\Broadcasting\Channel
     */
    public function broadcastOn()
    {
        return new Channel('orders');
    }

    /**
     * Data to broadcast with the event.
     *
     * @return array
     */
    public function broadcastWith()
    {
        return [
            'request_id' => $this->requestId,
            'order_id' => $this->orderId,
            'table_name' => $this->tableName,
            'table_id' => $this->tableId,
            'title' => $this->title,
            'items' => $this->items,
            'order_note' => $this->orderNote,
            'staff_name' => $this->staffName,
            'created_at' => $this->createdAt,
        ];
    }

    /**
     * The event's broadcast name.
     *
     * @return string
     */
    public function broadcastAs()
    {
        return 'drink_print_requested';
    }
}
