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
    const getOrderForTable = (tableId) => {
        if (!orders) return null;
        let order;
        if (Array.isArray(orders)) {
            order = orders.find(o => o.tableId === tableId || o.tableId?.toString() === tableId.toString());
        } else {
            order = orders[tableId.toString()];
        }

        if (!order || !filterType) return order;

        // Clone and filter items by type if filterType is provided
        const filteredItems = order.items.filter(item => {
            // Note: In real API, product type might be at item.product.type
            return (item.product?.type === filterType) || (item.type === filterType);
        });

        if (filteredItems.length === 0) return null;

        return { ...order, items: filteredItems };
    };

    const isOrderServed = (order) => {
        if (!order) return false;
        if (typeof order.served !== 'undefined' && !filterType) return order.served;
        if (order.items) {
            return order.items.every(item => item.done || item.status === 'ready' || item.status === 'served');
        }
        return false;
    };

    const getTableStatus = (tableId) => {
        const order = getOrderForTable(tableId);
        if (!order) return { statusClass: "", duration: "BÀN TRỐNG" };

        if (isOrderServed(order)) return { statusClass: "mdt-bg-green !text-white", duration: "HOÀN TẤT" };

        const diff = order.items && order.items.length > 0
            ? Math.max(0, ...order.items
                .filter(item => !item.done && item.status !== 'ready' && item.status !== 'served')
                .map(item => Math.max(1, Math.floor((currentTime - new Date(item.orderTime)) / 60000))))
            : 0;
        let statusClass = "is-busy";
        if (diff >= 20) statusClass = "mdt-bg-red !text-white";
        else if (diff >= 10) statusClass = "mdt-bg-yellow mdt-text-primary";
        else if (diff >= 5) statusClass = "mdt-bg-blue !text-white";

        return { statusClass, duration: `${diff} PHÚT` };

    };

    // Filter tables to include only those with an active order (matching the filterType if any)
    const activeTables = tables.filter(table => {
        const order = getOrderForTable(table.id);
        return !!order;
    });

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
                    renderCard={(table, index) => {
                        const { statusClass, duration } = getTableStatus(table.id);
                        const originalIndex = tables.findIndex(t => t.id === table.id);

                        return (
                            <div
                                key={table.id}
                                onClick={() => onTableClick && onTableClick(table)}
                                className={`bg-white p-2 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col items-center justify-center gap-2 cursor-pointer ${statusClass} ${!statusClass ? 'border border-gray-100' : ''}`}
                            >
                                <span className={`text-lg font-black ${!statusClass ? 'text-gray-900' : ''}`}>
                                    {originalIndex + 1}
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
