import React from 'react';
import { formatPrice } from '../../shared/utils/formatCurrency';

/**
 * Receipt: Thermal-printer optimized layout for order printing.
 * Updated to support per-item discounts (Fixed or Percent).
 */
const Receipt = ({ order, tableName, allTables, discountType = 'fixed', discountValue = 0 }) => {
    const [printDate] = React.useState(new Date());

    const resolveTableLabel = (tid) => {
        if (!allTables) return tid;
        const t = allTables.find(tbl => tbl.id.toString() === tid.toString());
        return t?.name?.replace(/^Bàn\s+/i, '') || tid;
    };

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

    // [RULE] Prefer the tableName provided by the parent (Cashier.jsx), 
    // which has already resolved IDs to numeric labels.
    const displayTableName = (tableName || order.tableName || order.table?.name || order.table?.id.toString() || '-')
        .toString()
        .replace(/^Bàn\s+/i, '');

    const groupedItems = Object.entries(
        orderItems.reduce((acc, item) => {
            let tGroup;
            if (isGroupReservation) {
                tGroup = item.reservation_item_id ? 'GROUP' : (item.tableId || 'GROUP');
            } else {
                // [FIX] Normalize grouping ID to database table ID. 
                // Prevents items from splitting into a separate "Bàn [OrderId]" group.
                const dbTableId = order.tableId || order.table_id || order.table?.id;
                tGroup = item.tableId || dbTableId;

                // If the resolved tGroup matches the current order ID (lookup key), 
                // force fallback to the actual table ID.
                if (tGroup?.toString() === order.id?.toString() && dbTableId) {
                    tGroup = dbTableId;
                }
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
                    <h2 className="receipt-title">PAYMENT RECEIPT</h2>
                    <p className="receipt-subtitle">No: #{order.id}</p>
                    {Number(order.print_count || 0) > 1 && (
                        <p className="receipt-subtitle" style={{ fontWeight: 'bold', textTransform: 'uppercase', marginTop: '2px' }}>
                            Reprint #{order.print_count}
                        </p>
                    )}
                </div>

                <div className="receipt-meta">
                    <div className="receipt-meta-row">
                        <span>Table: <span style={{ fontWeight: 'bold' }}>{displayTableName}</span></span>
                    </div>

                    {isGroupReservation && (
                        <>
                            {(order.reservation.company_name || order.reservation.lead_name) && (
                                <div className="receipt-meta-row">
                                    <span>Tour / Group:</span>
                                    <span style={{ fontWeight: 'bold' }}>{order.reservation.company_name || order.reservation.lead_name}</span>
                                </div>
                            )}
                            {order.reservation.tour_guide_name && (
                                <div className="receipt-meta-row">
                                    <span>Guide:</span>
                                    <span>{order.reservation.tour_guide_name}</span>
                                </div>
                            )}
                        </>
                    )}

                    <div className="receipt-meta-row">
                        <span>Arrival Time:</span>
                        <span>{formatReceiptDate(order.startTime || order.created_at)}</span>
                    </div>
                    <div className="receipt-meta-row">
                        <span>Printed Time:</span>
                        <span>{formatReceiptDate(printDate)}</span>
                    </div>
                    <div className="receipt-meta-row">
                        <span>Cashier:</span>
                        <span>{order.cashier?.name || 'Staff'}</span>
                    </div>

                    {(order.cashier_note || order.note) && (
                        <div className="receipt-note-block">
                            <span style={{ fontWeight: 'bold' }}>* Note: </span>
                            <span>{order.cashier_note || order.note}</span>
                        </div>
                    )}
                </div>

                <table className="receipt-table">
                    <thead>
                        <tr>
                            <th align="left" width="60%" className="align-left receipt-col-name">Item</th>
                            <th align="center" width="15%" className="align-center receipt-col-qty">Qty</th>
                            <th align="right" width="25%" className="align-right receipt-col-total">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {groupedItems.map(([tGroup, tableItems], groupIdx) => {
                            const sectionGross = tableItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
                            const sectionDiscount = tableItems.reduce((sum, i) => {
                                const val = Number(i.discount || 0);
                                const type = i.discountType || 'fixed';
                                if (type === 'percent') return sum + (i.price * i.quantity * val / 100);
                                return sum + (val * i.quantity);
                            }, 0);

                            const isSharedSection = tGroup === 'GROUP';

                            const displayTableTitle = isSharedSection
                                ? `Shared Items (Table ${displayTableName})`
                                : `Table ${resolveTableLabel(tGroup)}`;

                            return (
                                <React.Fragment key={tGroup}>
                                    {showTableHeaders && (
                                        <tr className="receipt-table-header-row">
                                            <td colSpan="3" align="left" className="align-left" style={{
                                                borderTop: groupIdx > 0 ? '1px dashed #000' : 'none'
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
                                                <td align="left" width="60%" className="align-left receipt-col-name">
                                                    <div className="receipt-item-name">{item.name || item.product?.name || 'Product'}</div>
                                                    <div className="receipt-item-price">
                                                        {formatPrice(item.price || 0)}
                                                        {val > 0 && <span style={{ fontWeight: 'bold' }}> (-{type === 'percent' ? `${val}%` : formatPrice(val)})</span>}
                                                    </div>
                                                </td>
                                                <td align="center" width="15%" className="align-center receipt-col-qty">{item.quantity}</td>
                                                <td align="right" width="25%" className="align-right receipt-col-total">{formatPrice(itemTotal)}</td>
                                            </tr>
                                        );
                                    })}
                                    {showTableHeaders && (
                                        <tr className="receipt-subtotal-row">
                                            <td colSpan="2" align="right" className="align-right">
                                                Subtotal {isSharedSection ? 'shared items' : `Table ${resolveTableLabel(tGroup)}`}:
                                            </td>
                                            <td align="right" className="align-right">
                                                {formatPrice(sectionGross - sectionDiscount)}
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}

                        <tr className="receipt-total-row receipt-total-first">
                            <td align="left" width="60%" className="align-left">Gross Total ({totalQuantity})</td>
                            <td colSpan="2" align="right" width="40%" className="align-right">{formatPrice(grossTotal)}</td>
                        </tr>

                        {itemDiscountsTotal > 0 && (
                            <tr className="receipt-total-row">
                                <td align="left" width="60%" className="align-left">Item Discount</td>
                                <td colSpan="2" align="right" width="40%" className="align-right">-{formatPrice(itemDiscountsTotal)}</td>
                            </tr>
                        )}

                        {globalDiscountAmount > 0 && (
                            <tr className="receipt-total-row">
                                <td align="left" width="60%" className="align-left">Global Discount {discountType === 'percent' ? `(${discountValue}%)` : ''}</td>
                                <td colSpan="2" align="right" width="40%" className="align-right">-{formatPrice(globalDiscountAmount)}</td>
                            </tr>
                        )}
                    </tbody>
                </table>

                <div className="receipt-final">
                    <span>TOTAL DUE</span>
                    <span className="receipt-final-amount">{formatPrice(finalTotal)} VND</span>
                </div>

                <div className="receipt-footer">
                    <p>Thank you - See you again!</p>
                </div>
            </div>
        </div>
    );
};
export default Receipt;
