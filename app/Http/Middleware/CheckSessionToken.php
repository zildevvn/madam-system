<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckSessionToken
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->is('api/login') || $request->is('api/login/*')) {
            return $next($request);
        }

        $userId = $request->header('X-User-Id');
        if ($userId) {
            $user = \App\Models\User::find($userId);
            if (!$user) {
                return response()->json(['message' => 'Unauthorized'], 401);
            }
            if ($user->session_token) {
                if ($request->header('X-Session-Token') !== $user->session_token) {
                    return response()->json(['message' => 'Session expired or revoked'], 401);
                }
            }
        }

        return $next($request);
    }
}
