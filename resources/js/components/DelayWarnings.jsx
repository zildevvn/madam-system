import React, { useState } from 'react';
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
    const [selectedItem, setSelectedItem] = useState(null);
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
                        orderId: order.id,
                        tableNotes: item.note ? [{ tableName, note: item.note }] : []
                    };
                } else {
                    bucket[itemName].totalQuantity += item.quantity;
                    if (item.note) {
                        bucket[itemName].tableNotes.push({ tableName, note: item.note });
                    }
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
                            className={`item-food p-3 rounded-2xl border-2 transition-all bg-white cursor-pointer group ${config.border}`}
                            onClick={() => setSelectedItem(item)}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-[14px] font-black text-gray-800 leading-none">{item.name}</span>

                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg text-white shadow-sm transition-all duration-300 ${config.bg}`}>
                                        {item.maxDiff}P
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex flex-wrap gap-1 items-center max-w-[70%]">
                                    {item.tables.slice().sort((a, b) => safeParseDate(a.orderTime).getTime() - safeParseDate(b.orderTime).getTime()).map((t, tid) => {
                                        return (
                                            <span key={tid} className="text-[12px] font-bold text-gray-900 bg-gray-50 px-1.5 py-0.5 rounded uppercase flex items-center gap-1">
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

            {/* Detailed Dish Note Modal */}
            {selectedItem && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-[16px] w-full max-w-sm overflow-hidden shadow-xl animate-in zoom-in-95 duration-200 border border-white/20">
                        <div className="p-4">
                            <div className="space-y-3">
                                <div className="p-4 bg-orange-50 rounded-[12px] border border-orange-100 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                        </svg>
                                    </div>
                                    {selectedItem.tableNotes && selectedItem.tableNotes.length > 0 ? (
                                        <ul className="space-y-3 relative z-10">
                                            {selectedItem.tableNotes.map((tn, nIdx) => (
                                                <li key={nIdx} className="flex gap-2 text-[15px]">
                                                    <span className="text-gray-400 font-bold shrink-0">Bàn {tn.tableName.toString().replace(/^Bàn\s+/i, 'Bàn ')}:</span>
                                                    <span className="text-orange-950 font-black italic">"{tn.note}"</span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div className="py-4 text-center">
                                            <p className="text-gray-400 font-bold italic text-sm">Không có ghi chú cho món này</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex gap-3">
                            <button
                                onClick={() => setSelectedItem(null)}
                                className="flex-1 py-4 bg-white text-gray-400 rounded-2xl font-black border border-gray-200 hover:text-gray-900 hover:border-gray-900 transition-all active:scale-[0.98] uppercase tracking-wider text-sm"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DelayWarnings;
