<?php

namespace App\Traits;

use App\Models\User;
use Illuminate\Http\Request;

trait AuthenticatesStatelessUser
{
    /**
     * Helper to retrieve active user context from request headers securely verified against DB.
     */
    private function getCurrentUser(Request $request)
    {
        $userId = $request->header('X-User-Id');
        if (!$userId) {
            return null;
        }

        $user = User::find($userId);
        if (!$user) {
            return null;
        }

        // Check stateless session token if one exists for the user (forced logout mechanism)
        if ($user->session_token) {
            $sessionToken = $request->header('X-Session-Token');
            if ($sessionToken !== $user->session_token) {
                return null;
            }
        }

        return $user;
    }
}
