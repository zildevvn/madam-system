import React, { useMemo } from 'react';
import { formatPrice } from '../../shared/utils/formatCurrency';
import Icon from './Icon';
import { getPaymentEditPermission } from '../../shared/utils/paymentPermissions';

const formatDatetime = (str) => {
    if (!str) return '—';
    try {
        return new Date(str).toLocaleString('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    } catch {
        return str;
    }
};

const hasPaymentMethod = (order, methodKey) => {
    if (!order) return false;
    const payments = order.payments || [];
    if (payments.length > 0) {
        return payments.some(p => p.payment_method === methodKey);
    }
    return order.payment_method === methodKey;
};

export default function PaymentHistoryTable({ orders, onEditOrder, currentUser, isReopening }) {
    const rows = useMemo(() => {
        const result = [];
        let stt = 1;
        orders.forEach(order => {
            const isCancelled = order.status === 'cancelled';
            const items = order.items || [];
            const crossTotalQty = isCancelled ? 0 : items.reduce((s, i) => s + (i.quantity || 0), 0);
            const crossTotalAmount = isCancelled ? 0 : items.reduce((s, i) => s + ((i.price || 0) * (i.quantity || 0)), 0);
            const totalDue = isCancelled ? 0 : Number(order.total_price || 0);
            const tableName = order.table?.name || order.merged_tables || '—';
            const cashierName = order.cashier?.name || 'Admin';
            const serverName = order.server?.name || '—';

            const orderStt = stt++;

            if (isCancelled || items.length === 0) {
                result.push({
                    stt: orderStt,
                    order,
                    item: null,
                    crossTotalQty,
                    crossTotalAmount,
                    totalDue,
                    tableName,
                    cashierName,
                    serverName,
                    isFirstItem: true
                });
                return;
            }
            items.forEach((item, itemIdx) => {
                result.push({
                    stt: orderStt,
                    order,
                    item,
                    crossTotalQty,
                    crossTotalAmount,
                    totalDue,
                    tableName,
                    cashierName,
                    serverName,
                    isFirstItem: itemIdx === 0
                });
            });
        });
        return result;
    }, [orders]);

    if (rows.length === 0) {
        return (
            <div className="py-16 flex flex-col items-center gap-3 text-slate-400">
                <Icon name="inbox" size={40} />
                <p className="text-sm font-medium">Không có dữ liệu trong khoảng thời gian đã chọn.</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto overflow-y-auto custom-scrollbar" style={{ maxHeight: 'calc(100vh - 250px)' }}>
            <table className="w-full text-xs" id="order-export-table">
                <thead>
                    <tr className="bg-[#f3f4f6] text-[#111827] border-b border-[#e5e7eb]">
                        {[
                            'STT', 'No', 'Table', 'Arrival Time', 'Printed',
                            'Cashier', 'Order Staff', 'Items', 'Name VI', 'Name', 'QTY', 'Total',
                            'Cross Total QTY', 'Cross Total Amount', 'Total Due'
                        ].map(h => (
                            <th key={h} rowSpan={2} className="sticky top-0 z-10 px-3 py-3 text-left font-bold text-[#111827] bg-[#f3f4f6] border-b border-[#e5e7eb] tracking-wider whitespace-nowrap align-middle">
                                {h}
                            </th>
                        ))}
                        <th colSpan={4} className="sticky top-0 z-10 px-3 py-1.5 text-center font-bold text-[#111827] bg-[#f3f4f6] border-b border-[#e5e7eb] tracking-wider whitespace-nowrap">
                            PHƯƠNG THỨC THANH TOÁN
                        </th>
                        {onEditOrder && (
                            <th rowSpan={2} className="sticky top-0 z-10 px-3 py-3 text-center font-bold text-[#111827] bg-[#f3f4f6] border-b border-[#e5e7eb] tracking-wider whitespace-nowrap align-middle">
                                Thao tác
                            </th>
                        )}
                    </tr>
                    <tr className="bg-[#f3f4f6] text-[#111827] border-b border-[#e5e7eb]">
                        {['CN', 'TM', 'CK', 'CT'].map(h => (
                            <th key={h} className="sticky top-[38px] z-10 px-3 py-1.5 text-center font-bold text-[#111827] bg-[#f3f4f6] border-b border-[#e5e7eb] tracking-wider whitespace-nowrap">
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-[#e5e7eb]">
                    {rows.map((row, idx) => {
                        const { stt, order, item, crossTotalQty, crossTotalAmount, totalDue, tableName, cashierName, serverName } = row;
                        const nameVi = item?.product?.name_vi || item?.name_vi;
                        const defaultName = item?.name || item?.product?.name || '—';
                        const itemName = nameVi ? `${nameVi} - ${defaultName}` : defaultName;
                        const qty = item?.quantity ?? 0;
                        const itemTotal = order.status === 'cancelled' ? 0 : ((item?.price ?? 0) * qty);
                        const isFirstItemInOrder = row.isFirstItem;

                        const rowBg = stt % 2 === 0 ? 'bg-[#f1f5f9]' : 'bg-white';
                        let permission = null;
                        if (isFirstItemInOrder && onEditOrder) {
                            permission = getPaymentEditPermission(order, currentUser);
                        }

                        return (
                            <tr
                                key={item ? `${order.id}-item-${item.id}` : `${order.id}-empty`}
                                className={`transition-colors ${rowBg} hover:bg-[#eef6ff] ${isFirstItemInOrder ? 'border-t border-[#e5e7eb]' : ''}`}
                            >
                                <td className="px-3 py-2.5 text-[#1f2937] font-semibold">{stt}</td>
                                <td className="px-3 py-2.5">
                                    {isFirstItemInOrder ? (
                                        <span className="font-bold text-[#1f2937]">#{order.id}</span>
                                    ) : (
                                        <span className="text-[#4b5563]/50">↳</span>
                                    )}
                                </td>
                                <td className="px-3 py-2.5 font-medium text-[#4b5563] whitespace-nowrap">
                                    {isFirstItemInOrder ? tableName : ''}
                                </td>
                                <td className="px-3 py-2.5 text-[#4b5563] whitespace-nowrap">
                                    {isFirstItemInOrder ? formatDatetime(order.created_at) : ''}
                                </td>
                                <td className="px-3 py-2.5 text-[#4b5563] whitespace-nowrap">
                                    {isFirstItemInOrder ? formatDatetime(order.updated_at) : ''}
                                </td>
                                <td className="px-3 py-2.5 text-[#4b5563] whitespace-nowrap">
                                    {isFirstItemInOrder ? cashierName : ''}
                                </td>
                                <td className="px-3 py-2.5 text-[#4b5563] whitespace-nowrap">
                                    {isFirstItemInOrder ? serverName : ''}
                                </td>
                                <td className="px-3 py-2.5 text-[#1f2937] font-medium max-w-[160px] truncate">
                                    {order.status === 'cancelled' ? '' : (item ? itemName : <span className="text-[#4b5563]/40 italic">—</span>)}
                                </td>
                                <td className="px-3 py-2.5 text-[#4b5563] max-w-[140px] truncate">
                                    {item ? (nameVi || '') : ''}
                                </td>
                                <td className="px-3 py-2.5 text-[#4b5563] max-w-[140px] truncate">
                                    {item ? defaultName : ''}
                                </td>
                                <td className="px-3 py-2.5 text-center text-[#4b5563]">
                                    {item ? qty : ''}
                                </td>
                                <td className="px-3 py-2.5 text-right font-medium text-[#1f2937]">
                                    {order.status === 'cancelled' ? formatPrice(0) : (item ? formatPrice(itemTotal) : '')}
                                </td>
                                <td className="px-3 py-2.5 text-center font-bold text-blue-600">
                                    {isFirstItemInOrder ? crossTotalQty : ''}
                                </td>
                                <td className="px-3 py-2.5 text-right font-bold text-blue-600">
                                    {isFirstItemInOrder ? formatPrice(crossTotalAmount) : ''}
                                </td>
                                <td className="px-3 py-2.5 text-right font-bold text-orange-600">
                                    {isFirstItemInOrder ? formatPrice(totalDue) : ''}
                                </td>
                                <td className="px-3 py-2.5 text-center font-bold text-[#1f2937] whitespace-nowrap">
                                    {isFirstItemInOrder && hasPaymentMethod(order, 'debt') ? 'X' : ''}
                                </td>
                                <td className="px-3 py-2.5 text-center font-bold text-[#1f2937] whitespace-nowrap">
                                    {isFirstItemInOrder && hasPaymentMethod(order, 'cash') ? 'X' : ''}
                                </td>
                                <td className="px-3 py-2.5 text-center font-bold text-[#1f2937] whitespace-nowrap">
                                    {isFirstItemInOrder && hasPaymentMethod(order, 'bank') ? 'X' : ''}
                                </td>
                                <td className="px-3 py-2.5 text-center font-bold text-[#1f2937] whitespace-nowrap">
                                    {isFirstItemInOrder && hasPaymentMethod(order, 'card') ? 'X' : ''}
                                </td>
                                {onEditOrder && (
                                    <td className="px-3 py-2.5 text-center whitespace-nowrap">
                                        {isFirstItemInOrder && permission && (
                                            <button
                                                onClick={() => onEditOrder(order)}
                                                disabled={!permission.allowed || isReopening === order.id}
                                                title={permission.reason || ''}
                                                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5 mx-auto ${
                                                    permission.allowed
                                                        ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                                        : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                                                }`}
                                            >
                                                <Icon name={permission.allowed ? "pencil" : "lock"} className="w-3 h-3" size={12} />
                                                Edit
                                            </button>
                                        )}
                                    </td>
                                )}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
