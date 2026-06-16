import React, { useState } from 'react';
import { safeParseDate } from '../../shared/utils/dateUtils';
import Icon from '../shared/Icon';

/**
 * Modal to display detailed notes for a dish, categorized by table,
 * and allow marking them as complete (served).
 */
const DelayWarningModal = ({
    item,
    onClose,
    onToggleStatus,
    currentTime
}) => {
    if (!item) return null;

    const currentTimeTs = React.useMemo(() => {
        return currentTime ? safeParseDate(currentTime).getTime() : new Date().getTime();
    }, [currentTime]);

    // Transactional state: track internal changes before confirming
    const [localChanges, setLocalChanges] = useState({}); // key -> status

    const getTableKey = (t) => `${t.tableId}-${t.note || ''}-${t.status}`;

    const handleLocalToggle = (t) => {
        if (t.status === 'served') return;
        const key = getTableKey(t);
        setLocalChanges(prev => ({
            ...prev,
            [key]: prev[key] === 'served' ? 'pending' : 'served'
        }));
    };

    const handleConfirm = () => {
        if (onToggleStatus) {
            item.tables.forEach(t => {
                const key = getTableKey(t);
                const currentStatus = localChanges[key];
                // Only call update if specifically changed to 'served' in this modal session
                if (currentStatus === 'served' && t.status !== 'served') {
                    onToggleStatus({ allIds: t.allIds, id: t.id }, 'served', null, t.tableId);
                }
            });
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="p-3 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h5 className="label-table mb-0">
                            {item.name}
                            {item.name_vi && ` - ${item.name_vi}`}
                        </h5>
                        <p className="text-[12px] font-bold text-gray-500 mt-1 mb-0">
                            Tổng cộng: {item.totalQuantity} phần đang chờ
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="btn-close p-2 hover:bg-gray-100 rounded-full transition-colors border-none bg-transparent cursor-pointer flex items-center justify-center"
                    >
                        <Icon name="close" className="w-6 h-6 text-slate-500" size={24} />
                    </button>
                </div>

                <div className="px-2 py-4 md:p-6 max-h-[70vh] overflow-y-auto mdt-scrollbar">
                    <div className="space-y-4">
                        {item.tables.map((t, idx) => {
                            const key = getTableKey(t);
                            const isCurrentlyDone = (localChanges[key] || t.status) === 'served';
                            const itemDiff = Math.max(1, Math.floor((currentTimeTs - t.orderTimeTs) / 60000));

                            return (
                                <div key={idx}
                                    className={`flex justify-between items-start p-2 rounded-lg border transition-all duration-300 ${isCurrentlyDone ? 'bg-gray-50 border-gray-100 opacity-60 cursor-default' : 'bg-white border-gray-100 shadow-sm hover:border-orange-200 group cursor-pointer'}`}
                                    onClick={() => handleLocalToggle(t)}
                                >
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className={`w-4 h-4 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all duration-300 ${isCurrentlyDone ? 'bg-green-500 border-green-500 shadow-lg shadow-green-100' : 'bg-white border-gray-200 hover:border-orange-400 group-hover:scale-110'}`}>
                                            {isCurrentlyDone && (
                                                <Icon name="check" className="w-3 h-3 text-white" size={12} />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[14px] font-bold transition-all duration-300 ${isCurrentlyDone ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                                                    Bàn {t.name.toString().replace(/^Bàn\s+/i, '')}
                                                </span>
                                                {t.quantity > 1 && (
                                                    <span className={`text-[11px] font-black px-2 py-0.5 rounded-lg transition-all duration-300 ${isCurrentlyDone ? 'bg-gray-100 text-gray-400' : 'bg-orange-50 text-orange-500'}`}>
                                                        x{t.quantity}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                                    {itemDiff} phút trước
                                                </span>
                                                {itemDiff >= 10 && !isCurrentlyDone && (
                                                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-1 ${itemDiff >= 20 ? 'bg-red-50 text-red-500' : 'bg-yellow-50 text-yellow-600'}`}>
                                                        <span className={`w-1 h-1 rounded-full animate-pulse ${itemDiff >= 20 ? 'bg-red-500' : 'bg-yellow-500'}`}></span>
                                                        TRỄ
                                                    </span>
                                                )}
                                            </div>
                                            {t.note && (
                                                <div className="mt-2 bg-gray-50 border border-gray-100 rounded-lg p-2 flex items-start gap-2 animate-in fade-in slide-in-from-top-1 duration-300">
                                                    <Icon name="pencil" className="w-3 h-3 text-orange-400 mt-0.5 shrink-0" size={12} />
                                                    <p className="m-0 text-[11px] font-bold text-gray-800 leading-tight">
                                                        {t.note}
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

export default DelayWarningModal;
