import React from 'react';
import { formatPrice } from '../../shared/utils/formatCurrency';

/**
 * Receipt: Thermal-printer optimized layout for order printing.
 * Updated to support per-item discounts (Fixed or Percent).
 */
const Receipt = ({ order, tableName, discountType = 'fixed', discountValue = 0 }) => {
    const [printDate] = React.useState(new Date());
    if (!order) return null;

    const orderItems = order.items || [];
    
    // [WHY] Per-item discounts must be summed separately from global discount
    const itemDiscountsTotal = orderItems.reduce((sum, i) => {
        const val = Number(i.discount || 0);
        const type = i.discountType || 'fixed';
        const itemGross = i.price * i.quantity;
        
        if (type === 'percent') {
            return sum + (itemGross * val / 100);
        }
        return sum + (val * i.quantity);
    }, 0);

    const grossTotal = orderItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    const totalQuantity = orderItems.reduce((total, item) => total + item.quantity, 0);

    // [WHY] Global discount applies to the total AFTER item discounts
    const remainingAfterItemDiscounts = Math.max(0, grossTotal - itemDiscountsTotal);
    const globalDiscountAmount = discountType === 'percent'
        ? Math.min(remainingAfterItemDiscounts, (remainingAfterItemDiscounts * discountValue) / 100)
        : Math.min(remainingAfterItemDiscounts, discountValue);

    const finalTotal = Math.max(0, remainingAfterItemDiscounts - globalDiscountAmount);

    const formatReceiptDate = (date) => {
        if (!date) return '-';
        return new Intl.DateTimeFormat('vi-VN', {
            hour: '2-digit', minute: '2-digit',
            day: '2-digit', month: '2-digit', year: 'numeric'
        }).format(new Date(date)).replace(',', '');
    };

    // ─── LOGIC: Table & Group Info ───
    const isGroupReservation = order.reservation && order.reservation.type === 'group';
    
    const tableIds = isGroupReservation && Array.isArray(order.reservation.table_ids)
        ? order.reservation.table_ids
            .map(id => id.toString().replace(/^Bàn\s+/i, ''))
            .sort((a, b) => parseInt(a) - parseInt(b))
        : [];

    const displayTableName = tableIds.length > 0
        ? tableIds.join('-')
        : (order.tableName || tableName || order.table?.name || order.table?.id.toString() || '-')
            .toString()
            .replace(/^Bàn\s+/i, '');

    const groupedItems = Object.entries(
        orderItems.reduce((acc, item) => {
            let tGroup;
            if (isGroupReservation) {
                tGroup = item.reservation_item_id ? 'GROUP' : (item.tableId || 'GROUP');
            } else {
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

    const showTableHeaders = groupedItems.length > 1 || isGroupReservation;

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
                        <span>{displayTableName}</span>
                    </div>

                    {isGroupReservation && (
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
                        <span>{formatReceiptDate(order.startTime || order.created_at)}</span>
                    </div>
                    <div className="receipt-meta-row">
                        <span>Giờ in</span>
                        <span>{formatReceiptDate(printDate)}</span>
                    </div>
                    <div className="receipt-meta-row">
                        <span>Thu ngân</span>
                        <span>{order.cashier?.name || 'Nhân viên'}</span>
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
                            <th align="center">SL</th>
                            <th align="right">T.Tiền</th>
                        </tr>
                    </thead>
                    <tbody>
                        {groupedItems.map(([tGroup, tableItems]) => {
                            const sectionGross = tableItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
                            const sectionDiscount = tableItems.reduce((sum, i) => {
                                const val = Number(i.discount || 0);
                                const type = i.discountType || 'fixed';
                                if (type === 'percent') return sum + (i.price * i.quantity * val / 100);
                                return sum + (val * i.quantity);
                            }, 0);

                            const isSharedSection = tGroup === 'GROUP';

                            const displayTableTitle = isSharedSection
                                ? `Món chung${tableIds.length > 0 ? ` (Bàn ${tableIds.join('-')})` : ''}`
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
                                    {tableItems.map((item, idx) => {
                                        const val = Number(item.discount || 0);
                                        const type = item.discountType || 'fixed';
                                        let itemDiscount;
                                        if (type === 'percent') {
                                            itemDiscount = (item.price * val / 100);
                                        } else {
                                            itemDiscount = val;
                                        }
                                        
                                        const itemTotal = (item.price * item.quantity) - (itemDiscount * item.quantity);
                                        return (
                                            <tr key={idx}>
                                                <td align="left">
                                                    <div className="receipt-item-name">{item.name || item.product?.name || 'Sản phẩm'}</div>
                                                    <div className="receipt-item-price">
                                                        {formatPrice(item.price || 0)}
                                                        {val > 0 && <span style={{ color: '#666', fontSize: '8px' }}> (-{type === 'percent' ? `${val}%` : formatPrice(val)})</span>}
                                                    </div>
                                                </td>
                                                <td align="center">{item.quantity}</td>
                                                <td align="right">{formatPrice(itemTotal)}</td>
                                            </tr>
                                        );
                                    })}
                                    {showTableHeaders && (
                                        <tr className="receipt-subtotal-row" style={{ marginBottom: '8px' }}>
                                            <td colSpan="2" align="right" style={{ borderTop: '1px dashed #eee', padding: '6px 0', fontSize: '9px', fontStyle: 'italic', color: '#666' }}>
                                                Cộng {isSharedSection ? 'phần chung' : `bàn ${tGroup}`}:
                                            </td>
                                            <td align="right" style={{ borderTop: '1px dashed #eee', padding: '6px 0', fontSize: '9px', fontWeight: 'bold' }}>
                                                {formatPrice(sectionGross - sectionDiscount)}
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                        
                        <tr className="receipt-total-row" style={{ borderTop: '1px solid #333' }}>
                            <td align="left">Tiền hàng ({totalQuantity})</td>
                            <td colSpan="2" align="right">{formatPrice(grossTotal)}</td>
                        </tr>
                        
                        {itemDiscountsTotal > 0 && (
                            <tr className="receipt-total-row">
                                <td align="left">Giảm giá món</td>
                                <td colSpan="2" align="right">-{formatPrice(itemDiscountsTotal)}</td>
                            </tr>
                        )}

                        {globalDiscountAmount > 0 && (
                            <tr className="receipt-total-row">
                                <td align="left">Giảm giá tổng {discountType === 'percent' ? `(${discountValue}%)` : ''}</td>
                                <td colSpan="2" align="right">-{formatPrice(globalDiscountAmount)}</td>
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
