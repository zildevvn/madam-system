import React from 'react';

const MergeTableSelector = ({ 
    allTables, 
    tableId, 
    tableIdToGroupKey, 
    mergedTableIds, 
    toggleMergedTable, 
    showMergeDropdown, 
    setShowMergeDropdown 
}) => {
    return (
        <div className="relative flex items-center">
            <button
                onClick={() => setShowMergeDropdown(!showMergeDropdown)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[13px] font-semibold transition-colors border ${mergedTableIds.length > 0 ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-gray-100 text-gray-600 border-gray-200'} hover:bg-orange-100 hover:border-orange-300 cursor-pointer`}
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
                <span>Gộp{mergedTableIds.length > 0 ? `: ${mergedTableIds.length}` : ' bàn'}</span>
            </button>

            {showMergeDropdown && (
                <>
                    <div className="fixed inset-0 z-[60]" onClick={() => setShowMergeDropdown(false)}></div>
                    <div className="absolute top-full mt-2 right-0 w-48 bg-white border border-gray-100 rounded-xl shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] z-[70] py-2 overflow-hidden ring-1 ring-black ring-opacity-5 transition-all">
                        <div className="px-3 py-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Chọn bàn để gộp</div>
                        <div className="max-h-60 overflow-y-auto">
                            {allTables
                                .filter(t => t.id.toString() !== tableId?.toString() && !tableIdToGroupKey[t.id.toString()])
                                .map(t => (
                                    <label
                                        key={t.id}
                                        className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer transition-colors group"
                                    >
                                        <div className="relative flex items-center shrink-0">
                                            <input
                                                type="checkbox"
                                                checked={mergedTableIds.includes(t.id)}
                                                onChange={() => toggleMergedTable(t.id)}
                                                className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500 transition-all cursor-pointer"
                                            />
                                        </div>
                                        <span className={`text-[13px] ml-3 transition-colors ${mergedTableIds.includes(t.id) ? 'font-bold text-orange-600' : 'text-gray-700 font-medium group-hover:text-gray-900'}`}>
                                            Bàn {t.id}
                                        </span>
                                        {t.active_order && (
                                            <span className="ml-auto w-2 h-2 rounded-full bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.6)]"></span>
                                        )}
                                    </label>
                                ))
                            }
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default React.memo(MergeTableSelector);
