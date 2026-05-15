import React from 'react';
import { formatPrice } from '../../shared/utils/formatCurrency';
import PaymentMethodSelector from './PaymentMethodSelector';

/**
 * PaymentModalFooter: Renders the sticky bottom panel of the payment modal, 
 * including discounts, notes, totals, and action buttons.
 */
const PaymentModalFooter = ({
    showExtras,
    setShowExtras,
    discountType,
    onUpdateDiscountType,
    discountValue,
    onUpdateDiscountValue,
    cashierNote,
    onUpdateCashierNote,
    discountAmount,
    itemDiscountsTotal = 0,
    draftTotal,
    finalTotal,
    totalQty,
    step,
    onUpdateStep,
    paymentMethod,
    setPaymentMethod,
    isProcessing,
    handlePayment,
    isGroup,
    draftItemsCount,
    isHistoryEdit = false,
    isSplitMode = false,
    setIsSplitMode,
    selectedSplitItemsCount = 0,
    handleSplitOrder
}) => {
    const hasAnyDiscount = discountAmount > 0 || itemDiscountsTotal > 0;

    return (
        <div className="shrink-0 border-t border-gray-100 bg-gray-50/50">
            {/* Collapsible Extras: Discount + Note */}
            <button
                onClick={() => setShowExtras(!showExtras)}
                className="w-full px-5 py-2 flex items-center justify-between border-none bg-transparent cursor-pointer hover:bg-gray-50 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${showExtras ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                    </svg>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Giảm giá tổng & Ghi chú Tổng</span>
                </div>
                {(discountValue > 0 || itemDiscountsTotal > 0 || cashierNote) && (
                    <div className="flex items-center gap-1.5">
                        {(discountValue > 0 || itemDiscountsTotal > 0) && (
                            <span className="text-[9px] font-black text-orange-500 bg-orange-100 px-1.5 py-0.5 rounded-md">
                                Giảm giá
                            </span>
                        )}
                        {cashierNote && (
                            <span className="text-[9px] font-black text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded-md">
                                📝
                            </span>
                        )}
                    </div>
                )}
            </button>

            {showExtras && (
                <div className="px-5 pb-3 space-y-3 animate-[fadeSlideDown_0.15s_ease-out]">
                    {/* Item Discounts Summary (Read only here, edited in Item list) */}
                    {itemDiscountsTotal > 0 && (
                        <div className="flex items-center justify-between bg-red-50/50 p-2 rounded-lg border border-red-100/50">
                            <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">Tổng giảm giá món</span>
                            <span className="text-[11px] font-black text-red-600">-{formatPrice(itemDiscountsTotal)}đ</span>
                        </div>
                    )}

                    {/* Global Discount Row */}
                    {!isHistoryEdit ? (
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg shrink-0">
                                <button
                                    onClick={() => onUpdateDiscountType('fixed')}
                                    className={`px-2 py-1 text-[9px] font-bold rounded-md transition-all border-none cursor-pointer ${discountType === 'fixed' ? 'bg-white text-orange-500 shadow-sm' : 'text-gray-400 bg-transparent'}`}
                                >
                                    VNĐ
                                </button>
                                <button
                                    onClick={() => onUpdateDiscountType('percent')}
                                    className={`px-2 py-1 text-[9px] font-bold rounded-md transition-all border-none cursor-pointer ${discountType === 'percent' ? 'bg-white text-orange-500 shadow-sm' : 'text-gray-400 bg-transparent'}`}
                                >
                                    %
                                </button>
                            </div>
                            <div className="relative flex-1">
                                <input
                                    type={discountType === 'percent' ? 'number' : 'text'}
                                    inputMode={discountType === 'fixed' ? 'numeric' : 'decimal'}
                                    value={discountValue === 0 ? '' : (discountType === 'fixed' ? formatPrice(discountValue) : discountValue)}
                                    onChange={(e) => {
                                        if (discountType === 'percent') {
                                            const val = e.target.value;
                                            onUpdateDiscountValue(val === '' ? 0 : Math.max(0, parseFloat(val) || 0));
                                        } else {
                                            const rawValue = e.target.value.replace(/\D/g, "");
                                            onUpdateDiscountValue(rawValue ? parseInt(rawValue, 10) : 0);
                                        }
                                    }}
                                    placeholder="Nhập mức giảm tổng..."
                                    className="w-full bg-white border border-gray-100 rounded-lg px-3 py-1.5 text-[16px] font-bold text-gray-700 outline-none focus:border-orange-200 transition-colors"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 font-bold text-[10px] uppercase">
                                    {discountType === 'percent' ? '%' : 'vnđ'}
                                </div>
                            </div>
                        </div>
                    ) : (
                        discountAmount > 0 && (
                            <div className="flex items-center justify-between bg-orange-50/50 p-2.5 rounded-xl border border-orange-100/50">
                                <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">Mức giảm tổng đã áp dụng</span>
                                <span className="text-sm font-black text-orange-500">-{formatPrice(discountAmount)}đ</span>
                            </div>
                        )
                    )}

                    {/* Cashier Note */}
                    <textarea
                        value={cashierNote}
                        onChange={(e) => onUpdateCashierNote(e.target.value)}
                        placeholder="Ghi chú thu ngân..."
                        rows={2}
                        className="w-full bg-white border border-gray-100 rounded-lg px-3 py-2 text-[16px] font-medium text-gray-700 outline-none focus:border-orange-200 transition-colors resize-none"
                    />
                </div>
            )}

            {/* Total Summary */}
            <div className="mx-4 mb-2 flex flex-col bg-orange-50 rounded-xl px-4 py-2 gap-0.5">
                {hasAnyDiscount && (
                    <div className="flex justify-between items-center opacity-60">
                        <span className="text-[10px] font-bold text-gray-600">Tạm tính (Gốc)</span>
                        <span className="text-[10px] font-bold text-gray-600 line-through">{formatPrice(draftTotal)}đ</span>
                    </div>
                )}
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-700 text-sm">Tổng thanh toán</span>
                        {totalQty > 0 && (
                            <span className="text-[9px] font-black text-orange-500 bg-orange-100 px-1.5 py-0.5 rounded-full">
                                {totalQty} món
                            </span>
                        )}
                    </div>
                    <span className="text-lg font-black text-orange-500">{formatPrice(finalTotal)}đ</span>
                </div>
                {hasAnyDiscount && (
                    <div className="flex justify-between items-center">
                        <span className="text-[9px] font-bold text-orange-400 uppercase tracking-tight">Tổng cộng đã giảm</span>
                        <span className="text-[9px] font-bold text-orange-400">-{formatPrice(discountAmount + itemDiscountsTotal)}đ</span>
                    </div>
                )}
            </div>

            {/* Payment Method (Step 2) */}
            {step === 2 && (
                <PaymentMethodSelector
                    paymentMethod={paymentMethod}
                    setPaymentMethod={setPaymentMethod}
                    isGroup={isGroup}
                />
            )}

            {/* Action Buttons */}
            <div className="px-4 pb-4 pt-1 flex flex-col gap-2">
                {!isSplitMode && step === 1 && !isHistoryEdit && !isGroup && (
                    <button
                        onClick={() => setIsSplitMode(true)}
                        className="w-full bg-white border border-orange-100 text-orange-500 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-orange-50 transition-colors cursor-pointer"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M8 3v18M16 3v18M3 8h18M3 16h18" /></svg>
                        Tách hóa đơn
                    </button>
                )}

                <div className="grid grid-cols-2 gap-2">
                    {isSplitMode ? (
                        <>
                            <button
                                onClick={() => setIsSplitMode(false)}
                                className="mdt-btn !bg-gray-100 !text-gray-500 rounded-xl font-bold border-none text-sm py-2.5 cursor-pointer"
                            >
                                Hủy tách
                            </button>
                            <button
                                disabled={selectedSplitItemsCount === 0 || isProcessing}
                                onClick={handleSplitOrder}
                                className={`mdt-btn rounded-xl font-bold border-none text-sm py-2.5 cursor-pointer ${selectedSplitItemsCount === 0 || isProcessing ? '!bg-gray-200 !text-gray-400 grayscale shadow-none' : ''}`}
                            >
                                {isProcessing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : `Xác nhận tách (${selectedSplitItemsCount})`}
                            </button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => window.print()} className="btn-print mdt-btn !bg-gray-100 !text-gray-500 rounded-xl font-bold hover:bg-gray-200 transition-colors cursor-pointer border-none text-sm py-2.5">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 00-2 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2m8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                                In hóa đơn
                            </button>

                            {step === 1 ? (
                                <button disabled={draftItemsCount === 0} onClick={() => onUpdateStep(2)} className={`mdt-btn cursor-pointer text-sm py-2.5 ${draftItemsCount === 0 ? '!bg-gray-200 !text-gray-400 shadow-none cursor-not-allowed' : ''}`}>
                                    Tiếp theo
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                                </button>
                            ) : (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => onUpdateStep(1)}
                                        className="w-10 h-10 shrink-0 flex items-center justify-center rounded-xl bg-white border border-gray-100 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                                    </button>
                                    <button
                                        disabled={draftItemsCount === 0 || !paymentMethod || isProcessing}
                                        onClick={handlePayment}
                                        className={`flex-1 mdt-btn cursor-pointer text-sm py-2.5 ${(draftItemsCount === 0 || !paymentMethod || isProcessing) ? 'btn-confirm !bg-gray-200 !text-gray-400 shadow-none cursor-not-allowed' : ''}`}
                                    >
                                        {isProcessing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (
                                            <div className="flex items-center gap-2">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                                                {isHistoryEdit ? 'Cập nhật' : 'Xác Nhận'}
                                            </div>
                                        )}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PaymentModalFooter;
