import React, { useState, useEffect } from 'react';
import qz from 'qz-tray';

const PrinterTest = () => {
    const [status, setStatus] = useState('Đang kiểm tra kết nối QZ Tray...');
    const [isAvailable, setIsAvailable] = useState(false);
    const [cashierPrinter, setCashierPrinter] = useState('Xprinter_Cashier');
    const [barPrinter, setBarPrinter] = useState('Xprinter_Bar');

    // Tự động kiểm tra xem phần mềm QZ Tray trên Mac có đang bật không khi vào trang
    useEffect(() => {
        const checkQZConnection = async () => {
            try {
                if (!qz.websocket.isActive()) {
                    await qz.websocket.connect();
                }
                setStatus('🟢 Đã kết nối thành công tới phần mềm QZ Tray trên Mac!');
                setIsAvailable(true);
            } catch (error) {
                setStatus('🔴 Không thể kết nối tới QZ Tray. Hãy chắc chắn ứng dụng QZ Tray đang chạy trên Mac!');
                setIsAvailable(false);
                console.error(error);
            }
        };

        checkQZConnection();

        // Cleanup: Đóng kết nối khi rời khỏi trang test để không ảnh hưởng page khác
        return () => {
            if (qz.websocket.isActive()) {
                qz.websocket.disconnect().catch(console.error);
            }
        };
    }, []);

    // Hàm test in máy Thu Ngân (Đã sửa cú pháp cấu hình khổ giấy cho máy HP LaserJet)
    const testPrintCashier = async () => {
        if (!isAvailable) return alert('QZ Tray chưa sẵn sàng!');
        try {
            setStatus(`⏳ Đang gửi lệnh in đồ họa tới máy văn phòng: ${cashierPrinter}...`);

            // Cách cấu hình đúng của QZ Tray: Truyền size và margins trực tiếp vào object options
            const config = qz.configs.create(cashierPrinter, {
                size: { width: 148, height: 210 }, // Khổ giấy A5 tính bằng milimet (mm)
                units: 'mm',
                margins: { top: 10, right: 10, bottom: 10, left: 10 } // Đặt lề 10mm giúp máy HP không lệch chữ
            });

            // Nội dung HTML hóa đơn hiển thị tiếng Việt chỉn chu trên máy in HP
            const htmlData = [{
                type: 'html',
                format: 'plain',
                data: `
                    <div style="font-family: Arial, sans-serif; padding: 10px; width: 100%; box-sizing: border-box;">
                        <h2 style="text-align: center; margin-bottom: 5px; text-transform: uppercase;">Hóa Đơn Thanh Toán</h2>
                        <p style="text-align: center; font-size: 13px; margin-top: 0; color: #555;">(Hệ thống kiểm tra máy in HP LaserJet)</p>
                        <hr style="border: none; border-top: 1px dashed #000; margin: 15px 0;"/>
                        
                        <p style="margin: 5px 0;"><b>Mã đơn hàng:</b> #100234</p>
                        <p style="margin: 5px 0;"><b>Thời gian in:</b> ${new Date().toLocaleString('vi-VN')}</p>
                        <p style="margin: 5px 0;"><b>Trạng thái:</b> Kết nối hệ thống thành công</p>
                        
                        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                            <thead>
                                <tr style="border-bottom: 1px solid #000;">
                                    <th style="text-align: left; padding: 5px 0;">Tên món / Sản phẩm</th>
                                    <th style="text-align: center; padding: 5px 0; width: 50px;">SL</th>
                                    <th style="text-align: right; padding: 5px 0; width: 100px;">Thành tiền</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style="padding: 8px 0;">Cà phê sữa đá đặc biệt</td>
                                    <td style="text-align: center; padding: 8px 0;">2</td>
                                    <td style="text-align: right; padding: 8px 0;">60.000đ</td>
                                </tr>
                                <tr style="border-top: 1px dashed #ccc;">
                                    <td style="padding: 8px 0;">Bánh ngọt Phô mai Pháp</td>
                                    <td style="text-align: center; padding: 8px 0;">1</td>
                                    <td style="text-align: right; padding: 8px 0;">45.000đ</td>
                                </tr>
                            </tbody>
                        </table>
                        
                        <hr style="border: none; border-top: 1px dashed #000; margin: 15px 0;"/>
                        <div style="text-align: right; font-size: 16px; font-weight: bold;">
                            TỔNG THANH TOÁN: 105.000đ
                        </div>
                    </div>
                `
            }];

            await qz.print(config, htmlData);
            setStatus(`✅ Máy HP [${cashierPrinter}] đã nhận lệnh vẽ HTML và đang xử lý kéo giấy!`);
        } catch (error) {
            setStatus(`❌ Lỗi in máy văn phòng HP: ${error.message}`);
        }
    };

    // Hàm test in máy Quầy Nước (Đã sửa cú pháp cấu hình khổ giấy K80 cuộn cho Xprinter)
    const testPrintBarHTML = async () => {
        if (!isAvailable) return alert('QZ Tray chưa sẵn sàng!');
        try {
            setStatus(`⏳ Đang gửi lệnh in HTML tới máy: ${barPrinter}...`);

            // Cấu hình chuẩn cho giấy in nhiệt liên tục (K80): width cố định, height tự động giãn, không tự scale to phồng chữ
            const config = qz.configs.create(barPrinter, {
                size: { width: 80 },
                units: 'mm',
                margins: 0,
                scaleContent: false
            });

            const htmlData = [{
                type: 'html',
                format: 'plain',
                data: `
                    <div style="font-family: 'Courier New', Courier, monospace; width: 100%; font-size: 14px; padding: 5px; box-sizing: border-box;">
                        <div style="text-align: center; font-weight: bold; font-size: 16px;">
                            PHIẾU PHA CHẾ
                        </div>
                        <div style="text-align: center; margin-bottom: 10px;">
                            --------------------------------
                        </div>
                        <div><b>Trạng thái:</b> Kiểm tra có dấu thành công</div>
                        <div><b>Thời gian:</b> ${new Date().toLocaleTimeString()}</div>
                        <div style="margin: 10px 0;">--------------------------------</div>
                        <div style="font-size: 16px; font-weight: bold;">
                            [ ] 02 Trà Sữa Trân Châu Đường Đen<br>
                            [ ] 01 Cà Phê Sữa Đá (Ít Ngọt)<br>
                        </div>
                        <div style="text-align: center; margin-top: 10px;">
                            --------------------------------
                        </div>
                    </div>
                `
            }];

            await qz.print(config, htmlData);
            setStatus(`✅ Đã in thành công tại máy: ${barPrinter}`);
        } catch (error) {
            setStatus(`❌ Lỗi in máy quầy nước: ${error.message}`);
        }
    };

    return (
        <div style={{ padding: '30px', maxWidth: '600px', margin: '50px auto', border: '1px solid #ccc', borderRadius: '8px', fontFamily: 'sans-serif' }}>
            <h2>📋 Xprinter Antigravity Print Test</h2>

            <div style={{ padding: '15px', backgroundColor: '#f0f0f0', borderRadius: '4px', marginBottom: '20px', fontWeight: 'bold' }}>
                Trạng thái hệ thống: <span style={{ color: isAvailable ? 'green' : 'red' }}>{status}</span>
            </div>

            <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Tên Máy In Thu Ngân (HP LaserJet):</label>
                <input
                    type="text"
                    value={cashierPrinter}
                    onChange={(e) => setCashierPrinter(e.target.value)}
                    style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                />
            </div>

            <div style={{ marginBottom: '30px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Tên Máy In Quầy Nước (Xprinter tương lai):</label>
                <input
                    type="text"
                    value={barPrinter}
                    onChange={(e) => setBarPrinter(e.target.value)}
                    style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                />
            </div>

            <div style={{ display: 'flex', gap: '15px' }}>
                <button
                    onClick={testPrintCashier}
                    disabled={!isAvailable}
                    style={{ flex: 1, padding: '12px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: isAvailable ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}
                >
                    🖨️ Test Máy Thu Ngân (In HTML - Cho HP)
                </button>

                <button
                    onClick={testPrintBarHTML}
                    disabled={!isAvailable}
                    style={{ flex: 1, padding: '12px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: isAvailable ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}
                >
                    ☕ Test Máy Quầy Nước (In HTML K80)
                </button>
            </div>
        </div>
    );
};

export default PrinterTest;
