import React, { useState, useEffect } from 'react';

const TableDetailModal = ({
    tableId,
    tableName,
    mergedTables,
    orderItems,
    orderNote = '',
    guestCount = 1,
    staffName = null,
    currentTime,
    onClose,
    onToggleStatus
}) => {
    // 1. Consolidate items: merge if same product + same note (ignore status)
    const consolidatedItems = React.useMemo(() => {
        const groups = {};

        orderItems.forEach(item => {
            const key = `${item.product_id || item.name}-${item.note || ''}`;

            if (groups[key]) {
                groups[key].totalQuantity += item.quantity;
                if (item.status === 'served') {
                    groups[key].servedQuantity += item.quantity;
                } else {
                    groups[key].pendingQuantity += item.quantity;
                    groups[key].rawPendingItems.push(...(item.rawItems || [{ id: item.id, quantity: item.quantity }]));
                }
                if (item.orderTime < groups[key].orderTime) {
                    groups[key].orderTime = item.orderTime;
                }
            } else {
                groups[key] = {
                    ...item,
                    groupKey: key,
                    totalQuantity: item.quantity,
                    servedQuantity: item.status === 'served' ? item.quantity : 0,
                    pendingQuantity: item.status === 'served' ? 0 : item.quantity,
                    rawPendingItems: item.status === 'served' ? [] : (item.rawItems || [{ id: item.id, quantity: item.quantity }])
                };
            }
        });

        return Object.values(groups);
    }, [orderItems]);

    // 2. Transactional state: track internal changes before confirming
    // localChanges tracks how many ADDITIONAL items the user wants to serve
    const [localChanges, setLocalChanges] = useState({}); // groupKey -> additional served quantity

    const handleLocalIncrement = (item, amount) => {
        setLocalChanges(prev => {
            const currentAdded = prev[item.groupKey] || 0;
            const newAdded = Math.max(0, Math.min(item.pendingQuantity, currentAdded + amount));
            return {
                ...prev,
                [item.groupKey]: newAdded
            };
        });
    };

    const handleConfirm = () => {
        // Apply all local changes to the parent
        consolidatedItems.forEach(item => {
            const addedQty = localChanges[item.groupKey] || 0;
            if (addedQty > 0) {
                onToggleStatus(item, 'served', addedQty);
            }
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="p-3 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h5 className='label-table'>Chi tiết bàn {(tableName || mergedTables || tableId.toString()).replace(/^Bàn\s+/i, '')}</h5>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {guestCount > 0 && (
                                <span className="text-[12px] font-bold text-gray-500 flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                    {guestCount} khách
                                </span>
                            )}
                            {staffName && (
                                <span className="text-[12px] font-bold text-gray-500 flex items-center gap-1">
                                    <span className="text-gray-300">•</span>
                                    <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    {staffName}
                                </span>
                            )}
                            {orderNote && (
                                <span className="text-[12px] font-medium text-gray-900 leading-snug">
                                    - {orderNote}
                                </span>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="btn-close p-2 hover:bg-gray-100 rounded-full transition-colors border-none bg-transparent cursor-pointer"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="px-2 py-4 md:p-6 max-h-[70vh] overflow-y-auto mdt-scrollbar">
                    <div className="space-y-4">

                        {consolidatedItems.map((item, idx) => {
                            const addedQty = localChanges[item.groupKey] || 0;
                            const totalServed = item.servedQuantity + addedQty;
                            const isFullyDone = totalServed >= item.totalQuantity;
                            const isOriginalDone = item.servedQuantity >= item.totalQuantity;
                            const itemDiff = Math.max(1, Math.floor((currentTime - item.orderTime) / 60000));

                            return (
                                <div key={idx}
                                    className={`flex justify-between items-start p-2 rounded-lg border transition-all duration-300 ${isOriginalDone ? 'bg-gray-50 border-gray-100 opacity-60 cursor-default' : 'bg-white border-gray-100 shadow-sm hover:border-orange-200 group'}`}
                                >
                                    <div className="flex items-center gap-4 flex-1">
                                        <div 
                                            onClick={() => {
                                                if (isOriginalDone) return;
                                                // Toggle full remaining quantity
                                                handleLocalIncrement(item, addedQty > 0 ? -addedQty : item.pendingQuantity);
                                            }}
                                            className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all duration-300 ${isFullyDone ? 'bg-green-500 border-green-500 shadow-lg shadow-green-100' : (addedQty > 0 ? 'bg-orange-400 border-orange-400 shadow-lg shadow-orange-100' : 'bg-white border-gray-200 hover:border-orange-400 group-hover:scale-110')}`}
                                        >
                                            {(isFullyDone || addedQty > 0) && (
                                                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between flex-wrap gap-2">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[14px] font-bold transition-all duration-300 ${isFullyDone ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                                                        {item.name}
                                                    </span>
                                                    {item.totalQuantity > 1 && (
                                                        <span className={`text-[11px] font-black px-2 py-0.5 rounded-lg transition-all duration-300 ${isFullyDone ? 'bg-gray-100 text-gray-400' : 'bg-orange-50 text-orange-500'}`}>
                                                            Tổng: {item.totalQuantity}
                                                        </span>
                                                    )}
                                                    {item.totalQuantity > 1 && item.servedQuantity > 0 && (
                                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-green-50 text-green-600 border border-green-100">
                                                            Đã ra: {item.servedQuantity}
                                                        </span>
                                                    )}
                                                </div>
                                                
                                                {!isOriginalDone && item.totalQuantity > 1 && (
                                                    <div className="flex items-center bg-gray-50 rounded-full p-0.5 border border-gray-200 shadow-sm">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                // Clicking '-' means serving 1 item, so remaining decreases
                                                                handleLocalIncrement(item, 1);
                                                            }}
                                                            disabled={addedQty >= item.pendingQuantity}
                                                            className={`w-7 h-7 flex items-center justify-center rounded-full border-none transition-all ${addedQty >= item.pendingQuantity ? 'bg-transparent text-gray-300' : 'bg-white text-gray-700 shadow-sm active:scale-90 cursor-pointer'}`}
                                                        >
                                                            <svg width="14" height="14" strokeWidth="3" viewBox="0 0 24 24" fill="none"><path d="M6 12H18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                                                        </button>

                                                        <span className={`px-2 font-black text-[14px] min-w-[28px] text-center ${addedQty > 0 ? 'text-orange-600' : 'text-gray-800'}`}>
                                                            {item.pendingQuantity - addedQty}
                                                        </span>

                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                // Clicking '+' means reverting 1 served item, so remaining increases
                                                                handleLocalIncrement(item, -1);
                                                            }}
                                                            disabled={addedQty <= 0}
                                                            className={`w-7 h-7 flex items-center justify-center rounded-full border-none transition-all ${addedQty <= 0 ? 'bg-transparent text-gray-300' : 'bg-white text-gray-700 shadow-sm active:scale-90 cursor-pointer'}`}
                                                        >
                                                            <svg width="14" height="14" strokeWidth="3" viewBox="0 0 24 24" fill="none"><path d="M6 12H12M18 12H12M12 12V6M12 12V18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                                    {itemDiff} phút trước
                                                </span>
                                                {itemDiff >= 10 && !isOriginalDone && (
                                                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-1 ${itemDiff >= 20 ? 'bg-red-50 text-red-500' : 'bg-yellow-50 text-yellow-600'}`}>
                                                        <span className={`w-1 h-1 rounded-full animate-pulse ${itemDiff >= 20 ? 'bg-red-500' : 'bg-yellow-500'}`}></span>
                                                        TRỄ
                                                    </span>
                                                )}
                                            </div>
                                            {item.note && (
                                                <div className="mt-2 bg-gray-50 border border-gray-100 rounded-lg p-2 flex items-start gap-2 animate-in fade-in slide-in-from-top-1 duration-300">
                                                    <svg className="w-3 h-3 text-orange-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" /></svg>
                                                    <p className="m-0 text-[11px] font-bold text-gray-800 leading-tight">
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
                        onClick={handleConfirm}
                        className="w-full mdt-btn btn-confirm"
                    >
                        Xong
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TableDetailModal;
