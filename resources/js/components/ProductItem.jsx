import React, { useState, useEffect } from 'react';
import { formatPrice } from '../shared/utils/formatCurrency';

/**
 * ProductItem: Renders individual product details (name, price, qty).
 * Supports optional note and per-item discount editing (Fixed or Percent).
 */
export default function ProductItem({
    item,
    onUpdateQuantity,
    onUpdateNote,
    onUpdateDiscount,
    showNoteButton = false,
    isReadOnly = false
}) {
    const [showNote, setShowNote] = useState(false);
    const [showDiscount, setShowDiscount] = useState(false);
    const [noteValue, setNoteValue] = useState(item.note || '');

    useEffect(() => {
        setNoteValue(item.note || '');
    }, [item.note]);

    const effectiveIsReadOnly = isReadOnly || item.isSplit;

    // Per-item discount state
    const [discountValue, setDiscountValue] = useState(item.discount || 0);
    const [discountType, setDiscountType] = useState(item.discountType || 'fixed');

    const hasDiscount = Number(item.discount) > 0;

    const calculatedItemDiscount = (() => {
        const val = Number(item.discount || 0);
        const itemGross = item.price * item.quantity;
        if (item.discountType === 'percent') {
            return (itemGross * val / 100);
        }
        return val * item.quantity;
    })();

    const itemTotal = (item.price * item.quantity) - calculatedItemDiscount;

    return (
        <div className="product-item bg-surface-container-lowest py-3 border-b border-gray-100 last:border-0 flex flex-col gap-2">
            <div className="flex justify-between items-start gap-2">
                <div className="space-y-1">
                    <div className="flex items-center flex-wrap gap-2">
                        <h3 className="font-medium">{item.name}</h3>
                        {item.isSplit && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-orange-100 text-orange-700 border border-orange-200 animate-in fade-in zoom-in-50 duration-200">
                                Đã tách ({item.splitOrderName})
                            </span>
                        )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <p className="text-[13px] opacity-60 m-0">
                            Đơn giá: {formatPrice(item.price)}đ
                        </p>
                        {hasDiscount && (
                            <p className="text-[13px] text-red-500 m-0 font-medium">
                                Giảm: -{item.discountType === 'percent' ? `${item.discount}%` : `${formatPrice(item.discount)}đ`}/món
                            </p>
                        )}
                    </div>
                    {item.note && !showNote && (
                        <p className="product-item__note text-[12px] text-gray-500 italic mt-0.5 break-words line-clamp-2 m-0">
                            Ghi chú: {item.note}
                        </p>
                    )}
                </div>
                <div className="flex flex-col items-end gap-1">
                    <span className={`font-bold text-[14px] ${hasDiscount ? 'text-red-600' : 'text-on-surface'}`}>
                        {formatPrice(itemTotal)}đ
                    </span>
                    {effectiveIsReadOnly && (
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                            x{item.quantity} món
                        </span>
                    )}
                </div>
            </div>

            <div className={`product-item__actions flex items-center gap-2 mt-1 ${showNoteButton ? 'justify-between' : 'justify-end'}`}>
                {showNoteButton && !effectiveIsReadOnly && (
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setShowNote(!showNote)}
                            className={`px-3 py-1.5 flex items-center gap-1.5 text-[11px] rounded-lg transition-all border-none cursor-pointer font-bold uppercase tracking-wider ${showNote ? 'bg-gray-100 text-gray-700' : 'bg-transparent text-gray-400 hover:text-gray-600'}`}
                        >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            Ghi chú
                        </button>

                        {onUpdateDiscount && (
                            <button
                                onClick={() => setShowDiscount(!showDiscount)}
                                className={`px-3 py-1.5 flex items-center gap-1.5 text-[11px] rounded-lg transition-all border-none cursor-pointer font-bold uppercase tracking-wider ${showDiscount || hasDiscount ? 'bg-red-50 text-red-600' : 'bg-transparent text-gray-400 hover:text-gray-600'}`}
                            >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M7 7l10 10M17 7L7 17" /></svg>
                                Giảm giá
                            </button>
                        )}
                    </div>
                )}

                {!effectiveIsReadOnly && (
                    <div className="product-item__quantity flex items-center bg-gray-100 rounded-full p-1 border border-outline-variant/10 shadow-sm ml-auto">
                        <button
                            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                            className="w-6 h-6 flex items-center justify-center rounded-full bg-white text-on-surface border-none active:scale-90 transition-all hover:bg-white/80 cursor-pointer shadow-sm"
                        >
                            <svg width="14" height="14" strokeWidth="2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 12H18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                        </button>
                        <span className="px-4 font-black text-on-surface text-xs min-w-[24px] text-center">{item.quantity}</span>
                        <button
                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                            className="btn-plus w-6 h-6 flex items-center justify-center rounded-full text-white shadow-md active:scale-90 transition-all hover:brightness-110 cursor-pointer bg-orange-500"
                        >
                            <svg width="14" height="14" strokeWidth="2.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 12H12M18 12H12M12 12V6M12 12V18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                        </button>
                    </div>
                )}
            </div>

            {/* Note Input */}
            {showNote && !isReadOnly && (
                <div className="mt-1 pb-1 animate-[fadeInDown_0.2s_ease-out]">
                    <div className="relative flex items-center">
                        <input
                            type="text"
                            placeholder="Ghi chú món..."
                            value={noteValue}
                            onChange={(e) => {
                                const newValue = e.target.value;
                                setNoteValue(newValue);
                                if (onUpdateNote) onUpdateNote(item.id, newValue);
                            }}
                            onBlur={() => {
                                if (onUpdateNote) onUpdateNote(item.id, noteValue);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    if (onUpdateNote) onUpdateNote(item.id, noteValue);
                                    setShowNote(false);
                                }
                            }}
                            className="w-full text-sm px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500/30 focus:border-orange-500 transition-all"
                            autoFocus
                        />
                    </div>
                </div>
            )}

            {/* Discount Input (Enhanced with type toggle) */}
            {showDiscount && !isReadOnly && (
                <div className="mt-1 pb-1 animate-[fadeInDown_0.2s_ease-out] space-y-2">
                    <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-red-100 shrink-0 shadow-sm">
                            <button
                                onClick={() => setDiscountType('fixed')}
                                className={`px-2 py-1 text-[9px] font-bold rounded-md transition-all border-none cursor-pointer ${discountType === 'fixed' ? 'bg-red-500 text-white shadow-sm' : 'text-gray-400 bg-transparent'}`}
                            >
                                VNĐ
                            </button>
                            <button
                                onClick={() => setDiscountType('percent')}
                                className={`px-2 py-1 text-[9px] font-bold rounded-md transition-all border-none cursor-pointer ${discountType === 'percent' ? 'bg-red-500 text-white shadow-sm' : 'text-gray-400 bg-transparent'}`}
                            >
                                %
                            </button>
                        </div>

                        <div className="relative flex-1">
                            <input
                                type={discountType === 'percent' ? 'number' : 'text'}
                                inputMode={discountType === 'fixed' ? 'numeric' : 'decimal'}
                                placeholder={discountType === 'percent' ? "Mức giảm %..." : "Mức giảm VNĐ..."}
                                value={discountValue === 0 ? '' : (discountType === 'fixed' ? formatPrice(discountValue) : discountValue)}
                                onChange={(e) => {
                                    if (discountType === 'percent') {
                                        setDiscountValue(e.target.value);
                                    } else {
                                        const rawValue = e.target.value.replace(/\D/g, "");
                                        setDiscountValue(rawValue ? parseInt(rawValue, 10) : 0);
                                    }
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        if (onUpdateDiscount) onUpdateDiscount(item.id, {
                                            discount: Number(discountValue),
                                            discountType
                                        });
                                        setShowDiscount(false);
                                    }
                                }}
                                className="w-full text-sm pl-3 pr-10 py-2 bg-red-50 border border-red-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500/30 focus:border-red-500 transition-all text-red-700 placeholder-red-300 font-bold"
                                autoFocus
                            />
                            <button
                                onClick={() => {
                                    if (onUpdateDiscount) onUpdateDiscount(item.id, {
                                        discount: Number(discountValue),
                                        discountType
                                    });
                                    setShowDiscount(false);
                                }}
                                className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-red-500 hover:bg-red-100/50 rounded-md transition-colors border-none bg-transparent cursor-pointer"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
