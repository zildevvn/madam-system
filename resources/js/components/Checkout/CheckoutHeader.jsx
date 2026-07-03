import React from 'react';
import MergeTableSelector from './MergeTableSelector';
import Icon from '../shared/Icon';

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
                <div className="flex items-center gap-1 md:gap-2">
                    <button
                        onClick={() => isConfirmed ? navigate('/staff-order') : navigate(`/order/${tableId}`)}
                        className="mdt-btn-back p-1 md:p-2 hover:bg-gray-100 rounded-full transition-colors border-none bg-transparent cursor-pointer flex items-center justify-center"
                    >
                        <Icon name="arrowLeft" className="w-5 h-5 md:w-6 md:h-6 text-slate-800" size={24} />
                    </button>
                    <h1 className="!text-[11px] !md:text-[14px]">{isConfirmed ? 'Chi tiết hóa đơn' : 'Tạo hóa đơn'}</h1>
                </div>

                <div className="flex items-center gap-2">
                    {/* Table Selector */}
                    <div className="relative flex items-center">
                        <select
                            value={selectedTableId}
                            onChange={(e) => setSelectedTableId(e.target.value)}
                            className="btn-number-table appearance-none bg-gray-100 text-gray-600 pl-2 pr-4 md:pl-4 md:pr-8 py-1.5 rounded-full text-[11px] md:text-[13px] font-semibold leading-none border border-gray-200 cursor-pointer hover:bg-gray-200 hover:border-orange-200 transition-colors"
                        >
                            <option value={tableId}>
                                {allTables.find(t => t.id.toString() === tableId?.toString())?.name || `Bàn ${tableId.toString().replace(/^Bàn\s+/i, '')}`}
                            </option>
                            {allTables
                                .filter(t => {
                                    const isCurrentTable = t.id.toString() === tableId?.toString();
                                    const currentGroupKey = tableIdToGroupKey[tableId?.toString()];
                                    const inSameMergeGroup = currentGroupKey && tableIdToGroupKey[t.id.toString()] === currentGroupKey;
                                    return !isCurrentTable && !inSameMergeGroup;
                                })
                                .map(t => {
                                    const isBusy = !!t.active_order || !!tableIdToGroupKey[t.id.toString()];
                                    return (
                                        <option key={t.id} value={t.id.toString()}>
                                            {t.name} {isBusy ? ' (Có khách)' : ' (Trống)'}
                                        </option>
                                    );
                                })}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 flex items-center justify-center">
                            <Icon name="chevronDown" className="w-3.5 h-3.5" size={14} />
                        </div>
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
