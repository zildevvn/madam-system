import React from 'react';

const Receipt = ({ order, tableName }) => {
    if (!order) return null;

    const totalAmount = order.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    const totalQuantity = order.items.reduce((total, item) => total + item.quantity, 0);
    const orderItems = order.items || [];

    return (
        <div id="receipt-print-area" className="receipt-print-only">
            <div className="receipt-container">
                <div className="receipt-header">
                    <h2 className="receipt-title">HÓA ĐƠN THANH TOÁN</h2>
                    <p className="receipt-subtitle">Số {order.id}</p>
                </div>

                <div className="receipt-meta">
                    <div className="receipt-meta-row">
                        <span>Tại bàn</span>
                        <span>{tableName || order.table?.name || order.table?.id || '-'}</span>
                    </div>
                    <div className="receipt-meta-row">
                        <span>Giờ vào</span>
                        <span>{new Intl.DateTimeFormat('vi-VN', { 
                            hour: '2-digit', minute: '2-digit', 
                            day: '2-digit', month: '2-digit', year: 'numeric' 
                        }).format(new Date(order.startTime || order.created_at)).replace(',', '')}</span>
                    </div>
                    <div className="receipt-meta-row">
                        <span>Giờ in</span>
                        <span>{new Intl.DateTimeFormat('vi-VN', { 
                            hour: '2-digit', minute: '2-digit', 
                            day: '2-digit', month: '2-digit', year: 'numeric' 
                        }).format(new Date()).replace(',', '')}</span>
                    </div>
                    <div className="receipt-meta-row">
                        <span>Thu ngân</span>
                        <span>Nhân viên</span>
                    </div>
                    <div className="receipt-meta-row">
                        <span>Phục vụ</span>
                        <span>Phục vụ</span>
                    </div>
                    <div className="receipt-meta-row">
                        <span>*Ghi chú</span>
                        <span className="receipt-note">-</span>
                    </div>
                </div>

                <table className="receipt-table">
                    <thead>
                        <tr>
                            <th align="left">Mặt hàng</th>
                            <th align="center">SL/TL</th>
                            <th align="right">T.Tiền</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orderItems.map((item, idx) => (
                            <tr key={idx}>
                                <td align="left">
                                    <div className="receipt-item-name">{item.name || item.product?.name || 'Sản phẩm'}</div>
                                    <div className="receipt-item-price">{(item.price || 0).toLocaleString()}</div>
                                </td>
                                <td align="center">{item.quantity}</td>
                                <td align="right">{((item.price || 0) * item.quantity).toLocaleString()}</td>
                            </tr>
                        ))}
                        <tr className="receipt-total-row">
                            <td align="left">Tiền hàng ({totalQuantity})</td>
                            <td colSpan="2" align="right">{totalAmount.toLocaleString()}</td>
                        </tr>
                    </tbody>
                </table>

                <div className="receipt-final">
                    <span>THANH TOÁN</span>
                    <span className="receipt-final-amount">{totalAmount.toLocaleString()} đ</span>
                </div>

                <div className="receipt-footer">
                    <p>Cảm ơn Quý khách - Hẹn gặp lại!</p>
                </div>
            </div>
        </div>
    );
};

export default Receipt;
