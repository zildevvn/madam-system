import React from 'react';

const TableDetailModal = ({ 
    tableId, 
    tableIndex, 
    mergedTables,
    orderItems, 
    currentTime, 
    onClose, 
    onToggleStatus 
}) => {
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="p-4 md:p-6 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h5>Chi tiết bàn {mergedTables || (tableIndex + 1)}</h5>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors border-none bg-transparent cursor-pointer"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="px-2 py-4 md:p-6">
                    <div className="space-y-4">
                        {orderItems.map((item, idx) => {
                            const itemDiff = Math.max(1, Math.floor((currentTime - item.orderTime) / 60000));
                            return (
                                <div key={idx} className={`flex justify-between items-start p-4 rounded-2xl border transition-all duration-300 ${item.done ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-gray-100 shadow-sm hover:border-orange-200 group'}`}>
                                    <div className="flex items-center gap-4 flex-1">
                                        <div
                                            onClick={() => onToggleStatus(item)}
                                            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all duration-300 ${item.done ? 'bg-green-500 border-green-500 shadow-lg shadow-green-100' : 'bg-white border-gray-200 hover:border-orange-400 group-hover:scale-110'}`}
                                        >
                                            {item.done && (
                                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className={`font-bold transition-all duration-300 ${item.done ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                                                    {item.name}
                                                </span>
                                                <span className={`text-[11px] font-black px-2 py-0.5 rounded-lg transition-all duration-300 ${item.done ? 'bg-gray-100 text-gray-400' : 'bg-orange-50 text-orange-500'}`}>
                                                    x{item.quantity}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                                    {itemDiff} phút trước
                                                </span>
                                                {itemDiff >= 10 && !item.done && (
                                                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-1 ${itemDiff >= 20 ? 'bg-red-50 text-red-500' : 'bg-yellow-50 text-yellow-600'}`}>
                                                        <span className={`w-1 h-1 rounded-full animate-pulse ${itemDiff >= 20 ? 'bg-red-500' : 'bg-yellow-500'}`}></span>
                                                        TRỄ
                                                    </span>
                                                )}
                                            </div>
                                            {item.note && (
                                                <div className="mt-2 bg-gray-50 border border-gray-100 rounded-xl p-2 flex items-start gap-2 animate-in fade-in slide-in-from-top-1 duration-300">
                                                    <svg className="w-3 h-3 text-orange-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                    <p className="m-0 text-[11px] font-bold text-gray-500 leading-tight italic">
                                                        {item.note}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="py-4 px-2 md:p-6 pt-0">
                    <button
                        onClick={onClose}
                        className="w-full mdt-btn"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TableDetailModal;
