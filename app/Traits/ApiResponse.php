<?php

namespace App\Traits;

use Illuminate\Http\JsonResponse;

trait ApiResponse
{
    /**
     * success
     * [WHY] Standardizes success responses across all API controllers.
     */
    protected function success($data, string $message = 'Success', int $code = 200): JsonResponse
    {
        return response()->json([
            'data' => $data,
            'message' => $message,
            'errors' => null
        ], $code);
    }

    /**
     * error
     * [WHY] Standardizes error responses with consistent structure.
     */
    protected function error(string $message = 'Error', $errors = null, int $status = 400): JsonResponse
    {
        return response()->json([
            'data' => null,
            'message' => $message,
            'errors' => $errors
        ], $status);
    }
}
