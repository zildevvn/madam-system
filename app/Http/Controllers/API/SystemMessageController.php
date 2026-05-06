<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\SystemMessage;
use App\Events\NewSystemMessageEvent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SystemMessageController extends Controller
{
    public function index(Request $request)
    {
        $userId = $request->query('user_id');

        $messages = SystemMessage::with('user')
            ->latest()
            ->take(50)
            ->get();

        if ($userId) {
            $readMessageIds = \DB::table('system_message_user')
                ->where('user_id', $userId)
                ->pluck('system_message_id')
                ->toArray();

            $messages->each(function ($msg) use ($readMessageIds) {
                $msg->is_read = in_array($msg->id, $readMessageIds);
            });
        }

        return response()->json([
            'data' => $messages,
            'message' => 'Success'
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'content' => 'required|string',
            'user_id' => 'required|exists:users,id'
        ]);

        $message = SystemMessage::create($validated);
        
        // Broadcast the new message event
        event(new NewSystemMessageEvent($message));

        return response()->json([
            'data' => $message->load('user'),
            'message' => 'Message broadcasted successfully'
        ], 201);
    }

    public function markAsRead(Request $request, $id)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id'
        ]);

        \DB::table('system_message_user')->updateOrInsert(
            ['system_message_id' => $id, 'user_id' => $validated['user_id']],
            ['read_at' => now(), 'updated_at' => now(), 'created_at' => now()]
        );

        return response()->json([
            'message' => 'Marked as read'
        ]);
    }
}
