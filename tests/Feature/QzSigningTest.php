<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class QzSigningTest extends TestCase
{
    use RefreshDatabase;

    private function createStaffUser(): User
    {
        return User::create([
            'name'     => 'Staff Cashier',
            'email'    => 'cashier@example.com',
            'password' => bcrypt('password123'),
            'role'     => 'cashier',
        ]);
    }

    /**
     * TC-01: Chữ ký hợp lệ và được xác minh thành công bằng public certificate.
     */
    public function test_authenticated_user_can_sign_payload_and_verified_by_public_cert(): void
    {
        $user = $this->createStaffUser();
        $payload = 'sample_qz_tray_challenge_hash_abcdef1234567890';

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/qz/sign', [
            'request' => $payload,
        ]);

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'text/plain; charset=UTF-8');

        $base64Signature = $response->getContent();
        $this->assertNotEmpty($base64Signature);

        $binarySignature = base64_decode($base64Signature, true);
        $this->assertNotFalse($binarySignature, 'Chữ ký trả về phải là chuỗi Base64 hợp lệ.');

        // Nạp chứng chỉ công khai từ public directory
        $certPath = public_path('assets/signing/digital-certificate.txt');
        $this->assertFileExists($certPath);

        $certContent = file_get_contents($certPath);
        $publicKey = openssl_pkey_get_public($certContent);
        $this->assertNotFalse($publicKey, 'Public certificate phải phân tích được khóa công khai.');

        // Xác minh chữ ký số SHA512
        $verify = openssl_verify($payload, $binarySignature, $publicKey, 'sha512');
        $this->assertSame(1, $verify, 'Chữ ký số tạo từ backend phải được xác thực thành công (kết quả bằng 1) bởi public certificate.');
    }

    /**
     * TC-02: Chữ ký bị từ chối nếu payload bị sửa đổi (tampered data).
     */
    public function test_signature_verification_fails_when_payload_is_tampered(): void
    {
        $user = $this->createStaffUser();
        $originalPayload = 'original_qz_tray_payload_to_sign';

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/qz/sign', [
            'request' => $originalPayload,
        ]);

        $response->assertStatus(200);
        $binarySignature = base64_decode($response->getContent(), true);

        $certContent = file_get_contents(public_path('assets/signing/digital-certificate.txt'));
        $publicKey = openssl_pkey_get_public($certContent);

        // Giả mạo dữ liệu
        $tamperedPayload = $originalPayload . '_tampered_modification';
        $verify = openssl_verify($tamperedPayload, $binarySignature, $publicKey, 'sha512');

        $this->assertSame(0, $verify, 'openssl_verify phải trả về 0 khi payload bị thay đổi.');
    }

    /**
     * TC-03: Request không có authentication phải bị từ chối với HTTP 401.
     */
    public function test_unauthenticated_request_is_rejected_with_401(): void
    {
        $response = $this->postJson('/api/qz/sign', [
            'request' => 'unauthenticated_attempt',
        ]);

        $response->assertStatus(401);
    }

    /**
     * TC-04: Thiếu tham số request phải trả về HTTP 400.
     */
    public function test_missing_request_parameter_returns_400(): void
    {
        $user = $this->createStaffUser();

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/qz/sign', []);

        $response->assertStatus(400);
        $this->assertStringContainsString('Missing "request" parameter', $response->getContent());
    }

    /**
     * TC-05: Payload vượt quá độ dài cho phép phải trả về HTTP 422.
     */
    public function test_payload_exceeding_max_length_returns_422(): void
    {
        $user = $this->createStaffUser();
        $longPayload = str_repeat('A', 2049);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/qz/sign', [
            'request' => $longPayload,
        ]);

        $response->assertStatus(422);
        $this->assertStringContainsString('exceeds maximum allowed length', $response->getContent());
    }
}
