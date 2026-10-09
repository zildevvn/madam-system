<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ExternalApiAuth
{
    public function handle(
        Request $request,
        Closure $next
    ): Response {
        $configuredKey = config('services.external_api.key');

        if (empty($configuredKey)) {
            return response()->json([
                'message' => 'External API is not configured.',
            ], 500);
        }

        $providedKey = $request->bearerToken();

        if (
            empty($providedKey) ||
            !hash_equals(
                $configuredKey,
                $providedKey
            )
        ) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], 401);
        }

        return $next($request);
    }
}