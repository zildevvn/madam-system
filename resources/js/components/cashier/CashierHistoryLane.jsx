import React from 'react';
import { formatPrice } from '../../shared/utils/formatCurrency';

/**
 * CashierHistoryLane: Renders the payment history lane of the Cashier dashboard.
 * Allows viewing recently completed bills, editing payment details, or reopening orders.
 */
const CashierHistoryLane = ({
    layout,
    historyOrders,
    onToggleCollapse,
    onEditOrder,
    onReopenOrder,
    isReopening
}) => {
    const isCollapsed = layout.isHistoryCollapsed;

    return (
        <div className={`transition-all duration-500 ease-[cubic-bezier(0.23, 1, 0.32, 1)] mt-8 ${layout.history}`}>
            <div className={`py-6 ${!isCollapsed ? 'px-6' : 'px-2'} flex flex-col gap-6 bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden min-h-[100px]`}>
                <div className="flex items-center justify-between px-2">
                    <div className="flex flex-col">
                        <h5 className={`mb-0 text-gray-900 font-black uppercase tracking-tight ${!isCollapsed ? 'text-[15px]' : 'text-[12px]'}`}>
                            {!isCollapsed ? 'Lịch Sử Thanh Toán' : 'Lịch Sử'}
                        </h5>
                        {!isCollapsed && <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mt-1">Recently Paid Bills</span>}
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="bg-orange-100 text-orange-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                            {historyOrders.length} Bill
                        </span>
                    </div>
                </div>

                <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 overflow-y-auto mdt-scrollbar px-2 max-h-[600px] ${isCollapsed ? 'hidden' : 'grid'}`}>
                    {historyOrders.map((order) => (
                        <div key={order.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:border-orange-200 transition-all group relative overflow-hidden flex flex-col justify-between h-full min-h-[160px]">
                            {/* Visual indicator of payment method */}
                            <div className={`absolute top-0 left-0 w-1 h-full ${order.payment_method === 'cash' ? 'bg-green-400' :
                                order.payment_method === 'bank' ? 'bg-blue-400' : 'bg-purple-400'
                                }`}></div>

                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[13px] font-black text-gray-900 uppercase">
                                            {order.merged_tables
                                                ? `Bàn ${order.merged_tables}`
                                                : (order.table?.name
                                                    ? (order.table.name.startsWith('Bàn') ? order.table.name : `Bàn ${order.table.name}`)
                                                    : 'Mang đi'
                                                )
                                            }
                                        </span>
                                        <span className="text-[10px] bg-gray-50 text-gray-400 px-2 py-0.5 rounded-full font-bold">#{order.id}</span>
                                    </div>
                                    <div className="text-[11px] text-gray-400 font-bold uppercase tracking-wide">
                                        {new Date(order.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {order.payment_method}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[16px] font-black text-gray-900 leading-none mb-1">{formatPrice(order.total_price)}đ</div>
                                    {order.discount_amount > 0 && (
                                        <div className="text-[10px] text-orange-500 font-bold uppercase tracking-tight">-{formatPrice(order.discount_amount)}đ</div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-3 mb-4">
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                    {order.cashier?.name || 'Staff'}
                                </div>
                                <div className="w-1 h-1 bg-gray-200 rounded-full"></div>
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                    {order.items?.length || 0} món
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

export default CashierHistoryLane;
