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
        return $request->user();
    }
}
