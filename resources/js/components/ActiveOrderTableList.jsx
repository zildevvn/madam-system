import React from 'react';
import TableGrid from './TableGrid';

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
        if (!order) return { statusClass: "", duration: "BÀN TRỐNG", isNewOrder: false };

        if (showSimpleView) {
            return { statusClass: "is-busy", duration: "", isNewOrder: false };
        }

        if (isOrderServed(order)) return { statusClass: "mdt-bg-green !text-white", duration: "HOÀN TẤT", isNewOrder: false };

        const activeItems = order.items.filter(item => item.status !== 'ready' && item.status !== 'served');
        const diff = activeItems.length > 0
            ? Math.max(1, ...activeItems.map(item => Math.floor((currentTime - new Date(item.orderTime)) / 60000)))
            : 0;

        let statusClass = "is-busy";
        if (isBar) {
            if (diff >= 10) statusClass = "mdt-bg-red !text-white";
        } else {
            if (diff >= 20) statusClass = "mdt-bg-red !text-white";
            else if (diff >= 10) statusClass = "mdt-bg-yellow mdt-text-primary";
            else if (diff >= 5) statusClass = "mdt-bg-blue !text-white";
        }

        // Add highlight for new orders (only for ADDITIONAL items, not initial order)
        let isNewOrder = false;
        if (showNewOrderHighlight && order.items && order.items.length > 0) {
            // Check if any pending item was added at least 30 seconds after the order was first created
            const hasAdditionalPendingItems = order.items.some(item => {
                const isPending = !item.status || item.status === 'pending';
                const isAdditional = (new Date(item.orderTime).getTime() - new Date(order.startTime).getTime()) > 30000;
                return isPending && isAdditional;
            });

            if (hasAdditionalPendingItems) {
                isNewOrder = true;

                // Pulsing animation (.is-new-order) is removed after 5 minutes
                const minDiffSeconds = Math.min(...order.items.map(item =>
                    (currentTime - new Date(item.orderTime)) / 1000
                ));
                if (minDiffSeconds < 300) {
                    statusClass += " is-new-order";
                }
            }
        }


        return { statusClass, duration: `${diff} PHÚT`, isNewOrder };
    };

    const activeTables = tables.filter(table => {
        const order = getOrderForTable(table.id);
        return order && order.items && order.items.length > 0;
    });

    return (
        <div className={`flex flex-col lg:overflow-hidden lg:h-full ${className}`}>
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white text-orange-500">
                <h5 className="m-0 font-black">{title}</h5>
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
                        const { statusClass, duration, isNewOrder } = getTableStatus(table.id);
                        const order = getOrderForTable(table.id);

                        return (
                            <div
                                key={table.id}
                                onClick={() => onTableClick && onTableClick(table)}
                                className={`relative bg-white p-3 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col items-center justify-center gap-1 cursor-pointer ${statusClass} ${!statusClass ? 'border border-gray-100' : ''} ${table.isGroupLinked ? 'is-group-linked' : ''} ${table.groupColorIndex ? `is-group-color-${table.groupColorIndex}` : ''}`}
                            >

                                <span className={`label-table text-[16px] font-black text-center flex items-center justify-center gap-1.5 ${!statusClass ? 'text-gray-900' : ''}`}>
                                    <div className="icon-new">
                                        {isNewOrder && (
                                            <svg width="20px" height="20px" stroke-width="1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="#fff"><path d="M22 14V8.5M6 13V6C6 4.34315 7.34315 3 9 3H14" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M16.9922 4H19.9922M22.9922 4L19.9922 4M19.9922 4V1M19.9922 4V7" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12 21H6C3.79086 21 2 19.2091 2 17C2 14.7909 3.79086 13 6 13H17H18C15.7909 13 14 14.7909 14 17C14 19.2091 15.7909 21 18 21C20.2091 21 22 19.2091 22 17V14" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                                        )}
                                    </div>

                                    {(() => {
                                        // 1. Detect Group Reservation range from table_ids
                                        if (order?.reservation?.type === 'group' && Array.isArray(order.reservation.table_ids)) {
                                            return order.reservation.table_ids
                                                .map(id => id.toString().replace(/^Bàn\s+/i, ''))
                                                .sort((a, b) => parseInt(a) - parseInt(b))
                                                .join('-');
                                        }
                                        // 2. Fallback to standard merged name or single table name
                                        return (order?.tableName || order?.mergedTables || table.name || table.id.toString()).toString().replace(/^Bàn\s+/i, '');
                                    })()}
                                </span>

                                {order?.guestCount > 0 && (
                                    <span className={`text-[10px] font-bold flex items-center gap-1 ${!statusClass ? 'text-gray-400' : ''}`}>
                                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                        {order.guestCount}
                                    </span>
                                )}

                                {duration && (
                                    <>
                                        <div className="w-full h-[1px] bg-current opacity-20 rounded-full"></div>
                                        <span className={`text-[8px] font-bold uppercase tracking-wider ${!statusClass ? 'text-gray-400' : ''}`}>
                                            {duration}
                                        </span>
                                    </>
                                )}
                            </div>
                        );
                    }}
                />
            </div>
        </div>
    );
};

export default ActiveOrderTableList;
