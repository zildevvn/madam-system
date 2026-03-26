import React from 'react';
import TableGrid from './TableGrid';

const TableList = ({
    tables,
    orders,
    currentTime,
    onTableClick,
    title = "Danh sách bàn",
    className = ""
}) => {
    const getOrderForTable = (tableId) => {
        if (!orders) return null;
        if (Array.isArray(orders)) {
            return orders.find(o => o.tableId === tableId || o.tableId?.toString() === tableId.toString());
        }
        return orders[tableId.toString()];
    };

    const isOrderServed = (order) => {
        if (!order) return false;
        if (typeof order.served !== 'undefined') return order.served;
        if (order.items) {
            return order.items.every(item => item.done || item.status === 'ready' || item.status === 'served');
        }
        return false;
    };

    const getTableStatus = (tableId) => {
        const order = getOrderForTable(tableId);
        if (!order) return { statusClass: "", duration: "BÀN TRỐNG" };

        if (isOrderServed(order)) return { statusClass: "!bg-green-400 !text-white", duration: "HOÀN TẤT" };

        const startTime = order.startTime || (order.items && order.items[0]?.orderTime);
        if (!startTime || !currentTime) return { statusClass: "is-busy", duration: "ĐANG CÓ KHÁCH" };

        const diff = Math.max(1, Math.floor((currentTime - new Date(startTime)) / 60000));
        let statusClass = "is-busy";
        if (diff >= 15) statusClass = "!bg-red-400 !text-white";
        else if (diff >= 10) statusClass = "!bg-yellow-100 !text-yellow-700";

        return { statusClass, duration: `${diff} PHÚT` };
    };

    return (
        <div className={`flex flex-col overflow-hidden h-full ${className}`}>
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
                <h5 className="m-0">{title}</h5>
            </div>
            <div className="p-4 md:px-2 overflow-y-auto flex-1 hide-scrollbar">
                <TableGrid
                    tables={tables}
                    onTableClick={onTableClick}
                    gridClassName="list-tables grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 md:gap-4"
                    renderCard={(table, index) => {
                        const { statusClass, duration } = getTableStatus(table.id);
                        return (
                            <div
                                key={table.id}
                                onClick={() => onTableClick && onTableClick(table)}
                                className={`bg-white p-2 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col items-center justify-center gap-2 cursor-pointer ${statusClass} ${!statusClass ? 'border border-gray-100' : ''}`}
                            >
                                <span className={`text-lg font-black ${!statusClass ? 'text-gray-900' : ''}`}>
                                    {tables.length > 20 ? table.id : index + 1}
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

export default TableList;
