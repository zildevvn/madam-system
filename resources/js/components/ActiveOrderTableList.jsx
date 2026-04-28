import React from 'react';
import { safeParseDate } from '../shared/utils/dateUtils';
import { useActiveTableOrders } from '../shared/utils/activeOrderUtils';
import TableGrid from './TableGrid';
import ActiveOrderTableCard from './ActiveOrderTableCard';

const ActiveOrderTableList = ({
    tables,
    orders,
    currentTime,
    onTableClick,
    title = "Danh sách bàn",
    className = "",
    filterType = null, // 'food' or 'drink'
    showNewOrderHighlight = false,
    showSimpleView = false,
    isBar = false
}) => {
    // 1. Data Consolidation and Memoization
    const tableOrderMap = useActiveTableOrders(tables, orders, filterType);

    // 2. Active Tables Filtering
    const activeTables = React.useMemo(() => {
        return tables.filter(table => {
            const order = tableOrderMap[table.id.toString()];
            return order && order.items && order.items.length > 0;
        });
    }, [tables, tableOrderMap]);

    // 3. Memoize status options for cards to avoid breaking child memoization
    const cardOptions = React.useMemo(() => ({ 
        isBar, 
        showSimpleView, 
        showNewOrderHighlight 
    }), [isBar, showSimpleView, showNewOrderHighlight]);

    return (
        <div className={`flex flex-col lg:overflow-hidden lg:h-full ${className}`}>
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white text-orange-500">
                <h5 className="m-0 font-black">{title}</h5>
                <span className="text-xs font-black bg-orange-100 px-3 py-1 rounded-full">
                    {activeTables.length} BÀN
                </span>
            </div>
            
            <div className="p-4 md:px-2 lg:overflow-y-auto flex-1 hide-scrollbar">
                {(() => {
                    const currentTimeTs = safeParseDate(currentTime).getTime();
                    return (
                        <TableGrid
                            tables={activeTables}
                            onTableClick={onTableClick}
                            gridClassName="list-tables grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 md:gap-4"
                            renderCard={(table) => (
                                <ActiveOrderTableCard 
                                    key={table.id}
                                    table={table}
                                    order={tableOrderMap[table.id.toString()]}
                                    currentTimeTs={currentTimeTs}
                                    onTableClick={onTableClick}
                                    options={cardOptions}
                                />
                            )}
                        />
                    );
                })()}
            </div>
        </div>
    );
};

export default ActiveOrderTableList;
