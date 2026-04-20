import React from 'react';
import ActiveOrderTableList from '../ActiveOrderTableList';

/**
 * CashierIndividualLane: Renders the left lane of the Cashier dashboard 
 * dedicated to individual (non-group) tables.
 */
const CashierIndividualLane = ({ 
    layout, 
    individualTables, 
    individualOrders, 
    currentTime, 
    onTableClick, 
    onToggleCollapse 
}) => {
    return (
        <div className={`transition-all duration-500 ease-[cubic-bezier(0.23, 1, 0.32, 1)] ${layout.left}`}>
            <div className={`py-4 ${!layout.isLeftCollapsed ? 'px-2' : 'px-1'} flex flex-col gap-6 bg-white rounded-[16px] shadow-sm border border-gray-100 overflow-hidden min-h-[500px] min-w-full ${!layout.isLeftCollapsed ? 'lg:min-w-[400px]' : 'lg:min-w-[150px]'}`}>
                <div className="flex items-center justify-between px-2">
                    <div className="flex flex-col">
                        <h5 className={`mb-0 text-gray-900 font-black uppercase tracking-tight ${!layout.isLeftCollapsed ? 'text-[15px]' : 'text-[12px]'}`}>
                            {!layout.isLeftCollapsed ? 'Khách Lẻ' : 'Lẻ'}
                        </h5>
                        {!layout.isLeftCollapsed && <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Individual Tables</span>}
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onToggleCollapse}
                            className="p-2 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                            title={!layout.isLeftCollapsed ? "Collapse Left View" : "Expand Left View"}
                        >
                            {!layout.isLeftCollapsed ? (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                            ) : (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                            )}
                        </button>
                        <span className="bg-gray-100 text-gray-500 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                            {individualTables.length} {!layout.isLeftCollapsed ? 'Bàn' : ''}
                        </span>
                    </div>
                </div>

                <div className="cashier-page__list-tables bg-white rounded-[32px] shadow-sm border border-gray-100 flex flex-col overflow-hidden min-h-[400px]">
                    <ActiveOrderTableList
                        tables={individualTables}
                        orders={individualOrders}
                        currentTime={currentTime}
                        onTableClick={onTableClick}
                        showSimpleView={true}
                    />
                    {individualTables.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-24 opacity-30">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h18v18H3zM9 9h6v6H9z" /></svg>
                            <p className="text-[11px] font-bold mt-4 uppercase tracking-widest">Không có khách lẻ</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CashierIndividualLane;
