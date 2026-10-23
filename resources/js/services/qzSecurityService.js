import qz from 'qz-tray';
import axios from 'axios';

/**
 * Cờ theo dõi trạng thái cấu hình bảo mật QZ Tray để tránh gán lặp lại nhiều lần.
 */
let isConfigured = false;

/**
 * Lấy Bearer token từ localStorage của phiên đăng nhập hiện tại.
 * @returns {Object}
 */
const getAuthHeaders = () => {
    try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const user = JSON.parse(storedUser);
            if (user && user.token) {
                return { 'Authorization': `Bearer ${user.token}` };
            }
        }
    } catch {
        // Bỏ qua lỗi parse JSON nếu có
    }
    return {};
};

/**
 * Thiết lập cơ chế Xác thực & Ký số (Message Signing) cho QZ Tray.
 * Cấu hình này giúp QZ Tray xác thực ứng dụng web và tự động tắt (silent) các hộp thoại cảnh báo bảo mật.
 *
 * Quy trình:
 * 1. Certificate Promise: Cung cấp chứng chỉ số công khai (X.509 Digital Certificate) cho QZ Tray.
 * 2. Signature Algorithm: Thiết lập thuật toán mã hóa SHA512 (tương thích QZ Tray 2.3.0).
 * 3. Signature Promise: Ủy quyền ký số các payload của QZ Tray qua backend Laravel (`POST /api/qz/sign`).
 *
 * @param {boolean} [forceReload=false] - Bắt buộc nạp lại cấu hình nếu cần
 */
export const setupQzSecurity = (forceReload = false) => {
    if (isConfigured && !forceReload) {
        return;
    }

    try {
        // 1. Cung cấp chứng chỉ công khai (Digital Certificate)
        qz.security.setCertificatePromise((resolve, reject) => {
            fetch('/assets/signing/digital-certificate.txt', { cache: 'no-store' })
                .then((response) => {
                    if (!response.ok) {
                        throw new Error(`Không thể nạp chứng chỉ QZ Tray (Mã lỗi: ${response.status})`);
                    }
                    return response.text();
                })
                .then((cert) => {
                    resolve(cert);
                })
                .catch((error) => {
                    console.error('[QZ Security] Lỗi tải chứng chỉ số:', error);
                    reject(error);
                });
        });

        // 2. Thiết lập thuật toán ký số SHA512 đồng bộ với backend Laravel và QZ Tray 2.3.0
        qz.security.setSignatureAlgorithm('SHA512');

        // 3. Cung cấp hàm ký số (Signature Promise) gửi chuỗi toSign qua POST API có xác thực Sanctum
        qz.security.setSignaturePromise((toSign) => {
            return (resolve, reject) => {
                axios.post('/api/qz/sign', { request: toSign }, {
                    headers: {
                        ...getAuthHeaders(),
                        'Accept': 'text/plain',
                        'Content-Type': 'application/json',
                    },
                    responseType: 'text',
                })
                    .then((response) => {
                        resolve(response.data);
                    })
                    .catch((error) => {
                        const errMsg = error.response?.data || error.message || 'Signature request failed';
                        console.error('[QZ Security] Lỗi thực hiện ký số thông điệp:', errMsg);
                        reject(errMsg);
                    });
            };
        });

        isConfigured = true;
    } catch (err) {
        console.error('[QZ Security] Khởi tạo bảo mật QZ Tray thất bại:', err);
    }
};

/**
 * Kiểm tra xem QZ Security đã được cấu hình chưa.
 * @returns {boolean}
 */
export const isQzSecurityConfigured = () => isConfigured;

export default setupQzSecurity;
