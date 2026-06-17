import React, { useState, useEffect } from 'react';
import { formatPrice } from '../shared/utils/formatCurrency';
import Icon from './shared/Icon';

/**
 * ProductItem: Renders individual product details (name, price, qty).
 * Supports optional note and per-item discount editing (Fixed or Percent).
 */
export default function ProductItem({
    item,
    context,
    originalQuantity = 0,
    onUpdateQuantity,
    onUpdateNote,
    onUpdateDiscount,
    showNoteButton = false,
    isReadOnly = false
}) {
    const handlerId = context || item.id;
    const [showNote, setShowNote] = useState(false);
    const [showDiscount, setShowDiscount] = useState(false);
    const [noteValue, setNoteValue] = useState(item.note || '');

    useEffect(() => {
        setNoteValue(item.note || '');
    }, [item.note]);

    const effectiveIsReadOnly = isReadOnly || item.isSplit;

    // Per-item discount state
    const [discountValue, setDiscountValue] = useState(item.discount || 0);
    const [discountType, setDiscountType] = useState(item.discountType || item.discount_type || 'fixed');

    // Debounce effect for automatic discount update
    useEffect(() => {
        // Skip if values match props exactly to prevent initial render fire
        if (Number(discountValue) === Number(item.discount || 0) && discountType === (item.discountType || item.discount_type || 'fixed')) {
            return;
        }

        const handler = setTimeout(() => {
            if (onUpdateDiscount) {
                onUpdateDiscount(handlerId, {
                    discount: Number(discountValue),
                    discountType
                });
            }
        }, 300);

        return () => clearTimeout(handler);
    }, [discountValue, discountType, item.discount, item.discountType, handlerId, onUpdateDiscount]);

    const hasDiscount = Number(item.discount) > 0;

    const calculatedItemDiscount = (() => {
        const val = Number(item.discount || 0);
        const itemGross = item.price * item.quantity;
        if ((item.discountType || item.discount_type) === 'percent') {
            return (itemGross * val / 100);
        }
        return val * item.quantity;
    })();

    const itemTotal = (item.price * item.quantity) - calculatedItemDiscount;

    const addedQuantity = Math.max(0, item.quantity - originalQuantity);

    return (
        <div className="product-item bg-surface-container-lowest py-3 border-b border-gray-100 last:border-0 flex flex-col gap-2">
            <div className="flex justify-between items-start gap-2">
                <div className="space-y-1">
                    <div className="flex items-center flex-wrap gap-2">
                        <h3 className="font-medium">
                            {item.name_vi ? `${item.name_vi} - ${item.name}` : item.name}
                        </h3>
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
                                Giảm: -{(item.discountType || item.discount_type) === 'percent' ? `${item.discount}%` : `${formatPrice(item.discount)}đ`}/món
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
                    {effectiveIsReadOnly && item.quantity > 1 && (
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
                            <Icon name="pencil" size={13} strokeWidth={2.5} />
                            Ghi chú
                        </button>

                        {onUpdateDiscount && (
                            <button
                                onClick={() => setShowDiscount(!showDiscount)}
                                className={`px-3 py-1.5 flex items-center gap-1.5 text-[11px] rounded-lg transition-all border-none cursor-pointer font-bold uppercase tracking-wider ${showDiscount || hasDiscount ? 'bg-red-50 text-red-600' : 'bg-transparent text-gray-400 hover:text-gray-600'}`}
                            >
                                <Icon name="close" size={13} strokeWidth={3} />
                                Giảm giá
                            </button>
                        )}
                    </div>
                )}

                {!effectiveIsReadOnly && (
                    <div className="product-item__quantity flex items-center bg-gray-100 rounded-full p-1 border border-outline-variant/10 shadow-sm ml-auto">
                        <button
                            onClick={() => onUpdateQuantity(handlerId, item.quantity - 1)}
                            className="w-6 h-6 flex items-center justify-center rounded-full bg-white text-on-surface border-none active:scale-90 transition-all hover:bg-white/80 cursor-pointer shadow-sm"
                        >
                            <Icon name="minus" size={14} strokeWidth={2} />
                        </button>
                        <span className="px-4 font-black text-on-surface text-xs min-w-[24px] flex items-center justify-center gap-1 text-center">
                            {item.quantity}
                            {addedQuantity > 0 && originalQuantity > 0 && (
                                <span className="text-[10px] text-orange-600 bg-orange-50 px-1 rounded-sm">
                                    (+{addedQuantity})
                                </span>
                            )}
                        </span>
                        <button
                            onClick={() => onUpdateQuantity(handlerId, item.quantity + 1)}
                            className="btn-plus w-6 h-6 flex items-center justify-center rounded-full text-white shadow-md active:scale-90 transition-all hover:brightness-110 cursor-pointer bg-orange-500"
                        >
                            <Icon name="plus" size={14} strokeWidth={2.5} />
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
                                if (onUpdateNote) onUpdateNote(handlerId, newValue);
                            }}
                            onBlur={() => {
                                if (onUpdateNote) onUpdateNote(handlerId, noteValue);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    if (onUpdateNote) onUpdateNote(handlerId, noteValue);
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
                                        setShowDiscount(false);
                                    }
                                }}
                                className="w-full text-sm px-3 py-2 bg-red-50 border border-red-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500/30 focus:border-red-500 transition-all text-red-700 placeholder-red-300 font-bold"
                                autoFocus
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
