import React, { useState, useEffect, useRef } from 'react';

/**
 * CheckoutOrderNote: A debounced textarea for adding an order-level staff note.
 * [WHY] The note is saved to the backend 800ms after the user stops typing,
 * avoiding excessive API calls while still feeling responsive.
 */
const CheckoutOrderNote = ({ orderNote, onUpdateOrderNote }) => {
    const [localNote, setLocalNote] = useState(orderNote || '');
    const debounceRef = useRef(null);

    // Sync if the Redux value changes externally (e.g. page reload / fetch)
    useEffect(() => {
        setLocalNote(orderNote || '');
    }, [orderNote]);

    const handleChange = (e) => {
        const value = e.target.value;
        setLocalNote(value);

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            onUpdateOrderNote(value);
        }, 800);
    };

    return (
        <div className="px-2 max-w-2xl mx-auto mb-4">
            <div className="bg-white rounded-md shadow-sm px-4 py-4">
                <label
                    htmlFor="order-note"
                    className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2"
                >
                    <svg className="w-3.5 h-3.5 text-orange-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Ghi chú bàn
                </label>
                <textarea
                    id="order-note"
                    rows={2}
                    value={localNote}
                    onChange={handleChange}
                    placeholder="Thêm ghi chú cho bàn này..."
                    className="w-full text-sm text-gray-700 placeholder-gray-300 border border-gray-100 rounded-xl px-3 py-2 resize-none focus:outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all"
                    maxLength={500}
                />
                {localNote.length > 400 && (
                    <p className="text-right text-xs text-gray-400 mt-1">{localNote.length}/500</p>
                )}
            </div>
        </div>
    );
};

export default React.memo(CheckoutOrderNote);
