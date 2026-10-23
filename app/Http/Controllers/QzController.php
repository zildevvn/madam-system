<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;

class QzController extends Controller
{
    /**
     * Ký số thông điệp từ QZ Tray (Message Signing) bằng RSA Private Key và thuật toán SHA512.
     * Cho phép in ấn im lặng (Silent Printing) mà không hiện popup cảnh báo bảo mật.
     *
     * @param Request $request
     * @return Response
     */
    public function sign(Request $request): Response
    {
        try {
            // 1. Nhận chuỗi dữ liệu QZ Tray cần ký từ body (POST) hoặc query string (GET fallback)
            $toSign = $request->input('request') ?? $request->query('request');

            if ($toSign === null || $toSign === '') {
                return response('Missing "request" parameter to sign', 400)
                    ->header('Content-Type', 'text/plain');
            }

            // Giới hạn độ dài payload để ngăn chặn lạm dụng (QZ Tray hash thường < 256 ký tự)
            if (!is_string($toSign) || strlen($toSign) > 2048) {
                return response('Payload exceeds maximum allowed length', 422)
                    ->header('Content-Type', 'text/plain');
            }

            // 2. Đường dẫn an toàn tới file khóa bí mật (Private Key)
            $keyPath = storage_path('app/qz/private-key.pem');

            if (!file_exists($keyPath) || !is_readable($keyPath)) {
                Log::error('QZ Signing: Private key not found or not readable.');
                return response('Private key file not found or not readable', 500)
                    ->header('Content-Type', 'text/plain');
            }

            // 3. Đọc nội dung file và nạp RSA Private Key
            $keyContent = file_get_contents($keyPath);
            $privateKey = openssl_get_privatekey($keyContent);

            if (!$privateKey) {
                Log::error('QZ Signing: Failed to parse OpenSSL private key.');
                return response('Invalid private key', 500)
                    ->header('Content-Type', 'text/plain');
            }

            // 4. Tạo chữ ký số với thuật toán SHA512 (Ký nguyên văn $toSign)
            $signature = '';
            $signed = openssl_sign($toSign, $signature, $privateKey, 'sha512');

            if (!$signed) {
                Log::error('QZ Signing: openssl_sign failed to generate signature.');
                return response('Failed to generate digital signature', 500)
                    ->header('Content-Type', 'text/plain');
            }

            // 5. Trả về kết quả Base64 với Header Content-Type: text/plain và HTTP status 200
            return response(base64_encode($signature), 200)
                ->header('Content-Type', 'text/plain');

        } catch (\Throwable $e) {
            Log::error('QZ Signing Error: ' . $e->getMessage());

            return response('Error signing request', 500)
                ->header('Content-Type', 'text/plain');
        }
    }
}
