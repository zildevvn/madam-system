import React from 'react';
import MergeTableSelector from './MergeTableSelector';

const CheckoutHeader = ({ 
    isConfirmed, 
    navigate, 
    tableId, 
    selectedTableId, 
    setSelectedTableId, 
    allTables, 
    tableIdToGroupKey,
    mergedTableIds,
    toggleMergedTable,
    showMergeDropdown,
    setShowMergeDropdown
}) => {
    return (
        <div className="w-full sticky top-0 z-50 bg-white">
            <div className="flex items-center justify-between px-2 py-4 w-full">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => isConfirmed ? navigate('/staff-order') : navigate(`/order/${tableId}`)}
                        className="mdt-btn-back p-2 hover:bg-gray-100 rounded-full transition-colors border-none bg-transparent cursor-pointer"
                    >
                        <svg width="24px" height="24px" viewBox="0 0 24 24" strokeWidth="1.5" fill="none" xmlns="http://www.w3.org/2000/svg" color="#000000"><path d="M21 12L3 12M3 12L11.5 3.5M3 12L11.5 20.5" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                    </button>
                    <h1 className="h6">{isConfirmed ? 'Chi tiết hóa đơn' : 'Tạo hóa đơn'}</h1>
                </div>

                <div className="flex items-center gap-2">
                    {/* Table Selector */}
                    <div className="relative flex items-center">
                        <select
                            value={selectedTableId}
                            onChange={(e) => setSelectedTableId(e.target.value)}
                            className="btn-number-table appearance-none bg-gray-100 text-gray-600 pl-4 pr-8 py-1.5 rounded-full text-[13px] font-semibold leading-none border border-gray-200 cursor-pointer hover:bg-gray-200 hover:border-orange-200 transition-colors"
                        >
                            <option value={tableId}>Bàn {tableId.toString().replace(/^Bàn\s+/i, '')}</option>
                            {allTables
                                .filter(t => !t.active_order && !tableIdToGroupKey[t.id.toString()] && t.id.toString() !== tableId?.toString())
                                .map(t => (
                                    <option key={t.id} value={t.id.toString()}>
                                        Bàn {t.id}
                                    </option>
                                ))}
                        </select>
                        <svg className="w-3.5 h-3.5 absolute right-3 pointer-events-none text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </div>

                    <MergeTableSelector 
                        allTables={allTables}
                        tableId={tableId}
                        tableIdToGroupKey={tableIdToGroupKey}
                        mergedTableIds={mergedTableIds}
                        toggleMergedTable={toggleMergedTable}
                        showMergeDropdown={showMergeDropdown}
                        setShowMergeDropdown={setShowMergeDropdown}
                    />
                </div>
            </div>
        </div>
    );
};

export default React.memo(CheckoutHeader);
