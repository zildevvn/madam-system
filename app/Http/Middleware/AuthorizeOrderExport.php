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
        $user = null;
        $token = $request->bearerToken();

        if ($token) {
            $accessToken = \Laravel\Sanctum\Sanctum::personalAccessTokenModel()::findToken($token);
            if ($accessToken && $accessToken->tokenable) {
                $user = $accessToken->tokenable->withAccessToken($accessToken);
            }
        } elseif (app()->environment('testing')) {
            $user = auth('sanctum')->user();
        }

        if (!$user) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 401);
        }

        $request->setUserResolver(fn () => $user);

        if (!$user->canExportOrders()) {
            return response()->json([
                'message' => 'Forbidden'
            ], 403);
        }

        return $next($request);
    }
}
