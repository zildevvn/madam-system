import React from 'react';

/**
 * Simplified 80mm thermal paper layout for bar staff.
 * Includes ONLY: Table, Date/Time, Drink Name, and Quantity.
 */
export default function DrinkOrderPrint({ items, table, title = "" }) {
    if (!items || items.length === 0) return null;

    const printTime = new Intl.DateTimeFormat('vi-VN', {
        hour: '2-digit', minute: '2-digit',
        day: '2-digit', month: '2-digit', year: 'numeric'
    }).format(new Date()).replace(',', '');

    const tableText = table ? table.toString().replace(/^Bàn\s+/i, '') : '';

    return (
        <div className="receipt-print-only">
            <div className="receipt-container">
                <div className="receipt-header">
                    <h2 className="receipt-title">{title}</h2>
                </div>

                <div className="receipt-meta">
                    <div className="receipt-meta-row">
                        <span>Bàn:</span>
                        <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{tableText}</span>
                    </div>
                    <div className="receipt-meta-row">
                        <span>Giờ in:</span>
                        <span>{printTime}</span>
                    </div>
                </div>

                <table className="receipt-table" style={{ width: '100%' }}>
                    <thead>
                        <tr>
                            <th align="left" style={{ width: '75%' }}>Mặt hàng</th>
                            <th align="center" style={{ width: '25%' }}>SL</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, index) => (
                            <tr key={index}>
                                <td align="left">
                                    <div className="receipt-item-name">{item.name}</div>
                                    {item.note && (
                                        <div className="receipt-item-note" style={{ fontSize: '10px', fontStyle: 'italic', marginTop: '2px' }}>
                                            - {item.note}
                                        </div>
                                    )}
                                </td>
                                <td align="center" style={{ fontSize: '16px', fontWeight: 'bold' }}>{item.quantity}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
