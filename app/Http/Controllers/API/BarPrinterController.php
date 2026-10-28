<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\BarPrintRequest;
use App\Events\DrinkPrintRequested;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class BarPrinterController extends Controller
{
    use ApiResponse;

    /**
     * Stale threshold for printing requests in seconds (120s).
     */
    const STALE_TIMEOUT_SECONDS = 120;

    /**
     * Get all pending or retryable failed bar print requests created within the last 2 hours.
     * Excludes printing requests (both active and stale) to prevent duplicate physical prints.
     * Used by POS when coming online or reconnecting.
     */
    public function getPendingRequests()
    {
        $requests = BarPrintRequest::where(function ($query) {
                $query->where('status', 'pending')
                    ->orWhere(function ($qFailed) {
                        $qFailed->where('status', 'failed')
                                ->where(function ($sub) {
                                    $sub->whereNull('error_message')
                                        ->orWhere('error_message', 'not like', 'QZ_INDETERMINATE_TIMEOUT%');
                                });
                    });
            })
            ->where('created_at', '>=', now()->subHours(2))
            ->orderBy('id', 'asc')
            ->get();

        return $this->success($requests, 'Pending bar print requests retrieved');
    }

    /**
     * Atomically claim a bar print request before printing.
     * Generates a new fencing token (claim_token) upon successful claim.
     * Uses row-level DB locking to ensure that even with multiple tabs or multiple stations,
     * only ONE station/tab successfully claims and prints.
     */
    public function claim(Request $request)
    {
        $validated = $request->validate([
            'request_id' => 'required|string',
        ]);

        $requestId = $validated['request_id'];
        $now = now();
        $staleThreshold = now()->subSeconds(self::STALE_TIMEOUT_SECONDS);

        return DB::transaction(function () use ($requestId, $now, $staleThreshold) {
            $printReq = BarPrintRequest::where('request_id', $requestId)
                ->lockForUpdate()
                ->first();

            if (!$printReq) {
                return $this->error('Print request not found', null, 404);
            }

            // If already successfully printed, reject claim
            if ($printReq->status === 'printed') {
                return $this->error('Request already printed', [
                    'status' => 'already_printed',
                    'reason' => 'already_printed',
                    'printed_at' => $printReq->printed_at,
                ], 409);
            }

            // If request failed due to indeterminate timeout, reject auto-claim to prevent duplicate physical print
            if ($printReq->status === 'failed' && \Illuminate\Support\Str::startsWith($printReq->error_message ?? '', 'QZ_INDETERMINATE_TIMEOUT')) {
                return $this->error('Print request timed out with unconfirmed physical output. Manual reprint required.', [
                    'status' => 'unconfirmed_timeout',
                    'reason' => 'unconfirmed_timeout',
                ], 409);
            }

            // If request is in printing status and stale (> 120s), reject claim as unconfirmed stale printing
            $isStale = ($printReq->status === 'printing' && (
                ($printReq->claimed_at && $printReq->claimed_at <= $staleThreshold) ||
                (!$printReq->claimed_at && $printReq->updated_at <= $staleThreshold)
            ));

            if ($isStale) {
                return $this->error('Print request is in unconfirmed printing state beyond threshold. Manual inspection required.', [
                    'status' => 'unconfirmed_stale_printing',
                    'reason' => 'unconfirmed_stale_printing',
                    'claimed_at' => $printReq->claimed_at ? $printReq->claimed_at->toISOString() : null,
                ], 409);
            }

            // If request is currently claimed and active (printing and not stale)
            if ($printReq->status === 'printing') {
                return $this->error('Request is already claimed by another station', [
                    'status' => 'claimed_by_another_station',
                    'reason' => 'claimed_by_another_station',
                    'claimed_at' => $printReq->claimed_at ? $printReq->claimed_at->toISOString() : null,
                ], 409);
            }

            $isFailedRetryable = ($printReq->status === 'failed' && (!\Illuminate\Support\Str::startsWith($printReq->error_message ?? '', 'QZ_INDETERMINATE_TIMEOUT')));

            if ($printReq->status === 'pending' || $isFailedRetryable) {
                $claimToken = (string) Str::uuid();

                $printReq->update([
                    'status' => 'printing',
                    'claimed_at' => $now,
                    'claim_token' => $claimToken,
                ]);

                return $this->success([
                    'request_id' => $printReq->request_id,
                    'status' => 'printing',
                    'claimed_at' => $now->toISOString(),
                    'claim_token' => $claimToken,
                ], 'Request claimed successfully');
            }

            return $this->error('Request cannot be claimed in its current status', [
                'status' => $printReq->status,
                'reason' => 'invalid_status',
            ], 409);
        });
    }

    /**
     * Acknowledge the print result from the designated POS Bar printer.
     * Enforces fencing token: claim_token must match the current database value.
     * Rejects acknowledgment if token is missing, wrong, or superseded by another station.
     */
    public function acknowledge(Request $request)
    {
        $validated = $request->validate([
            'request_id' => 'required|string',
            'claim_token' => 'required|string',
            'status' => 'required|string|in:printed,failed',
            'error_message' => 'nullable|string',
        ]);

        $requestId = $validated['request_id'];
        $claimToken = $validated['claim_token'];

        return DB::transaction(function () use ($validated, $requestId, $claimToken) {
            $printReq = BarPrintRequest::where('request_id', $requestId)
                ->lockForUpdate()
                ->first();

            if (!$printReq) {
                return $this->error('Print request not found', null, 404);
            }

            // Fencing token check: token must match exactly
            if (empty($printReq->claim_token) || $printReq->claim_token !== $claimToken) {
                return $this->error('Claim token is invalid or has been superseded by another station', [
                    'status' => 'claim_superseded',
                    'reason' => 'token_mismatch',
                    'current_status' => $printReq->status,
                ], 409);
            }

            $updateData = [
                'status' => $validated['status'],
                'error_message' => $validated['error_message'] ?? null,
            ];

            if ($validated['status'] === 'printed') {
                $updateData['printed_at'] = now();
            }

            $printReq->update($updateData);

            return $this->success($printReq, 'Print request status updated');
        });
    }

    /**
     * Manually trigger reprint of a print request if staff needs reprint.
     * Creates a new BarPrintRequest record with a distinct request_id linked to the original order,
     * ensuring cache-free processing on the printer station without needing a browser reload.
     */
    public function reprint($id)
    {
        $originalReq = is_numeric($id)
            ? BarPrintRequest::find($id)
            : BarPrintRequest::where('request_id', $id)->first();

        if (!$originalReq) {
            return $this->error('Print request not found', null, 404);
        }

        // Generate a new distinct request_id linked to the order
        $newRequestId = 'pr-rep-' . $originalReq->order_id . '-' . round(microtime(true) * 1000) . '-' . Str::random(4);

        $newPrintReq = BarPrintRequest::create([
            'request_id' => $newRequestId,
            'order_id' => $originalReq->order_id,
            'table_name' => $originalReq->table_name,
            'table_id' => $originalReq->table_id,
            'title' => $originalReq->title,
            'items' => $originalReq->items,
            'order_note' => $originalReq->order_note,
            'staff_name' => $originalReq->staff_name,
            'status' => 'pending',
        ]);

        broadcast(new DrinkPrintRequested($newPrintReq->toArray()));

        return $this->success($newPrintReq, 'Print request re-queued for printing');
    }
}
