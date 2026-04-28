import React from 'react';
import { safeParseDate } from '../shared/utils/dateUtils';

// Constants for order delay thresholds (in minutes)
const THRESHOLD_BAR_CRITICAL = 5;
const THRESHOLD_KITCHEN_CRITICAL = 20;
const THRESHOLD_KITCHEN_WARNING = 10;
const THRESHOLD_KITCHEN_ALERT = 5;

// Constants for "new order" highlight logic
const ADDITIONAL_ITEM_THRESHOLD_MS = 30000; // 30 seconds buffer
const NEW_ORDER_PULSING_TIMEOUT_S = 300;    // 5 minutes timeout

const DelayWarnings = ({
    onItemClick,
    title = "Cảnh báo trễ",
    maxHeight = "calc(100vh - 150px)",
    tables,
    orders,
    currentTime,
    filterType = null, // 'food' or 'drink'
    isBar = false
}) => {
    const buckets = React.useMemo(() => {
        if (!orders || !currentTime) return { critical: [], warning: [], alert: [], active: [] };

        const handledOrderIds = new Set();
        const result = {
            critical: {}, // >= 20
            warning: {},  // 10 - < 20
            alert: {},    // 5 - < 10
            active: {}    // 1 - < 5
        };

        const getElapsedTime = (time) => {
            const timeValue = safeParseDate(time).getTime();
            return Math.max(1, Math.floor((safeParseDate(currentTime).getTime() - timeValue) / 60000));
        };

        const processOrder = (tableId, order) => {
            if (!order || !order.id || handledOrderIds.has(order.id)) return;
            handledOrderIds.add(order.id);

            if (order.served && !filterType) return;

            const itemsToProcess = order.items.filter(item => {
                if (item.done || item.status === 'ready' || item.status === 'served') return false;
                if (!filterType) return true;
                return (item.product?.type === filterType) || (item.type === filterType);
            });

            itemsToProcess.forEach((item, idx) => {
                const diff = getElapsedTime(item.orderTime);
                let bucketKey = 'active';
                if (isBar) {
                    if (diff >= THRESHOLD_BAR_CRITICAL) bucketKey = 'critical';
                } else {
                    if (diff >= THRESHOLD_KITCHEN_CRITICAL) bucketKey = 'critical';
                    else if (diff >= THRESHOLD_KITCHEN_WARNING) bucketKey = 'warning';
                    else if (diff >= THRESHOLD_KITCHEN_ALERT) bucketKey = 'alert';
                }

                const bucket = result[bucketKey];
                const itemName = item.name;
                const tableObj = tables?.find(t => t.id.toString() === tableId.toString());
                const tableNumber = tableObj?.name?.replace(/[^0-9]/g, '') || tableId;
                const tableName = order.mergedTables || tableNumber;

                if (!bucket[itemName]) {
                    bucket[itemName] = {
                        name: itemName,
                        totalQuantity: item.quantity,
                        tables: [{ name: tableName, orderTime: item.orderTime, status: item.status, orderStartTime: order.startTime || order.created_at }],
                        maxDiff: diff,
                        itemIds: [item.id],
                        orderId: order.id
                    };
                } else {
                    bucket[itemName].totalQuantity += item.quantity;
                    const existingTable = bucket[itemName].tables.find(t => t.name === tableName);
                    if (!existingTable) {
                        bucket[itemName].tables.push({ name: tableName, orderTime: item.orderTime, status: item.status, orderStartTime: order.startTime || order.created_at });
                    } else {
                        // Keep the earliest order time for this table's dish
                        const existingTime = new Date(existingTable.orderTime).getTime();
                        const newTime = new Date(item.orderTime).getTime();
                        if (newTime < existingTime) {
                            existingTable.orderTime = item.orderTime;
                        }
                        // If any item is pending/new, mark the table as new
                        if (!item.status || item.status === 'pending') {
                            existingTable.status = 'pending';
                        }
                    }
                    bucket[itemName].maxDiff = Math.max(bucket[itemName].maxDiff, diff);
                    bucket[itemName].itemIds.push(item.id);
                }
            });
        };

        if (Array.isArray(orders)) {
            orders.forEach(order => processOrder(order.tableId, order));
        } else {
            Object.entries(orders).forEach(([tableId, order]) => processOrder(tableId, order));
        }

        const formatBucket = (bucketObj) => Object.values(bucketObj).sort((a, b) => b.maxDiff - a.maxDiff);

        return {
            critical: formatBucket(result.critical),
            warning: formatBucket(result.warning),
            alert: formatBucket(result.alert),
            active: formatBucket(result.active)
        };
    }, [tables, orders, currentTime]);

    const renderSection = (items, type) => {
        if (items.length === 0) return null;

        const config = {
            critical: { title: isBar ? 'Thức uống trễ (>= 5p)' : 'Món ăn trễ (>= 20p)', color: 'text-red-600', bg: 'mdt-bg-red ', border: 'mdt-border-red shadow-red-100', dot: 'mdt-bg-red ' },
            warning: { title: 'Món ăn trễ (10p - 20p)', color: 'text-yellow-700', bg: 'bg-yellow-500', border: 'border-yellow-200 shadow-yellow-100', dot: 'bg-yellow-500' },
            alert: { title: 'Món ăn trễ (5p - 10p)', color: 'text-blue-600', bg: 'bg-blue-500', border: 'border-blue-200 shadow-blue-100', dot: 'bg-blue-500' },
            active: { title: isBar ? 'Thức uống (1p - 5p)' : 'Món ăn (1p - 5p)', color: 'text-gray-500', bg: 'bg-gray-400', border: 'border-gray-200 shadow-gray-100', dot: 'bg-gray-400' }
        }[type];

        return (
            <div className="mb-6 animate-[fadeIn_0.3s_ease-out]">
                <div className={`px-3 py-1 flex items-center justify-between font-black text-[12px] border-l-4 rounded-r-md bg-white mb-3 shadow-sm border-[rgba(0,0,0,0.05)] ${config.color === 'text-red-600' ? 'mdt-border-red ' : config.color === 'text-yellow-700' ? 'border-yellow-600' : config.color === 'text-blue-600' ? 'border-blue-600' : 'border-gray-400'}`}>
                    <span>{config.title}</span>
                    <span className={`px-2 py-0.5 rounded-full text-white ${config.bg}`}>{items.length} món</span>
                </div>


                <div className="space-y-3">
                    {items.map((item, idx) => (
                        <div
                            key={`${item.name}-${type}-${idx}`}
                            className={`p-3 rounded-2xl border-2 transition-all bg-white cursor-pointer group ${config.border}`}
                            onClick={() => onItemClick && onItemClick(item.orderId, item.itemIds)}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[14px] font-black text-gray-800 leading-none">{item.name}</span>
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg text-white shadow-sm transition-all duration-300 ${config.bg}`}>
                                        {item.maxDiff}P
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex flex-wrap gap-1 items-center max-w-[70%]">
                                    {item.tables.slice().sort((a, b) => safeParseDate(a.orderTime).getTime() - safeParseDate(b.orderTime).getTime()).map((t, tid) => {
                                        const isAdditional = (safeParseDate(t.orderTime).getTime() - safeParseDate(t.orderStartTime).getTime()) > ADDITIONAL_ITEM_THRESHOLD_MS;
                                        const isNew = (!t.status || t.status === 'pending') && isAdditional;
                                        const isPulsing = isNew && ((safeParseDate(currentTime).getTime() - safeParseDate(t.orderTime).getTime()) / 1000 < NEW_ORDER_PULSING_TIMEOUT_S);
                                        return (
                                            <span key={tid} className="text-[12px] font-bold text-gray-900 bg-gray-50 px-1.5 py-0.5 rounded uppercase flex items-center gap-1">
                                                {isNew && (
                                                    <svg className={`w-2.5 h-2.5 text-red-500 ${isPulsing ? 'animate-pulse' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 2.25a.75.75 0 01.75.75v.5a.75.75 0 01-1.5 0V5a.75.75 0 01.75-.75zM13.25 4a.75.75 0 01.75.75v.5a.75.75 0 01-1.5 0v-.5a.75.75 0 01.75-.75zM17.25 5a.75.75 0 01.75.75v.5a.75.75 0 01-1.5 0v-.5a.75.75 0 01.75-.75zM10 7a3 3 0 100 6 3 3 0 000-6zM7 10a3 3 0 116 0 3 3 0 01-6 0zm10.75 4a.75.75 0 00-1.5 0v.5a.75.75 0 001.5 0v-.5zM13.25 15a.75.75 0 00-1.5 0v.5a.75.75 0 001.5 0v-.5zM9.25 15a.75.75 0 00-1.5 0v.5a.75.75 0 001.5 0v-.5zM5.25 14a.75.75 0 00-1.5 0v.5a.75.75 0 001.5 0v-.5zM2.75 11a.75.75 0 01.75.75v.5a.75.75 0 01-1.5 0v-.5a.75.75 0 01.75-.75zM2.75 7a.75.75 0 01.75.75v.5a.75.75 0 01-1.5 0v-.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
                                                    </svg>
                                                )}
                                                Bàn {t.name.toString().replace(/^Bàn\s+/i, '')}
                                            </span>
                                        );
                                    })}
                                </div>
                                <span className={`text-[14px] font-black group-hover:scale-110 transition-transform ${config.color}`}>x{item.totalQuantity}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const hasAnyItems = buckets.critical.length > 0 || buckets.warning.length > 0 || buckets.alert.length > 0 || buckets.active.length > 0;

    return (
        <div className="mdt-delay-warnings bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col lg:overflow-hidden lg:h-full">
            <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                <h5 className="m-0 tracking-widest">{title}</h5>
            </div>

            <div
                className="p-4 md:px-2 overflow-y-auto lg:overflow-y-auto flex-1 mdt-scrollbar bg-gray-50/20"
                style={{ maxHeight }}
            >
                {hasAnyItems ? (
                    <>
                        {renderSection(buckets.critical, 'critical')}
                        {renderSection(buckets.warning, 'warning')}
                        {renderSection(buckets.alert, 'alert')}
                        {renderSection(buckets.active, 'active')}
                    </>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-300 italic py-10 opacity-60">
                        <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        <p className="text-xs">Không có món nào đang chờ</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DelayWarnings;
