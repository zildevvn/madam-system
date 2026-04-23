import React from 'react';
import { formatPrice } from '../../shared/utils/formatCurrency';

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
                        <span>{(() => {
                            const isGroupReservation = order.reservation && order.reservation.type === 'group';
                            if (isGroupReservation && Array.isArray(order.reservation.table_ids)) {
                                return order.reservation.table_ids
                                    .map(id => id.toString().replace(/^Bàn\s+/i, ''))
                                    .sort((a, b) => parseInt(a) - parseInt(b))
                                    .join('-');
                            }
                            return (order.tableName || tableName || order.table?.name || order.table?.id.toString() || '-')
                                .toString()
                                .replace(/^Bàn\s+/i, '');
                        })()}</span>
                    </div>

                    {order.reservation && order.reservation.type === 'group' && (
                        <>
                            {(order.reservation.company_name || order.reservation.lead_name) && (
                                <div className="receipt-meta-row">
                                    <span>Đoàn / Tour</span>
                                    <span style={{ fontWeight: 'bold' }}>{order.reservation.company_name || order.reservation.lead_name}</span>
                                </div>
                            )}
                            {order.reservation.tour_guide_name && (
                                <div className="receipt-meta-row">
                                    <span>Hướng dẫn</span>
                                    <span>{order.reservation.tour_guide_name}</span>
                                </div>
                            )}
                        </>
                    )}

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
                        <span className="receipt-note">{order.cashier_note || order.note || '-'}</span>
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
                        {(() => {
                            const isGroupReservation = order.reservation && order.reservation.type === 'group';
                            const groupTableIds = isGroupReservation && Array.isArray(order.reservation.table_ids)
                                ? order.reservation.table_ids.map(id => id.toString().replace(/^Bàn\s+/i, '')).sort((a, b) => parseInt(a) - parseInt(b))
                                : [];

                            const tablesWithItems = Object.entries(
                                orderItems.reduce((acc, item) => {
                                    // [RULE] Sync with PaymentItemEditor.jsx grouping logic
                                    let tGroup;
                                    if (isGroupReservation) {
                                        // Shared pre-order items go to GROUP, individual extras go to their table
                                        tGroup = item.reservation_item_id ? 'GROUP' : (item.tableId || 'GROUP');
                                    } else {
                                        // Standard staff-merge: group by table
                                        tGroup = item.tableId || order.tableId;
                                    }

                                    if (!acc[tGroup]) acc[tGroup] = [];
                                    acc[tGroup].push(item);
                                    return acc;
                                }, {})
                            ).sort(([a], [b]) => {
                                if (a === 'GROUP') return -1;
                                if (b === 'GROUP') return 1;
                                return Number(a) - Number(b);
                            });

                            const showTableHeaders = tablesWithItems.length > 1 || isGroupReservation;

                            return tablesWithItems.map(([tGroup, tableItems]) => {
                                const subtotal = tableItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
                                const isSharedSection = tGroup === 'GROUP';

                                // [SYNC] Use same naming as PaymentItemEditor
                                const displayTableTitle = isSharedSection
                                    ? `Món chung${groupTableIds.length > 0 ? ` (Bàn ${groupTableIds.join('-')})` : ''}`
                                    : `Bàn ${tGroup.toString().split('-')[0]}`;

                                return (
                                    <React.Fragment key={tGroup}>
                                        {showTableHeaders && (
                                            <tr className="receipt-table-header-row">
                                                <td colSpan="3" align="left" style={{
                                                    fontWeight: 'bold',
                                                    backgroundColor: isSharedSection ? '#fff5f0' : '#f9f9f9',
                                                    padding: '4px 8px',
                                                    fontSize: '10px',
                                                    borderBottom: '1px solid #eee',
                                                    color: isSharedSection ? '#ff4d00' : 'inherit',
                                                    textTransform: 'uppercase'
                                                }}>
                                                    {displayTableTitle}
                                                </td>
                                            </tr>
                                        )}
                                        {tableItems.map((item, idx) => (
                                            <tr key={idx}>
                                                <td align="left">
                                                    <div className="receipt-item-name">{item.name || item.product?.name || 'Sản phẩm'}</div>
                                                    <div className="receipt-item-price">{formatPrice(item.price || 0)}</div>
                                                </td>
                                                <td align="center">{item.quantity}</td>
                                                <td align="right">{formatPrice((item.price || 0) * item.quantity)}</td>
                                            </tr>
                                        ))}
                                        {showTableHeaders && (
                                            <tr className="receipt-subtotal-row" style={{ marginBottom: '8px' }}>
                                                <td colSpan="2" align="right" style={{ borderTop: '1px dashed #eee', padding: '6px 0', fontSize: '9px', fontStyle: 'italic', color: '#666' }}>
                                                    Cộng {isSharedSection ? 'phần chung' : `bàn ${tGroup}`}:
                                                </td>
                                                <td align="right" style={{ borderTop: '1px dashed #eee', padding: '6px 0', fontSize: '9px', fontWeight: 'bold' }}>
                                                    {formatPrice(subtotal)}
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            });
                        })()}
                        <tr className="receipt-total-row">
                            <td align="left">Tiền hàng ({totalQuantity})</td>
                            <td colSpan="2" align="right">{formatPrice(subtotal)}</td>
                        </tr>
                        {discountAmount > 0 && (
                            <tr className="receipt-total-row">
                                <td align="left">Giảm giá {discountType === 'percent' ? `(${discountValue}%)` : ''}</td>
                                <td colSpan="2" align="right">-{formatPrice(discountAmount)}</td>
                            </tr>
                        )}
                    </tbody>
                </table>

                <div className="receipt-final">
                    <span>THANH TOÁN</span>
                    <span className="receipt-final-amount">{formatPrice(finalTotal)} đ</span>
                </div>

                <div className="receipt-footer">
                    <p>Cảm ơn Quý khách - Hẹn gặp lại!</p>
                </div>
            </div>
        </div>
    );
};
export default Receipt;
