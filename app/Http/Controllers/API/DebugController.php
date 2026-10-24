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

    public function qzDiagnostic()
    {
        $keyPath = storage_path('app/qz/private-key.pem');
        $certPath = public_path('assets/signing/digital-certificate.txt');

        $diag = [
            'timestamp' => now()->toIso8601String(),
            'php_version' => PHP_VERSION,
            'sapi' => PHP_SAPI,
            'current_user' => function_exists('get_current_user') ? get_current_user() : null,
            'process_uid' => function_exists('posix_geteuid') ? posix_geteuid() : null,
            'process_gid' => function_exists('posix_getegid') ? posix_getegid() : null,
            'base_path' => base_path(),
            'storage_path' => storage_path(),
            'config_cached' => app()->configurationIsCached(),
            'routes_cached' => app()->routesAreCached(),

            // Key path checks
            'key_path' => $keyPath,
            'realpath' => realpath($keyPath) ?: null,
            'is_link' => is_link($keyPath),
            'link_target' => is_link($keyPath) ? readlink($keyPath) : null,
            'file_exists' => file_exists($keyPath),
            'is_file' => is_file($keyPath),
            'is_readable' => is_readable($keyPath),
            'fileperms_octal' => file_exists($keyPath) ? substr(sprintf('%o', fileperms($keyPath)), -4) : null,
            'fileowner_uid' => file_exists($keyPath) ? fileowner($keyPath) : null,
            'filegroup_gid' => file_exists($keyPath) ? filegroup($keyPath) : null,

            // Parent directories traversal checks
            'parent_dirs' => [
                'storage' => [
                    'path' => storage_path(),
                    'exists' => file_exists(storage_path()),
                    'is_readable' => is_readable(storage_path()),
                    'perms' => file_exists(storage_path()) ? substr(sprintf('%o', fileperms(storage_path())), -4) : null,
                ],
                'storage_app' => [
                    'path' => storage_path('app'),
                    'exists' => file_exists(storage_path('app')),
                    'is_readable' => is_readable(storage_path('app')),
                    'perms' => file_exists(storage_path('app')) ? substr(sprintf('%o', fileperms(storage_path('app'))), -4) : null,
                ],
                'storage_app_qz' => [
                    'path' => storage_path('app/qz'),
                    'exists' => file_exists(storage_path('app/qz')),
                    'is_readable' => is_readable(storage_path('app/qz')),
                    'perms' => file_exists(storage_path('app/qz')) ? substr(sprintf('%o', fileperms(storage_path('app/qz'))), -4) : null,
                ],
            ],

            // Other potential candidate locations on cPanel
            'candidates' => [
                storage_path('app/private/qz/private-key.pem') => file_exists(storage_path('app/private/qz/private-key.pem')),
                storage_path('private-key.pem') => file_exists(storage_path('private-key.pem')),
                base_path('../repositories/madam-system/storage/app/qz/private-key.pem') => file_exists(base_path('../repositories/madam-system/storage/app/qz/private-key.pem')),
                '/home/huhwqacu/banhnamhue.com/storage/app/qz/private-key.pem' => file_exists('/home/huhwqacu/banhnamhue.com/storage/app/qz/private-key.pem'),
            ],

            // OpenSSL check (without exposing private key)
            'openssl' => [
                'loaded' => extension_loaded('openssl'),
                'key_parsable' => false,
                'key_type' => null,
                'key_bits' => null,
                'cert_exists' => file_exists($certPath),
                'cert_parsable' => false,
                'matches_cert' => false,
                'error_string' => null,
            ],
        ];

        if (file_exists($keyPath) && is_readable($keyPath)) {
            $content = file_get_contents($keyPath);
            $key = openssl_get_privatekey($content);
            if ($key) {
                $diag['openssl']['key_parsable'] = true;
                $details = openssl_pkey_get_details($key);
                $diag['openssl']['key_type'] = $details['type'] ?? null;
                $diag['openssl']['key_bits'] = $details['bits'] ?? null;

                if (file_exists($certPath)) {
                    $certContent = file_get_contents($certPath);
                    $cert = openssl_x509_read($certContent);
                    if ($cert) {
                        $diag['openssl']['cert_parsable'] = true;
                        $diag['openssl']['matches_cert'] = (bool) openssl_x509_check_private_key($cert, $key);
                    }
                }
            } else {
                $diag['openssl']['error_string'] = openssl_error_string();
            }
        }

        return response()->json($diag);
    }
}

