import React from 'react';
import TableGrid from './TableGrid';

const ActiveOrderTableList = ({
    tables,
    orders,
    currentTime,
    onTableClick,
    title = "Danh sách bàn",
    className = "",
    filterType = null // 'food' or 'drink'
}) => {
    // Standardized: orders must be a dictionary keyed by table ID
    const getOrderForTable = (tableId) => {
        const order = orders && orders[tableId.toString()];
        if (!order || !filterType) return order;

        // Clone and filter items by type if filterType is provided
        const filteredItems = order.items.filter(item => {
            return (item.product?.type === filterType) || (item.type === filterType);
        });

        if (filteredItems.length === 0) return null;
        return { ...order, items: filteredItems };
    };

    const isOrderServed = (order) => {
        if (!order || !order.items) return false;
        return order.items.every(item => item.status === 'ready' || item.status === 'served');
    };

    const getTableStatus = (tableId) => {
        const order = getOrderForTable(tableId);
        if (!order) return { statusClass: "", duration: "BÀN TRỐNG" };

        if (isOrderServed(order)) return { statusClass: "mdt-bg-green !text-white", duration: "HOÀN TẤT" };

        const activeItems = order.items.filter(item => item.status !== 'ready' && item.status !== 'served');
        const diff = activeItems.length > 0
            ? Math.max(1, ...activeItems.map(item => Math.floor((currentTime - new Date(item.orderTime)) / 60000)))
            : 0;

        let statusClass = "is-busy";
        if (diff >= 20) statusClass = "mdt-bg-red !text-white";
        else if (diff >= 10) statusClass = "mdt-bg-yellow mdt-text-primary";
        else if (diff >= 5) statusClass = "mdt-bg-blue !text-white";

        return { statusClass, duration: `${diff} PHÚT` };
    };

    const activeTables = tables.filter(table => !!getOrderForTable(table.id));

    return (
        <div className={`flex flex-col lg:overflow-hidden lg:h-full ${className}`}>
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white text-orange-500">
                <h5 className="m-0">{title}</h5>
                <span className="text-xs font-black bg-orange-100 px-3 py-1 rounded-full">
                    {activeTables.length} BÀN
                </span>
            </div>
            <div className="p-4 md:px-2 lg:overflow-y-auto flex-1 hide-scrollbar">
                <TableGrid
                    tables={activeTables}
                    onTableClick={onTableClick}
                    gridClassName="list-tables grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 md:gap-4"
                    renderCard={(table) => {
                        const { statusClass, duration } = getTableStatus(table.id);
                        const order = getOrderForTable(table.id);

                        return (
                            <div
                                key={table.id}
                                onClick={() => onTableClick && onTableClick(table)}
                                className={`bg-white p-2 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col items-center justify-center gap-2 cursor-pointer ${statusClass} ${!statusClass ? 'border border-gray-100' : ''}`}
                            >
                                <span className={`text-[16px] font-black text-center ${!statusClass ? 'text-gray-900' : ''}`}>
                                    {order?.mergedTables || table.name?.replace(/[^0-9]/g, '') || table.id}
                                </span>
                                <div className="w-full h-[1px] bg-current opacity-20 rounded-full"></div>
                                <span className={`text-[8px] font-bold uppercase tracking-wider ${!statusClass ? 'text-gray-400' : ''}`}>
                                    {duration}
                                </span>
                            </div>
                        );
                    }}
                />
            </div>
        </div>
    );
};

export default ActiveOrderTableList;
