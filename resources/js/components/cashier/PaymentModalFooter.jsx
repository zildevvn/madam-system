import React, { useMemo } from 'react';
import { formatPrice } from '../../shared/utils/formatCurrency';
import PaymentMethodSelector from './PaymentMethodSelector';
import Icon from '../shared/Icon';

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
    payments = [],
    onUpdatePayments,
    isProcessing,
    handlePayment,
    isGroup,
    draftItemsCount,
    isHistoryEdit = false,
    isSplitMode = false,
    setIsSplitMode,
    selectedSplitItemsCount = 0,
    handleSplitOrder,
    handlePrintInvoice
}) => {
    const hasAnyDiscount = discountAmount > 0 || itemDiscountsTotal > 0;

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const remainingBalance = finalTotal - totalPaid;
    const isSplitInvalid = paymentMethod === 'split' && totalPaid !== finalTotal;

    const allOptions = useMemo(() => [
        { value: 'cash', label: 'Tiền mặt' },
        { value: 'bank', label: 'Chuyển khoản' },
        { value: 'card', label: 'Cà thẻ' },
        { value: 'debt', label: 'Công nợ' }
    ], []);

    const canAddPaymentEntry = remainingBalance !== 0 && payments.length < allOptions.length;

    const handlePaymentMethodChange = (method) => {
        setPaymentMethod(method);
        if (method === 'split' && payments.length === 0) {
            onUpdatePayments([{ payment_method: 'cash', amount: finalTotal }]);
        }
    };

    const handleAddPaymentEntry = () => {
        const remaining = Math.max(0, finalTotal - totalPaid);
        const selectedMethods = payments.map(p => p.payment_method);
        const firstAvailableOpt = allOptions.find(opt => !selectedMethods.includes(opt.value));
        const method = firstAvailableOpt ? firstAvailableOpt.value : 'cash';
        onUpdatePayments([...payments, { payment_method: method, amount: remaining }]);
    };

    const handleRemovePaymentEntry = (index) => {
        const next = payments.filter((_, i) => i !== index);
        onUpdatePayments(next);
    };

    const handleUpdatePaymentEntry = (index, field, value) => {
        const next = payments.map((p, i) => {
            if (i === index) {
                return { ...p, [field]: value };
            }
            return p;
        });
        onUpdatePayments(next);
    };

    return (
        <div className="shrink-0 border-t border-gray-100 bg-gray-50/50">
            {/* Collapsible Extras: Discount + Note */}
            <button
                onClick={() => setShowExtras(!showExtras)}
                className="w-full px-5 py-2 flex items-center justify-between border-none bg-transparent cursor-pointer hover:bg-gray-50 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <Icon name="chevronDown" className={`text-gray-400 transition-transform duration-200 ${showExtras ? 'rotate-180' : ''}`} size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-red-600">Giảm giá tổng & Ghi chú Tổng</span>
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
                <>
                    <PaymentMethodSelector
                        paymentMethod={paymentMethod}
                        onSelect={handlePaymentMethodChange}
                        isGroup={isGroup}
                        isProcessing={isProcessing}
                    />

                    {paymentMethod === 'split' && (
                        <div className="px-6 pb-4 pt-2 border-t border-gray-100 bg-white space-y-3">
                            <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                                <div>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase block text-left">Phương thức thanh toán</span>
                                    <span className="text-sm font-black text-gray-700">{formatPrice(totalPaid)}đ</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase block">Còn lại</span>
                                    <span className={`text-sm font-black ${remainingBalance === 0 ? 'text-green-500' : 'text-red-500 animate-pulse'}`}>
                                        {formatPrice(remainingBalance)}đ
                                    </span>
                                </div>
                            </div>

                            <div className="max-h-[160px] overflow-y-auto space-y-2 pr-1 list-payments">
                                {payments.map((p, index) => (
                                    <div key={index} className="flex items-center gap-2 bg-gray-50/50 p-2 rounded-xl border border-gray-100">
                                        <select
                                            disabled={isProcessing}
                                            value={p.payment_method}
                                            onChange={(e) => handleUpdatePaymentEntry(index, 'payment_method', e.target.value)}
                                            className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs font-bold text-gray-700 outline-none focus:border-orange-300"
                                        >
                                            {allOptions
                                                .filter(opt => !payments.some((entry, i) => i !== index && entry.payment_method === opt.value))
                                                .map(opt => (
                                                    <option key={opt.value} value={opt.value}>
                                                        {opt.label}
                                                    </option>
                                                ))
                                            }
                                        </select>

                                        <div className="relative flex-1">
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                disabled={isProcessing}
                                                value={p.amount === 0 ? '' : formatPrice(p.amount)}
                                                onChange={(e) => {
                                                    const rawValue = e.target.value.replace(/\D/g, "");
                                                    handleUpdatePaymentEntry(index, 'amount', rawValue ? parseInt(rawValue, 10) : 0);
                                                }}
                                                placeholder="Số tiền..."
                                                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1 text-xs font-bold text-gray-700 text-right outline-none focus:border-orange-300"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-gray-400">đ</span>
                                        </div>

                                        <button
                                            type="button"
                                            disabled={isProcessing}
                                            onClick={() => handleRemovePaymentEntry(index)}
                                            className="w-8 h-8 flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition-colors border-none cursor-pointer shrink-0"
                                        >
                                            <Icon name="trash" size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {canAddPaymentEntry && (
                                <button
                                    type="button"
                                    disabled={isProcessing}
                                    onClick={handleAddPaymentEntry}
                                    className="w-full py-1.5 border border-dashed border-orange-200 text-orange-500 rounded-xl text-xs font-bold hover:bg-orange-50/50 transition-colors bg-white cursor-pointer flex justify-center items-center gap-1"
                                >
                                    <Icon name="plus" size={14} />
                                    Thêm phương thức ({formatPrice(remainingBalance)}đ)
                                </button>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* Action Buttons */}
            <div className="px-4 pb-4 pt-1 flex flex-col gap-2">
                {!isSplitMode && step === 1 && !isHistoryEdit && !isGroup && (
                    <button
                        onClick={() => setIsSplitMode(true)}
                        className="w-full bg-white border border-orange-100 text-orange-500 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-orange-50 transition-colors cursor-pointer"
                    >
                        <Icon name="grid" size={14} />
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
                            <button onClick={handlePrintInvoice} className="btn-print mdt-btn !bg-gray-100 !text-gray-500 rounded-xl font-bold hover:bg-gray-200 transition-colors cursor-pointer border-none text-sm py-2.5">
                                <Icon name="printer" className="w-4 h-4" size={16} />
                                In hóa đơn
                            </button>

                            {step === 1 ? (
                                <button disabled={draftItemsCount === 0} onClick={() => onUpdateStep(2)} className={`mdt-btn cursor-pointer text-sm py-2.5 ${draftItemsCount === 0 ? '!bg-gray-200 !text-gray-400 shadow-none cursor-not-allowed' : ''}`}>
                                    Tiếp theo
                                    <Icon name="arrowRight" className="w-4 h-4" size={16} />
                                </button>
                            ) : (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => onUpdateStep(1)}
                                        className="w-10 h-10 shrink-0 flex items-center justify-center rounded-xl bg-white border border-gray-100 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                                    >
                                        <Icon name="chevronLeft" size={20} />
                                    </button>
                                    <button
                                        disabled={draftItemsCount === 0 || !paymentMethod || isProcessing || isSplitInvalid}
                                        onClick={handlePayment}
                                        className={`flex-1 mdt-btn cursor-pointer text-sm py-2.5 ${(draftItemsCount === 0 || !paymentMethod || isProcessing || isSplitInvalid) ? 'btn-confirm !bg-gray-200 !text-gray-400 shadow-none cursor-not-allowed' : ''}`}
                                    >
                                        {isProcessing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (
                                            <div className="flex items-center gap-2">
                                                <Icon name="check" className="w-4 h-4" size={16} />
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
