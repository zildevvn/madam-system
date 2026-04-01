<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OrderUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $order;
    public $action;

    /**
     * Create a new event instance.
     *
     * @return void
     */
    public function __construct($order, $action = 'updated')
    {
        $this->order = $order;
        $this->action = $action;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return \Illuminate\Broadcasting\Channel|array
     */
    public function broadcastOn()
    {
        return new Channel('orders');
    }

    public function broadcastWith()
    {
        return [
            'order' => [
                'id' => $this->order->id,
                'table_id' => $this->order->table_id,
                'status' => $this->order->status,
                'total_price' => $this->order->total_price,
                'order_type' => $this->order->order_type,
                'items' => $this->order->items->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'product_id' => $item->product_id,
                        'quantity' => $item->quantity,
                        'price' => $item->price,
                        'status' => $item->status,
                        'note' => $item->note,
                        'product' => $item->product ? [
                            'id' => $item->product->id,
                            'name' => $item->product->name,
                            'image' => $item->product->image,
                        ] : null
                    ];
                })
            ],
            'action' => $this->action,
        ];
    }


    public function broadcastAs()
    {
        return $this->action;
    }
}
