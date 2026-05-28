<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class LeaveRequestUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $leave;
    public $action;

    /**
     * Create a new event instance.
     *
     * @param mixed $leave
     * @param string $action 'created' | 'updated' | 'deleted'
     * @return void
     */
    public function __construct($leave, $action = 'updated')
    {
        $this->leave = $leave;
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
            'id' => $this->leave ? $this->leave->id : null,
            'action' => $this->action,
            'leave' => $this->leave,
        ];
    }

    public function broadcastAs()
    {
        return 'leave_updated';
    }
}
