import React from 'react';

const Receipt = ({ order, tableName, discountType = 'fixed', discountValue = 0 }) => {
    if (!order) return null;

    const subtotal = order.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    const totalQuantity = order.items.reduce((total, item) => total + item.quantity, 0);
    const orderItems = order.items || [];

    const discountAmount = discountType === 'percent' 
        ? Math.min(subtotal, (subtotal * discountValue) / 100) 
        : Math.min(subtotal, discountValue);
    
    const finalTotal = Math.max(0, subtotal - discountAmount);

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
                        <span>{(order.mergedTables || tableName || order.table?.name || order.table?.id.toString() || '-').replace(/^Bàn\s+/i, '')}</span>
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
                        <span>{order.cashier?.name || 'Nhân viên'}</span>
                    </div>
                    <div className="receipt-meta-row">
                        <span>Phục vụ</span>
                        <span>{order.server?.name || order.user?.name || 'Phục vụ'}</span>
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
                        {Object.entries(
                            orderItems.reduce((acc, item) => {
                                const tId = item.tableId || order.tableId;
                                if (!acc[tId]) acc[tId] = [];
                                acc[tId].push(item);
                                return acc;
                            }, {})
                        ).sort(([a], [b]) => a - b).map(([tId, tableItems]) => (
                            <React.Fragment key={tId}>
                                {order.mergedTables && (
                                    <tr className="receipt-table-header-row">
                                        <td colSpan="3" align="left" style={{ fontWeight: 'bold', backgroundColor: '#f9f9f9', padding: '4px 8px', fontSize: '12px' }}>
                                            Bàn {tId}
                                        </td>
                                    </tr>
                                )}
                                {tableItems.map((item, idx) => (
                                    <tr key={idx}>
                                        <td align="left">
                                            <div className="receipt-item-name">{item.name || item.product?.name || 'Sản phẩm'}</div>
                                            <div className="receipt-item-price">{(item.price || 0).toLocaleString()}</div>
                                        </td>
                                        <td align="center">{item.quantity}</td>
                                        <td align="right">{((item.price || 0) * item.quantity).toLocaleString()}</td>
                                    </tr>
                                ))}
                                {order.mergedTables && (
                                    <tr className="receipt-subtotal-row">
                                        <td colSpan="2" align="right" style={{ borderTop: '1px dashed #eee', padding: '6px 0', fontSize: '11px', fontStyle: 'italic', color: '#666' }}>
                                            Cộng bàn {tId}:
                                        </td>
                                        <td align="right" style={{ borderTop: '1px dashed #eee', padding: '6px 0', fontSize: '11px', fontWeight: 'bold' }}>
                                            {tableItems.reduce((sum, i) => sum + (i.price * i.quantity), 0).toLocaleString()}
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                        <tr className="receipt-total-row">
                            <td align="left">Tiền hàng ({totalQuantity})</td>
                            <td colSpan="2" align="right">{subtotal.toLocaleString()}</td>
                        </tr>
                        {discountAmount > 0 && (
                            <tr className="receipt-total-row">
                                <td align="left">Giảm giá {discountType === 'percent' ? `(${discountValue}%)` : ''}</td>
                                <td colSpan="2" align="right">-{discountAmount.toLocaleString()}</td>
                            </tr>
                        )}
                    </tbody>
                </table>

                <div className="receipt-final">
                    <span>THANH TOÁN</span>
                    <span className="receipt-final-amount">{finalTotal.toLocaleString()} đ</span>
                </div>

                <div className="receipt-footer">
                    <p>Cảm ơn Quý khách - Hẹn gặp lại!</p>
                </div>
            </div>
        </div>
    );
};
export default Receipt;
