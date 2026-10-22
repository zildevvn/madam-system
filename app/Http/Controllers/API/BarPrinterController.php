<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\BarPrintRequest;
use App\Events\DrinkPrintRequested;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class BarPrinterController extends Controller
{
    use ApiResponse;
    /**
     * Get all pending bar print requests created within the last 2 hours.
     * Used by POS when coming online or reconnecting.
     */
    public function getPendingRequests()
    {
        $requests = BarPrintRequest::where('status', 'pending')
            ->where('created_at', '>=', now()->subHours(2))
            ->orderBy('id', 'asc')
            ->get();

        return $this->success($requests, 'Pending bar print requests retrieved');
    }

    /**
     * Acknowledge the print result from the designated POS Bar printer.
     */
    public function acknowledge(Request $request)
    {
        $validated = $request->validate([
            'request_id' => 'required|string',
            'status' => 'required|string|in:printed,failed',
            'error_message' => 'nullable|string'
        ]);

        $printReq = BarPrintRequest::where('request_id', $validated['request_id'])->first();

        if (!$printReq) {
            return $this->error('Print request not found', null, 404);
        }

        $updateData = [
            'status' => $validated['status'],
            'error_message' => $validated['error_message'] ?? null
        ];

        if ($validated['status'] === 'printed') {
            $updateData['printed_at'] = now();
        }

        $printReq->update($updateData);

        return $this->success($printReq, 'Print request status updated');
    }

    /**
     * Manually trigger re-broadcast of a print request if staff needs reprint.
     */
    public function reprint($id)
    {
        $printReq = BarPrintRequest::findOrFail($id);
        $printReq->update(['status' => 'pending']);

        broadcast(new DrinkPrintRequested($printReq->toArray()));

        return $this->success($printReq, 'Print request re-queued for printing');
    }
}
