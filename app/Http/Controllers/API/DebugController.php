<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Services\PrintService;
use App\Events\SystemTestEvent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class DebugController extends Controller
{
    private $printService;

    public function __construct(PrintService $printService)
    {
        $this->printService = $printService;
    }

    public function checkPrinter()
    {
        $ip = env('PRINTER_DRINK_IP', '192.168.1.100');
        $port = env('PRINTER_DRINK_PORT', 9100);

        try {
            $fp = @fsockopen($ip, $port, $errno, $errstr, 2);
            if (!$fp) {
                return response()->json([
                    'status' => 'error',
                    'message' => "KHONG THE KET NOI MAY IN TAI $ip:$port. Loi: $errstr",
                    'details' => [
                        'ip' => $ip,
                        'port' => $port,
                        'env_loaded' => !!env('PRINTER_DRINK_IP')
                    ]
                ], 500);
            }
            fclose($fp);

            // True End-to-End Test: Send print data
            $this->printService->printTestPage();

            return response()->json([
                'status' => 'success',
                'message' => "DA GUI LENH IN TEST den may in tai $ip:$port. Vui long kiem tra giay!"
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function sendTestBroadcast(Request $request)
    {
        try {
            event(new SystemTestEvent("Test broadcast luc " . now()->format('H:i:s')));
            return response()->json([
                'status' => 'success',
                'message' => 'Test event dispatched to Pusher successfully.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Broadcasting failed: ' . $e->getMessage()
            ], 500);
        }
    }
}
