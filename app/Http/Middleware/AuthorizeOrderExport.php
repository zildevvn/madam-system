<?php

namespace App\Http\Middleware;

use Closure;
use App\Models\User;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthorizeOrderExport
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function handle(Request $request, Closure $next): Response
    {
        $userId = $request->header('X-User-Id');
        $user = $userId ? User::find($userId) : null;

        if (!$user || !$user->canExportOrders()) {
            return response()->json([
                'message' => 'Forbidden'
            ], 403);
        }

        return $next($request);
    }
}
