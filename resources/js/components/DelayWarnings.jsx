import React from 'react';

const STATUS_CONFIG_DEFAULT = {
    pending: { label: 'Chờ', colorClass: 'bg-blue-50 text-blue-600 border-blue-100', dotClass: 'bg-blue-500' },
    cooking: { label: 'Gội', colorClass: 'bg-orange-50 text-orange-600 border-orange-100', dotClass: 'bg-orange-500 animate-pulse' },
    ready: { label: 'Xong', colorClass: 'bg-green-50 text-green-600 border-green-100', dotClass: 'bg-green-500' },
    served: { label: 'Đã giao', colorClass: 'bg-gray-50 text-gray-400 border-gray-100', dotClass: 'bg-gray-300' }
};

const DelayWarnings = ({
    warningItems: externalWarningItems,
    onItemClick,
    title = "Cảnh báo trễ",
    maxHeight = "calc(100vh - 250px)",
    statusConfig = STATUS_CONFIG_DEFAULT,
    tables,
    orders,
    currentTime
}) => {
    const warningItems = React.useMemo(() => {
        if (externalWarningItems) return externalWarningItems;
        if (!orders || !currentTime) return [];

        const warnings = [];
        const getElapsedTime = (time) => {
            const timeValue = time instanceof Date ? time.getTime() : new Date(time).getTime();
            return Math.floor((currentTime - timeValue) / 60000);
        };

        const processOrder = (tableId, order) => {
            if (order.served) return;
            order.items.forEach((item, idx) => {
                // Skip if already done (Bills) or ready/served (Kitchen)
                if (item.done || item.status === 'ready' || item.status === 'served') return;

                const diff = getElapsedTime(item.orderTime);
                if (diff >= 10) {
                    const tableIndex = tables ? tables.findIndex(t => t.id.toString() === tableId.toString()) : -1;
                    const tableName = order.tableName || (tableIndex !== -1 ? `BÀN ${tableIndex + 1}` : `BÀN ${tableId}`);

                    warnings.push({
                        ...item,
                        tableId,
                        tableName,
                        diff,
                        orderId: order.id,
                        id: item.id || `${tableId}-${idx}`
                    });
                }
            });
        };

        if (Array.isArray(orders)) {
            orders.forEach(order => processOrder(order.tableId, order));
        } else {
            Object.entries(orders).forEach(([tableId, order]) => processOrder(tableId, order));
        }

        return warnings.sort((a, b) => b.diff - a.diff);
    }, [externalWarningItems, tables, orders, currentTime]);

    return (
        <div className="mdt-delay-warnings bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col overflow-hidden h-full">
            <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                <h5 className="m-0">{title}</h5>
                <svg className="w-4 h-4 text-red-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            </div>
            <div
                className="p-4 md:px-2 overflow-y-auto flex-1 hide-scrollbar bg-red-50/30"
                style={{ maxHeight }}
            >
                {warningItems.length > 0 ? (
                    <div className="space-y-3">
                        {warningItems.map((item, idx) => (
                            <div
                                key={`${item.id}-${idx}`}
                                onClick={() => onItemClick && onItemClick(item.orderId, item.id)}
                                className={`p-4 rounded-2xl border-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm cursor-pointer ${item.diff >= 15 ? 'bg-white border-red-200 text-red-600 shadow-red-100' : 'bg-white border-yellow-200 text-yellow-700 shadow-yellow-100'}`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg ${item.diff >= 15 ? 'bg-red-500 text-white' : 'bg-yellow-500 text-white'}`}>
                                        {item.diff} PHÚT
                                    </span>
                                    <span className="text-[10px] font-black text-gray-400 uppercase">{item.tableName}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <h6 className="m-0">{item.name}</h6>
                                    <span className="text-xs font-black">x{item.quantity}</span>
                                </div>
                                {item.status && (
                                    <div className="mt-2 text-[8px] font-bold uppercase tracking-widest opacity-60 flex items-center gap-1">
                                        <div className={`w-1.5 h-1.5 rounded-full ${statusConfig[item.status]?.dotClass || ''}`}></div>
                                        {statusConfig[item.status]?.label || item.status}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-300 italic py-10 opacity-60">
                        <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        <p className="text-xs">Không có món quá hạn</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DelayWarnings;
