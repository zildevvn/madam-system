import React from 'react';

/**
 * Modal to display detailed notes for a dish, categorized by table.
 */
const DelayWarningModal = ({ 
    item, 
    onClose 
}) => {
    if (!item) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-[16px] w-full max-w-sm overflow-hidden shadow-xl animate-in zoom-in-95 duration-200 border border-white/20">
                <div className="p-4">
                    <div className="space-y-3">
                        <div className="p-4 bg-orange-50 rounded-[12px] border border-orange-100 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                </svg>
                            </div>
                            {item.tableNotes && item.tableNotes.length > 0 ? (
                                <ul className="space-y-3 relative z-10">
                                    {item.tableNotes.map((tn, nIdx) => (
                                        <li key={nIdx} className="flex gap-2 text-[15px]">
                                            <span className="text-gray-400 font-bold shrink-0">Bàn {tn.tableName.toString().replace(/^Bàn\s+/i, 'Bàn ')}:</span>
                                            <span className="text-orange-950 font-black italic">"{tn.note}"</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="py-4 text-center">
                                    <p className="text-gray-400 font-bold italic text-sm">Không có ghi chú cho món này</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-4 bg-white text-gray-400 rounded-2xl font-black border border-gray-200 hover:text-gray-900 hover:border-gray-900 transition-all active:scale-[0.98] uppercase tracking-wider text-sm"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DelayWarningModal;
