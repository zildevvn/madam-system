<?php

namespace App\Traits;

use App\Models\User;
use Illuminate\Http\Request;

trait AuthenticatesStatelessUser
{
    /**
     * Retrieve authenticated user context strictly via Sanctum Bearer token.
     */
    private function getCurrentUser(Request $request): ?User
    {
        $token = $request->bearerToken();
        if ($token) {
            $accessToken = \Laravel\Sanctum\Sanctum::personalAccessTokenModel()::findToken($token);
            if (!$accessToken || !$accessToken->tokenable) {
                return null;
            }

            $user = $accessToken->tokenable->withAccessToken($accessToken);
            $request->setUserResolver(fn () => $user);
            return $user;
        }

        // Support standard Sanctum testing helpers (actingAs) when no Bearer header is passed
        if (app()->environment('testing')) {
            $user = $request->user('sanctum') ?? $request->user();
            if ($user) {
                $request->setUserResolver(fn () => $user);
                return $user;
            }
        }

        return null;
    }
}
