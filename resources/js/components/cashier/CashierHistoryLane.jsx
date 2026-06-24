import React, { useMemo, useCallback } from 'react';
import { formatPrice } from '../../shared/utils/formatCurrency';
import { formatLocalDate } from '../../shared/utils/formatLocalDate';
import { resolveTableName } from '../../shared/utils/normalizeTableStrings';
import Icon from '../shared/Icon';

const SummaryCard = React.memo(({ title, value, colorClass }) => {
    return (
        <div className="flex flex-col bg-white p-3 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-full h-[3px] ${colorClass}`}></div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{title}</span>
            <span className="text-[14px] font-black text-gray-900 mt-1">{formatPrice(value)}đ</span>
        </div>
    );
});
SummaryCard.displayName = 'SummaryCard';

const PAYMENT_METHOD_LABELS = {
    cash: 'Tiền mặt',
    bank: 'Chuyển khoản',
    card: 'Cà thẻ',
    debt: 'Công nợ',
    split: 'Hỗn hợp'
};

const getPaymentColorClass = (method) => {
    switch ((method || '').toLowerCase()) {
        case 'cash': return 'bg-green-400';
        case 'bank': return 'bg-blue-400';
        case 'card': return 'bg-purple-400';
        case 'debt': return 'bg-orange-400';
        case 'split': return 'bg-teal-400';
        default: return 'bg-gray-400';
    }
};

const formatPaymentMethod = (order) => {
    if (!order) return '—';
    const payments = order.payments || [];
    if (payments.length > 0) {
        if (payments.length === 1) {
            const p = payments[0];
            return PAYMENT_METHOD_LABELS[p.payment_method] || p.payment_method || '—';
        }
        const parts = payments.map(p => {
            const label = PAYMENT_METHOD_LABELS[p.payment_method] || p.payment_method;
            const amount = formatPrice(p.amount);
            return `${label} (${amount}đ)`;
        });
        return parts.join(' + ');
    }
    const method = order.payment_method;
    if (method === 'split') {
        return 'Hỗn hợp';
    }
    return PAYMENT_METHOD_LABELS[method] || method || '—';
};

/**
 * CashierHistoryLane: Renders the payment history lane of the Cashier dashboard.
 * Allows viewing recently completed bills, editing payment details, or reopening orders.
 */
const CashierHistoryLane = ({
    containerClassName,
    isCollapsed,
    historyOrders,
    allTables = [],
    onToggleCollapse,
    onEditOrder,
    onReopenOrder,
    isReopening,
    selectedDate,
    onDateChange,
    isLoading = false
}) => {
    const todayStr = useMemo(() => formatLocalDate(new Date()), []);
    const yesterdayStr = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        return formatLocalDate(d);
    }, []);

    const totals = useMemo(() => {
        let cash = 0;
        let bank = 0;
        let card = 0;
        let debt = 0;

        historyOrders.forEach(order => {
            if (order.payments && order.payments.length > 0) {
                order.payments.forEach(p => {
                    const method = (p.payment_method || '').toLowerCase();
                    const amount = Number(p.amount) || 0;
                    if (method === 'cash') {
                        cash += amount;
                    } else if (method === 'bank') {
                        bank += amount;
                    } else if (method === 'card') {
                        card += amount;
                    } else if (method === 'debt') {
                        debt += amount;
                    }
                });
            } else {
                const method = (order.payment_method || '').toLowerCase();
                const total = Number(order.total_price) || 0;
                if (method === 'cash') {
                    cash += total;
                } else if (method === 'bank') {
                    bank += total;
                } else if (method === 'card') {
                    card += total;
                } else if (method === 'debt') {
                    debt += total;
                }
            }
        });

        return { cash, bank, card, debt };
    }, [historyOrders]);

    const tableMap = useMemo(() => {
        const map = {};
        allTables.forEach(t => {
            if (t?.id) {
                map[t.id.toString()] = t;
            }
        });
        return map;
    }, [allTables]);

    const formattedOrders = useMemo(() => {
        return historyOrders.map(order => ({
            ...order,
            displayName: resolveTableName(order, allTables, tableMap),
            formattedTime: new Date(order.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }));
    }, [historyOrders, allTables, tableMap]);

    return (
        <div className={`transition-all duration-500 ease-[cubic-bezier(0.23, 1, 0.32, 1)] mt-8 ${containerClassName}`}>
            <div className={`py-3 md:py-6 ${!isCollapsed ? 'px-3 md:px-6' : 'px-1 md:px-2'} flex flex-col gap-3 md:gap-6 bg-white rounded-[12px] shadow-sm border border-gray-100 overflow-hidden min-h-[100px]`}>
                <div className="flex items-center justify-between px-2 flex-wrap gap-3">
                    <div className="flex flex-col">
                        <h5 className={`mb-0 text-gray-900 font-black uppercase tracking-tight ${!isCollapsed ? 'text-[15px]' : 'text-[12px]'}`}>
                            {!isCollapsed ? 'Lịch Sử Thanh Toán' : 'Lịch Sử'}
                        </h5>
                        {!isCollapsed && <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mt-1">Recently Paid Bills</span>}
                    </div>

                    {!isCollapsed && (
                        <div className="filter-date-wrapper flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 sm:gap-1.5 bg-gray-50 p-1.5 sm:p-1 rounded-xl border border-gray-100 shadow-inner w-full md:w-auto">
                            <div className="flex items-center gap-1 w-full sm:w-auto">
                                <button
                                    onClick={() => onDateChange(todayStr)}
                                    className={`flex-1 sm:flex-none whitespace-nowrap px-3 py-2 sm:py-1.5 text-[11px] border-none font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${selectedDate === todayStr ? 'bg-white shadow-sm text-orange-600' : 'bg-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
                                >
                                    Hôm nay
                                </button>
                                <button
                                    onClick={() => onDateChange(yesterdayStr)}
                                    className={`flex-1 sm:flex-none whitespace-nowrap px-3 py-2 sm:py-1.5 text-[11px] border-none font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${selectedDate === yesterdayStr ? 'bg-white shadow-sm text-orange-600' : 'bg-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
                                >
                                    Hôm qua
                                </button>
                            </div>
                            <div className="hidden sm:block w-px h-4 bg-gray-200 mx-1"></div>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => onDateChange(e.target.value)}
                                className="w-full sm:w-auto bg-white sm:bg-transparent text-[11px] font-bold uppercase tracking-wider text-gray-600 border border-gray-200 sm:border-none outline-none cursor-pointer px-3 sm:px-2 py-2 sm:py-1 rounded-lg sm:rounded-none hover:text-orange-600 transition-colors shadow-sm sm:shadow-none"
                            />
                        </div>
                    )}
                </div>

                {!isCollapsed && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 px-2 py-3 bg-gray-50/50 rounded-2xl border border-gray-100/50">
                        <SummaryCard title="Tiền mặt (Cash)" value={totals.cash} colorClass="bg-green-400" />
                        <SummaryCard title="Chuyển khoản (Bank)" value={totals.bank} colorClass="bg-blue-400" />
                        <SummaryCard title="Cà thẻ (Card)" value={totals.card} colorClass="bg-purple-400" />
                        <SummaryCard title="Ghi nợ (Debt)" value={totals.debt} colorClass="bg-orange-400" />
                    </div>
                )}

                {isLoading ? (
                    <div className="flex items-center justify-center py-32 w-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                    </div>
                ) : (
                    <>
                        <div className={`grid ${!isCollapsed ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1'} gap-6 overflow-y-auto max-h-[400px] px-2 custom-scrollbar`}>
                            {formattedOrders.map(order => (
                                <div key={order.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:border-orange-200 transition-all group relative overflow-hidden flex flex-col justify-between h-full min-h-[160px]">
                                    {/* Visual indicator of payment method */}
                                    <div className={`absolute top-0 left-0 w-1 h-full ${getPaymentColorClass(order.payment_method)}`}></div>

                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[13px] font-black text-gray-900 uppercase">
                                                    {order.displayName}
                                                </span>
                                                <span className="text-[10px] bg-gray-50 text-gray-400 px-2 py-0.5 rounded-full font-bold">#{order.id}</span>
                                            </div>
                                            <div className="text-[11px] text-gray-400 font-bold uppercase tracking-wide flex items-center gap-1.5 mt-1">
                                                <span>{order.formattedTime}</span>
                                                <span>•</span>
                                                <span>{formatPaymentMethod(order)}</span>
                                                {order.guest_count > 0 && (
                                                    <>
                                                        <span>•</span>
                                                        <span className="flex items-center gap-1 text-orange-500">
                                                            <Icon name="users" className="w-3.5 h-3.5" size={14} />
                                                            {order.guest_count}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[16px] font-black text-gray-900 leading-none mb-1">{formatPrice(order.total_price)}đ</div>
                                            {order.discount_amount > 0 && (
                                                <div className="text-[10px] text-orange-500 font-bold uppercase tracking-tight">-{formatPrice(order.discount_amount)}đ</div>
                                            )}
                                        </div>
                                    </div>

                                    {order.cashier_note && (
                                        <div className="mb-4 p-3 bg-gray-50 rounded-xl border border-gray-100 italic text-[11px] text-gray-500 leading-relaxed relative flex gap-2">
                                            <Icon name="message" className="shrink-0 mt-0.5" size={12} />
                                            <span>{order.cashier_note}</span>
                                        </div>
                                    )}

                                    {/* Action Buttons - Visible on hover */}
                                    <div className="flex gap-2 lg:opacity-0 group-hover:opacity-100 transition-opacity pt-3 border-t border-gray-50 mt-auto">
                                        <button
                                            onClick={() => onEditOrder(order)}
                                            className="flex-1 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                                            disabled={isReopening === order.id}
                                        >
                                            <Icon name="pencil" className="w-3 h-3" size={12} />
                                            Edit
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {historyOrders.length === 0 && (
                            <h5 className="flex flex-col items-center justify-center py-32 w-full text-[11px] font-bold mt-4 uppercase tracking-[0.2em]">No bills yet</h5>
                        )}
                    </>
                )}

                {isCollapsed && (
                    <div className="flex-1 flex items-center justify-center lg:writing-mode-vertical py-10 opacity-30 select-none">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] rotate-180 lg:rotate-0">HISTORY</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default React.memo(CashierHistoryLane);