import React from 'react';
import ActiveOrderTableList from '../ActiveOrderTableList';
import Icon from '../shared/Icon';

/**
 * CashierGroupLane: Renders the right lane of the Cashier dashboard 
 * dedicated to group reservations and merged table orders.
 */
const CashierGroupLane = ({
    containerClassName,
    isCollapsed,
    groupTables,
    groupOrders,
    currentTime,
    onTableClick,
    onToggleCollapse
}) => {
    return (
        <div className={`transition-all duration-500 ease-[cubic-bezier(0.23, 1, 0.32, 1)] ${containerClassName}`}>
            <div className={`py-4 ${!isCollapsed ? 'px-2' : 'px-1'} flex flex-col gap-6 bg-white rounded-[16px] shadow-sm border border-orange-100 overflow-hidden min-h-[500px] min-w-full ${!isCollapsed ? 'lg:min-w-[400px]' : 'lg:min-w-[150px]'}`}>
                <div className="flex items-center justify-between px-2">
                    <div className="flex flex-col">
                        <h5 className={`mb-0 text-orange-600 font-black uppercase tracking-tight ${!isCollapsed ? 'text-[15px]' : 'text-[12px]'}`}>
                            {!isCollapsed ? 'Khách Đoàn' : 'Đoàn'}
                        </h5>
                        {!isCollapsed && <span className="text-[10px] text-orange-300 font-bold uppercase tracking-widest">Group Reservations</span>}
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onToggleCollapse}
                            className="p-2 hover:bg-orange-50 rounded-lg text-orange-400 hover:text-orange-600 transition-colors flex items-center justify-center"
                            title={!isCollapsed ? "Collapse View" : "Expand View"}
                        >
                            {!isCollapsed ? (
                                <Icon name="chevronRight" className="w-[18px] h-[18px]" size={18} />
                            ) : (
                                <Icon name="chevronLeft" className="w-[18px] h-[18px]" size={18} />
                            )}
                        </button>
                        <span className="bg-orange-50 text-orange-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                            {groupTables.length} {!isCollapsed ? 'Đoàn' : ''}
                        </span>
                    </div>
                </div>
                <div className="cashier-page__list-tables bg-white rounded-[32px] shadow-sm border border-orange-50 flex flex-col overflow-hidden min-h-[400px]">
                    <ActiveOrderTableList
                        tables={groupTables}
                        orders={groupOrders}
                        currentTime={currentTime}
                        onTableClick={onTableClick}
                        showSimpleView={true}
                        showPrintedState={true}
                        className="mdt-list-tables__bg-primary"
                    />
                </div>
            </div>
        </div>
    );
};

export default React.memo(CashierGroupLane);
