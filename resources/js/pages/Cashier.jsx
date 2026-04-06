import React, { useState } from 'react';
import ActiveOrderTableList from '../components/ActiveOrderTableList';
import { useConsolidatedOrders } from '../hooks/useConsolidatedOrders';
import axios from 'axios';
import Receipt from '../components/Receipt';

const Cashier = () => {
    const {
        activeTablesToDisplay,
        orderDict,
        currentTime,
        allTables,
        status,
        error
    } = useConsolidatedOrders(null, true);

    const [selectedTable, setSelectedTable] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState(null); // 'bank' | 'card' | 'cash'
    const [isProcessing, setIsProcessing] = useState(false);
    const [step, setStep] = useState(1); // 1: Preview, 2: Payment

    const handleTableClick = (table) => {
        setSelectedTable(table);
        setPaymentMethod(null); // Reset selection each time modal opens
        setStep(1); // Reset to preview step 
    };

    const handlePrintBill = () => {
        window.print();
    };

    const handlePayment = async (tableId) => {
        const order = orderDict[tableId.toString()];
        if (!order || !paymentMethod || isProcessing) return;

        setIsProcessing(true);
        try {
            await axios.post(`/api/orders/${order.id}/complete`, {
                payment_method: paymentMethod
            });
            setSelectedTable(null);
            setPaymentMethod(null);
        } catch (err) {
            console.error('Payment failed:', err);
            alert('Có lỗi xảy ra khi thanh toán. Vui lòng thử lại.');
        } finally {
            setIsProcessing(false);
        }
    };

    const getOrderTotal = (order) => {
        if (!order) return 0;
        return order.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    const activeOrdersCount = Object.keys(orderDict).length;
    const emptyTablesCount = allTables.filter(t => !orderDict[t.id.toString()]).length;

    if (status === 'loading' && allTables.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    const currentOrder = selectedTable ? orderDict[selectedTable.id.toString()] : null;

    return (
        <div className="md-management-page pb-20">
            {/* Header Info Bar (matching StaffOrder layout) */}
            <div className="bg-white py-3 border-t border-b border-gray-200 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 w-full max-w-[1200px] mx-auto px-[20px] justify-between">
                    <p className="item-info flex items-center gap-1 m-0 text-sm">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                        Tổng đơn chờ thanh toán: {activeOrdersCount}
                    </p>

                    <p className="item-info flex items-center gap-1 m-0 text-sm">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 00-2 2v6a2 2 0 00-2-2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                        Bàn trống {emptyTablesCount}/{allTables.length}
                    </p>
                </div>
            </div>

            <div className="md-management-page__content py-8">
                <div className="w-full max-w-[1200px] mx-auto px-[20px] flex flex-col gap-6">
                    <div className="bg-gray-50/50 rounded-3xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
                        <ActiveOrderTableList
                            tables={activeTablesToDisplay}
                            orders={orderDict}
                            currentTime={currentTime}
                            onTableClick={handleTableClick}
                        />
                    </div>
                </div>
            </div>

            {/* Payment Popup Modal */}
            {selectedTable && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="bg-white rounded-t-[32px] sm:rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl">

                        {/* Header */}
                        <div className="px-6 py-5 flex items-center justify-between border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center shrink-0">
                                    <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="m-0 text-[10px] font-bold uppercase tracking-widest text-gray-400">Hóa đơn thanh toán</p>
                                    <h4 className="m-0 text-lg font-black text-gray-900">
                                        Bàn {(currentOrder?.mergedTables || selectedTable.name || selectedTable.id.toString()).replace(/^Bàn\s+/i, '')}
                                    </h4>
                                </div>
                            </div>
                            <button
                                onClick={() => { setSelectedTable(null); setPaymentMethod(null); setStep(1); }}
                                className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors border-none cursor-pointer text-gray-500"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {/* Items List  */}
                        <div className="px-6 pt-5 pb-2 max-h-[40vh] overflow-y-auto hide-scrollbar">
                            {!currentOrder ? (
                                <div className="text-center py-8 text-gray-400 italic text-sm">Bàn này chưa có món nào.</div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Group items by tableId if it's a merged order */}
                                    {Object.entries(
                                        currentOrder.items.reduce((acc, item) => {
                                            const tId = item.tableId || currentOrder.tableId;
                                            if (!acc[tId]) acc[tId] = [];
                                            acc[tId].push(item);
                                            return acc;
                                        }, {})
                                    ).sort(([a], [b]) => a - b).map(([tId, tableItems]) => (
                                        <div key={tId} className="space-y-1">
                                            {currentOrder.mergedTables && (
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
                                                        Bàn {tId}
                                                    </span>
                                                    <div className="flex-1 h-[1px] bg-gray-100"></div>
                                                </div>
                                            )}
                                            {tableItems.map((item, idx) => (
                                                <div key={idx} className="flex justify-between items-center py-1.5">
                                                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                                        <span className="text-sm font-bold text-gray-800 truncate">{item.name}</span>
                                                        <span className="shrink-0 text-[10px] font-black text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded-md">×{item.quantity}</span>
                                                    </div>
                                                    <span className="text-sm font-black text-gray-900 ml-3">{(item.price * item.quantity).toLocaleString()}đ</span>
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Total Row */}
                        <div className="mx-6 mb-5 mt-3 flex justify-between items-center bg-orange-50 rounded-2xl px-5 py-3">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-700 text-sm">Tổng cộng</span>
                                {currentOrder && (
                                    <span className="text-[10px] font-black text-orange-500 bg-orange-100 px-2 py-0.5 rounded-full">
                                        {currentOrder.items.reduce((s, i) => s + i.quantity, 0)} món
                                    </span>
                                )}
                            </div>
                            <span className="text-lg font-black text-orange-500">{getOrderTotal(currentOrder).toLocaleString()}đ</span>
                        </div>

                        {/* Payment Methods - Step 2 Only */}
                        {step === 2 && (
                            <div className="px-6 pb-3">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Phương thức thanh toán</p>
                                <div className="flex gap-2">
                                    {[
                                        { key: 'cash', label: 'Tiền mặt', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /> },
                                        { key: 'bank', label: 'Chuyển khoản', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /> },
                                        { key: 'card', label: 'Cà thẻ', icon: <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6" /></> },
                                    ].map(({ key, label, icon }) => (
                                        <button
                                            key={key}
                                            onClick={() => setPaymentMethod(key)}
                                            className={`flex-1 flex justify-center items-center gap-1 py-2 px-2 rounded-xl border-1 transition-all duration-150 cursor-pointer ${paymentMethod === key
                                                ? 'border-orange-500 bg-orange-50 text-orange-600'
                                                : 'border-gray-100 bg-gray-50 text-gray-400 hover:border-orange-200 hover:text-gray-600'
                                                }`}
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">{icon}</svg>
                                            <span className="text-[9px] font-black uppercase tracking-wide leading-tight text-center">{label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="px-6 pb-6 pt-4 grid grid-cols-2 gap-3">
                            <button
                                onClick={handlePrintBill}
                                className="mdt-btn !bg-gray-100 !text-gray-500 rounded-xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer border-none"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2m8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                                In hóa đơn
                            </button>

                            {step === 1 ? (
                                <button
                                    disabled={!currentOrder}
                                    onClick={() => setStep(2)}
                                    className={`mdt-btn cursor-pointer ${!currentOrder ? '!bg-gray-200 !text-gray-400 shadow-none cursor-not-allowed' : ''}`}
                                >
                                    Tiếp theo
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                                </button>
                            ) : (
                                <button
                                    disabled={!currentOrder || !paymentMethod || isProcessing}
                                    onClick={() => handlePayment(selectedTable.id)}
                                    className={`mdt-btn cursor-pointer ${(!currentOrder || !paymentMethod || isProcessing) ? '!bg-gray-200 !text-gray-400 shadow-none cursor-not-allowed' : ''}`}
                                >
                                    {isProcessing ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                                    )}
                                    {isProcessing ? 'Đang xử lý...' : 'Xác Nhận'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Hidden Print Area */}
            {currentOrder && (
                <Receipt
                    order={currentOrder}
                    tableName={selectedTable?.name}
                />
            )}
        </div>
    );
};

export default Cashier;
