import React from 'react';

const DelayWarnings = ({
    onItemClick,
    title = "Cảnh báo trễ",
    maxHeight = "calc(100vh - 150px)",
    tables,
    orders,
    currentTime,
    filterType = null // 'food' or 'drink'
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
            const timeValue = time instanceof Date ? time.getTime() : new Date(time).getTime();
            return Math.max(1, Math.floor((currentTime - timeValue) / 60000));
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
                if (diff >= 20) bucketKey = 'critical';
                else if (diff >= 10) bucketKey = 'warning';
                else if (diff >= 5) bucketKey = 'alert';

                const bucket = result[bucketKey];
                const itemName = item.name;
                const tableObj = tables?.find(t => t.id.toString() === tableId.toString());
                const tableNumber = tableObj?.name?.replace(/[^0-9]/g, '') || tableId;
                const tableName = order.mergedTables || tableNumber;

                if (!bucket[itemName]) {
                    bucket[itemName] = {
                        name: itemName,
                        totalQuantity: item.quantity,
                        tables: [{ name: tableName, orderTime: item.orderTime }],
                        maxDiff: diff,
                        itemIds: [item.id],
                        orderId: order.id
                    };
                } else {
                    bucket[itemName].totalQuantity += item.quantity;
                    const existingTable = bucket[itemName].tables.find(t => t.name === tableName);
                    if (!existingTable) {
                        bucket[itemName].tables.push({ name: tableName, orderTime: item.orderTime });
                    } else {
                        // Keep the earliest order time for this table's dish
                        const existingTime = new Date(existingTable.orderTime).getTime();
                        const newTime = new Date(item.orderTime).getTime();
                        if (newTime < existingTime) {
                            existingTable.orderTime = item.orderTime;
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
            critical: { title: 'Món ăn trễ (>= 20p)', color: 'text-red-600', bg: 'mdt-bg-red ', border: 'mdt-border-red shadow-red-100', dot: 'mdt-bg-red ' },
            warning: { title: 'Món ăn trễ (10p - 20p)', color: 'text-yellow-700', bg: 'bg-yellow-500', border: 'border-yellow-200 shadow-yellow-100', dot: 'bg-yellow-500' },
            alert: { title: 'Món ăn trễ (5p - 10p)', color: 'text-blue-600', bg: 'bg-blue-500', border: 'border-blue-200 shadow-blue-100', dot: 'bg-blue-500' },
            active: { title: 'Món ăn (1p - 5p)', color: 'text-gray-500', bg: 'bg-gray-400', border: 'border-gray-200 shadow-gray-100', dot: 'bg-gray-400' }
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
                                    {item.tables.slice().sort((a, b) => new Date(a.orderTime) - new Date(b.orderTime)).map((t, tid) => (
                                        <span key={tid} className="text-[12px] font-bold text-gray-900 bg-gray-50 px-1.5 py-0.5 rounded uppercase">Bàn {t.name.toString().replace(/^Bàn\s+/i, '')}</span>
                                    ))}
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
