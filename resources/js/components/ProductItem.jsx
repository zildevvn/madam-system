import React, { useState } from 'react';

export default function ProductItem({ item, onUpdateQuantity, onUpdateNote, showNoteButton = false }) {
    const [showNote, setShowNote] = useState(false);
    const [noteValue, setNoteValue] = useState(item.note || '');

    return (
        <div className="product-item bg-surface-container-lowest py-3 border-b border-gray-100 last:border-0 flex flex-col gap-2">
            <div className="flex justify-between items-start gap-2">
                <div className="space-y-1">
                    <h3 className="font-medium">{item.name}</h3>
                    <p className="text-[12px] opacity-70">
                        Đơn giá: {new Intl.NumberFormat('vi-VN').format(item.price)}đ
                    </p>
                    {item.note && !showNote && (
                        <p className="text-[12px] text-gray-500 italic mt-0.5 break-words line-clamp-2">
                            Ghi chú: {item.note}
                        </p>
                    )}
                </div>
                <span className="font-bold text-on-surface text-[14px]">
                    {new Intl.NumberFormat('vi-VN').format(item.price * item.quantity)}đ
                </span>
            </div>
            <div className={`flex items-center gap-2 mt-1 ${showNoteButton ? 'justify-between' : 'justify-end'}`}>
                {showNoteButton && (
                    <button
                        onClick={() => setShowNote(!showNote)}
                        className="btn-note flex items-center gap-1.5 text-[12px] text-gray-500 hover:text-gray-800 transition-colors border-none bg-transparent cursor-pointer font-medium"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        Ghi chú
                    </button>
                )}
                <div className="flex items-center bg-gray-100 rounded-full p-1 border border-outline-variant/10 shadow-sm">
                    <button
                        onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                        className="w-6 h-6 flex items-center justify-center rounded-full bg-white text-on-surface border-none active:scale-90 transition-all hover:bg-white/80 cursor-pointer"
                    >
                        <svg width="18px" height="18px" strokeWidth="1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="#000000"><path d="M6 12H18" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                    </button>
                    <span className="px-5 font-bold text-on-surface text-sm">{item.quantity}</span>
                    <button
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                        className="btn-plus w-6 h-6 flex items-center justify-center rounded-full text-white shadow-md active:scale-90 transition-all hover:brightness-110 cursor-pointer"
                    >
                        <svg width="18px" height="18px" strokeWidth="1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="#fff"><path d="M6 12H12M18 12H12M12 12V6M12 12V18" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                    </button>
                </div>
            </div>

            {/*      */}
            {showNote && (
                <div className="mt-1 pb-1 transform transition-all animate-[pulse_0.2s_ease-out]">
                    <div className="relative flex items-center">
                        <input
                            type="text"
                            placeholder="Nhập ghi chú cho món (VD: Không hành, ít cay...)"
                            value={noteValue}
                            onChange={(e) => setNoteValue(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && noteValue !== (item.note || '')) {
                                    if (onUpdateNote) onUpdateNote(item.id, noteValue);
                                }
                            }}
                            className="w-full text-[13px] pl-3 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all text-gray-700 placeholder-gray-400 shadow-inner"
                            autoFocus
                        />
                        {noteValue !== (item.note || '') && (
                            <button
                                onClick={() => {
                                    if (onUpdateNote) onUpdateNote(item.id, noteValue);
                                }}
                                className="absolute right-1 w-8 h-8 flex items-center justify-center text-gray-500 hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                                title="Lưu ghi chú"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
