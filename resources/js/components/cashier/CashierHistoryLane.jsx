import React, { useMemo } from 'react';
import { formatPrice } from '../../shared/utils/formatCurrency';
import { formatLocalDate } from '../../shared/utils/formatLocalDate';

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
    onDateChange
}) => {
    const getTodayStr = () => {
        return formatLocalDate(new Date());
    };

    const getYesterdayStr = () => {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        return formatLocalDate(d);
    };

    const totals = useMemo(() => {
        let cash = 0;
        let bank = 0;
        let card = 0;
        let debt = 0;

        historyOrders.forEach(order => {
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
        });

        return { cash, bank, card, debt };
    }, [historyOrders]);

    const resolveTableName = (order) => {
        if (order.merged_tables) {
            const ids = order.merged_tables.split('-').filter(Boolean);
            const names = ids.map(id => {
                const t = allTables.find(tbl => tbl.id.toString() === id.toString());
                return (t?.name || id).toString().replace(/^Bàn\s+/i, '');
            });
            return `Bàn ${names.join('-')}`;
        }

        const table = order.table || allTables.find(t => t.id === order.table_id);
        if (!table) return 'Mang đi';

        const name = (table.name || table.id).toString();
        return name.startsWith('Bàn') ? name : `Bàn ${name}`;
    };

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
                                    onClick={() => onDateChange(getTodayStr())}
                                    className={`flex-1 sm:flex-none whitespace-nowrap px-3 py-2 sm:py-1.5 text-[11px] border-none font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${selectedDate === getTodayStr() ? 'bg-white shadow-sm text-orange-600' : 'bg-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
                                >
                                    Hôm nay
                                </button>
                                <button
                                    onClick={() => onDateChange(getYesterdayStr())}
                                    className={`flex-1 sm:flex-none whitespace-nowrap px-3 py-2 sm:py-1.5 text-[11px] border-none font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${selectedDate === getYesterdayStr() ? 'bg-white shadow-sm text-orange-600' : 'bg-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
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
                        {/* Cash Card */}
                        <div className="flex flex-col bg-white p-3 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-[3px] bg-green-400"></div>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Tiền mặt (Cash)</span>
                            <span className="text-[14px] font-black text-gray-900 mt-1">{formatPrice(totals.cash)}đ</span>
                        </div>
                        {/* Bank Card */}
                        <div className="flex flex-col bg-white p-3 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-[3px] bg-blue-400"></div>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Chuyển khoản (Bank)</span>
                            <span className="text-[14px] font-black text-gray-900 mt-1">{formatPrice(totals.bank)}đ</span>
                        </div>
                        {/* Card Card */}
                        <div className="flex flex-col bg-white p-3 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-[3px] bg-purple-400"></div>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Cà thẻ (Card)</span>
                            <span className="text-[14px] font-black text-gray-900 mt-1">{formatPrice(totals.card)}đ</span>
                        </div>
                        {/* Debt/Credit Card */}
                        <div className="flex flex-col bg-white p-3 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-[3px] bg-orange-400"></div>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Ghi nợ (Debt)</span>
                            <span className="text-[14px] font-black text-gray-900 mt-1">{formatPrice(totals.debt)}đ</span>
                        </div>
                    </div>
                )}

                <div className={`grid ${!isCollapsed ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1'} gap-6 overflow-y-auto max-h-[400px] px-2 custom-scrollbar`}>
                    {historyOrders.map(order => (
                        <div key={order.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:border-orange-200 transition-all group relative overflow-hidden flex flex-col justify-between h-full min-h-[160px]">
                            {/* Visual indicator of payment method */}
                            <div className={`absolute top-0 left-0 w-1 h-full ${order.payment_method === 'cash' ? 'bg-green-400' :
                                order.payment_method === 'bank' ? 'bg-blue-400' : 'bg-purple-400'
                                }`}></div>

                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[13px] font-black text-gray-900 uppercase">
                                            {resolveTableName(order)}
                                        </span>
                                        <span className="text-[10px] bg-gray-50 text-gray-400 px-2 py-0.5 rounded-full font-bold">#{order.id}</span>
                                    </div>
                                    <div className="text-[11px] text-gray-400 font-bold uppercase tracking-wide flex items-center gap-1.5 mt-1">
                                        <span>{new Date(order.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        <span>•</span>
                                        <span>{order.payment_method}</span>
                                        {order.guest_count > 0 && (
                                            <>
                                                <span>•</span>
                                                <span className="flex items-center gap-1 text-orange-500">
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
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
                                    <svg className="shrink-0 mt-0.5" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                                    <span>{order.cashier_note}</span>
                                </div>
                            )}

                            {/* Action Buttons - Visible on hover */}
                            <div className="flex gap-2 lg:opacity-0 group-hover:opacity-100 transition-opacity pt-3 border-t border-gray-50 mt-auto">
                                <button
                                    onClick={() => onEditOrder(order)}
                                    className="flex-1 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                                >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></svg>
                                    Edit
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {historyOrders.length === 0 && (
                    <h5 className="flex flex-col items-center justify-center py-32 w-full text-[11px] font-bold mt-4 uppercase tracking-[0.2em]">No bills yet</h5>
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