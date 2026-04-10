<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ReservationUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $reservation;
    public $action;

    /**
     * Create a new event instance.
     *
     * @param mixed $reservation
     * @param string $action 'created' | 'updated' | 'confirmed'
     * @return void
     */
    public function __construct($reservation, $action = 'updated')
    {
        $this->reservation = $reservation;
        $this->action = $action;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return \Illuminate\Broadcasting\Channel|array
     */
    public function broadcastOn()
    {
        // [WHY] We use the 'orders' channel to keep all dashboard events unified
        return new Channel('orders');
    }

    public function broadcastWith()
    {
        return [
            'id' => $this->reservation->id,
            'action' => $this->action,
        ];
    }

    public function broadcastAs()
    {
        return 'reservation_updated';
    }
}
