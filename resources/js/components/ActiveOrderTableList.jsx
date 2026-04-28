import React from 'react';
import { safeParseDate } from '../shared/utils/dateUtils';
import TableGrid from './TableGrid';

// Constants for order status thresholds (in minutes)
const THRESHOLD_BAR_CRITICAL = 10;
const THRESHOLD_KITCHEN_CRITICAL = 20;
const THRESHOLD_KITCHEN_WARNING = 10;
const THRESHOLD_KITCHEN_ALERT = 5;

// Constants for "new order" highlight logic
const ADDITIONAL_ITEM_THRESHOLD_MS = 30000; // 30 seconds buffer for initial order
const NEW_ORDER_PULSING_TIMEOUT_S = 300;    // 5 minutes timeout for pulsing animation

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
    // Memoize filtered orders and pre-calculate heavy values to avoid O(n*m) on every render
    const tableOrderMap = React.useMemo(() => {
        if (!orders) return {};
        const map = {};
        tables.forEach(table => {
            const tableIdStr = table.id.toString();
            const order = orders[tableIdStr];

            if (!order) {
                map[tableIdStr] = null;
                return;
            }

            // 1. Filter and clone items only once
            const items = order.items
                .filter(item => !filterType || (item.product?.type === filterType) || (item.type === filterType))
                .map(item => ({ ...item, orderTimeTs: safeParseDate(item.orderTime).getTime() }));

            if (items.length === 0) {
                map[tableIdStr] = null;
                return;
            }

            // 2. Pre-calculate boundary timestamps for O(1) render-time math
            const startTimeTs = safeParseDate(order.startTime || order.created_at).getTime();
            
            const activeItems = items.filter(item => item.status !== 'ready' && item.status !== 'served');
            const additionalPendingItems = items.filter(item => {
                const isPending = !item.status || item.status === 'pending';
                return isPending && (item.orderTimeTs - startTimeTs > ADDITIONAL_ITEM_THRESHOLD_MS);
            });

            map[tableIdStr] = {
                ...order,
                items,
                isServed: items.every(item => item.status === 'ready' || item.status === 'served'),
                earliestActiveTimeTs: activeItems.length > 0 ? Math.min(...activeItems.map(i => i.orderTimeTs)) : null,
                latestAdditionalPendingTimeTs: additionalPendingItems.length > 0 ? Math.max(...additionalPendingItems.map(i => i.orderTimeTs)) : null,
                hasAdditionalPendingItems: additionalPendingItems.length > 0
            };
        });
        return map;
    }, [tables, orders, filterType]);

    const getTableStatus = (tableId, order, currentTimeTs) => {
        if (!order) return { statusClass: "", duration: "BÀN TRỐNG", isNewOrder: false };

        if (showSimpleView) {
            return { statusClass: "is-busy", duration: "", isNewOrder: false };
        }

        if (order.isServed) return { statusClass: "mdt-bg-green !text-white", duration: "HOÀN TẤT", isNewOrder: false };

        const diff = order.earliestActiveTimeTs
            ? Math.max(1, Math.floor((currentTimeTs - order.earliestActiveTimeTs) / 60000))
            : 0;

        let statusClass = "is-busy";
        if (isBar) {
            if (diff >= THRESHOLD_BAR_CRITICAL) statusClass = "mdt-bg-red !text-white";
        } else {
            if (diff >= THRESHOLD_KITCHEN_CRITICAL) statusClass = "mdt-bg-red !text-white";
            else if (diff >= THRESHOLD_KITCHEN_WARNING) statusClass = "mdt-bg-yellow mdt-text-primary";
            else if (diff >= THRESHOLD_KITCHEN_ALERT) statusClass = "mdt-bg-blue !text-white";
        }

        // Add highlight for new orders (only for ADDITIONAL items, not initial order)
        let isNewOrder = false;
        if (showNewOrderHighlight && order.hasAdditionalPendingItems) {
            isNewOrder = true;

            // Pulsing animation (.is-new-order) is removed after timeout
            const latestDiffSeconds = (currentTimeTs - order.latestAdditionalPendingTimeTs) / 1000;
            if (latestDiffSeconds < NEW_ORDER_PULSING_TIMEOUT_S) {
                statusClass += " is-new-order";
            }
        }


        return { statusClass, duration: `${diff} PHÚT`, isNewOrder };
    };

    const activeTables = React.useMemo(() => {
        return tables.filter(table => {
            const order = tableOrderMap[table.id.toString()];
            return order && order.items && order.items.length > 0;
        });
    }, [tables, tableOrderMap]);

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
                            renderCard={(table) => {
                                const order = tableOrderMap[table.id.toString()];
                                const { statusClass, duration, isNewOrder } = getTableStatus(table.id, order, currentTimeTs);

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
                    );
                })()}
            </div>
        </div>
    );
};

export default ActiveOrderTableList;
