import React, { useState, useEffect } from 'react';
import { setupQzSecurity } from '../services/qzSecurityService';
import qz from 'qz-tray';

const PrinterTest = () => {
    const [status, setStatus] = useState('Đang kiểm tra kết nối QZ Tray...');
    const [isAvailable, setIsAvailable] = useState(false);
    const [cashierPrinter, setCashierPrinter] = useState('Xprinter_Cashier');
    const [barPrinter, setBarPrinter] = useState('Xprinter_Bar');

    // Tự động cấu hình Bảo mật & Kiểm tra kết nối QZ Tray khi mount
    useEffect(() => {
        const initQZ = async () => {
            try {
                // 1. Cấu hình Certificate (Đọc tệp công khai từ thư mục public)
                setupQzSecurity();


                // 3. Thực hiện kết nối tới QZ Tray Client
                if (!qz.websocket.isActive()) {
                    await qz.websocket.connect();
                }
                setStatus('🟢 Đã kết nối & xác thực thành công với QZ Tray!');
                setIsAvailable(true);
            } catch (error) {
                setStatus('🔴 Không thể kết nối tới QZ Tray. Hãy chắc chắn ứng dụng QZ Tray đang chạy!');
                setIsAvailable(false);
                console.error('Lỗi khởi tạo QZ Tray:', error);
            }
        };

        initQZ();

        // Cleanup: Đóng kết nối khi rời khỏi Component (chỉ đóng nếu thiết bị KHÔNG phải là trạm in Bar)
        return () => {
            const isStation = typeof localStorage !== 'undefined' && localStorage.getItem('is_bar_printer_station') === 'true';
            if (qz.websocket.isActive() && !isStation) {
                qz.websocket.disconnect().catch(console.error);
            }
        };
    }, []);

    // Hàm test in máy Thu Ngân
    const testPrintCashier = async () => {
        if (!isAvailable) return alert('QZ Tray chưa sẵn sàng!');
        try {
            setStatus(`⏳ Đang gửi lệnh in đồ họa tới máy văn phòng: ${cashierPrinter}...`);

            const config = qz.configs.create(cashierPrinter, {
                size: { width: 148, height: 210 }, // Khổ giấy A5 (mm)
                units: 'mm',
                margins: { top: 10, right: 10, bottom: 10, left: 10 }
            });

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

    // Hàm test in máy Quầy Nước K80
    const testPrintBarHTML = async () => {
        if (!isAvailable) return alert('QZ Tray chưa sẵn sàng!');
        try {
            setStatus(`⏳ Đang gửi lệnh in HTML tới máy: ${barPrinter}...`);

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

    const [isStation, setIsStation] = useState(false);

    useEffect(() => {
        const stationStatus = localStorage.getItem('is_bar_printer_station') === 'true';
        setIsStation(stationStatus);
        const savedBarPrinter = localStorage.getItem('bar_printer_name');
        if (savedBarPrinter) setBarPrinter(savedBarPrinter);
    }, []);

    const toggleStation = () => {
        const nextStatus = !isStation;
        setIsStation(nextStatus);
        localStorage.setItem('is_bar_printer_station', nextStatus ? 'true' : 'false');
    };

    const handleSaveBarPrinterName = (name) => {
        setBarPrinter(name);
        localStorage.setItem('bar_printer_name', name);
    };

    return (
        <div style={{ padding: '30px', maxWidth: '650px', margin: '40px auto', border: '1px solid #ccc', borderRadius: '8px', fontFamily: 'sans-serif' }}>
            <h2>Xprinter Print Test</h2>

            <div style={{ padding: '15px', backgroundColor: '#f0f0f0', borderRadius: '4px', marginBottom: '20px', fontWeight: 'bold' }}>
                Trạng thái hệ thống: <span style={{ color: isAvailable ? 'green' : 'red' }}>{status}</span>
            </div>

            <div style={{ padding: '15px', backgroundColor: isStation ? '#e8f5e9' : '#fff3e0', border: `1px solid ${isStation ? '#81c784' : '#ffb74d'}`, borderRadius: '6px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ fontWeight: 'bold', fontSize: '15px' }}>
                            {isStation ? '🟢 Thiết bị này đang là TRẠM IN BAR TỰ ĐỘNG' : '⚪ Thiết bị này CHƯA là Trạm In Bar'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px', maxWidth: '420px' }}>
                            {isStation
                                ? 'Máy này sẽ tự động nhận lệnh in qua Pusher/Echo khi bất kỳ nhân viên nào order trên điện thoại hoặc POS khác.'
                                : 'Bật chế độ này trên máy tính Windows/Mac kết nối máy in Xprinter_Bar.'}
                        </div>
                    </div>
                    <button
                        onClick={toggleStation}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: isStation ? '#d32f2f' : '#2e7d32',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        {isStation ? 'Tắt chế độ' : 'Bật làm Trạm In'}
                    </button>
                </div>
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
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Tên Máy In Quầy Nước (Xprinter_Bar LAN):</label>
                <input
                    type="text"
                    value={barPrinter}
                    onChange={(e) => handleSaveBarPrinterName(e.target.value)}
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
