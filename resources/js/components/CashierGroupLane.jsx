import React from 'react';
import ActiveOrderTableList from './ActiveOrderTableList';

/**
 * CashierGroupLane: Renders the right lane of the Cashier dashboard 
 * dedicated to group reservations and merged table orders.
 */
const CashierGroupLane = ({ 
    layout, 
    groupTables, 
    groupOrders, 
    currentTime, 
    onTableClick, 
    onToggleCollapse 
}) => {
    return (
        <div className={`transition-all duration-500 ease-[cubic-bezier(0.23, 1, 0.32, 1)] ${layout.right}`}>
            <div className={`py-4 ${!layout.isRightCollapsed ? 'px-2' : 'px-1'} flex flex-col gap-6 bg-white rounded-[16px] shadow-sm border border-orange-100 overflow-hidden min-h-[500px] min-w-full ${!layout.isRightCollapsed ? 'lg:min-w-[400px]' : 'lg:min-w-[150px]'}`}>
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onToggleCollapse}
                            className="p-2 hover:bg-orange-50 rounded-lg text-orange-400 hover:text-orange-600 transition-colors"
                            title={!layout.isRightCollapsed ? "Collapse Group View" : "Expand Group View"}
                        >
                            {!layout.isRightCollapsed ? (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                            ) : (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                            )}
                        </button>
                        <div className="flex flex-col">
                            <h5 className={`mb-0 text-orange-600 font-black uppercase tracking-tight ${!layout.isRightCollapsed ? 'text-[15px]' : 'text-[12px]'}`}>Đoàn</h5>
                            {!layout.isRightCollapsed && <span className="text-[10px] text-orange-300 font-bold uppercase tracking-widest">Group Reservations</span>}
                        </div>
                    </div>
                    <span className="bg-orange-50 text-orange-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                        {groupTables.length} {!layout.isRightCollapsed ? 'Đoàn' : ''}
                    </span>
                </div>
                <div className="cashier-page__list-tables bg-white rounded-[32px] shadow-sm border border-orange-50 flex flex-col overflow-hidden min-h-[400px]">
                    <ActiveOrderTableList
                        tables={groupTables}
                        orders={groupOrders}
                        currentTime={currentTime}
                        onTableClick={onTableClick}
                        showSimpleView={true}
                        className="mdt-list-tables__bg-primary"
                    />

                    {groupTables.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-24 opacity-30">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                            <p className="text-[11px] font-bold mt-4 uppercase tracking-widest text-orange-400">Không có khách đoàn</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CashierGroupLane;
