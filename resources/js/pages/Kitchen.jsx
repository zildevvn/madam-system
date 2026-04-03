import React, { useState, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchTables } from '../store/slices/tableSlice';
import ActiveOrderTableList from '../components/ActiveOrderTableList';
import DelayWarnings from '../components/DelayWarnings';

const STATUS_CONFIG = {
    pending: { label: 'Chờ', colorClass: 'bg-blue-50 text-blue-600 border-blue-100', dotClass: 'bg-blue-500' },
    cooking: { label: 'Gội', colorClass: 'bg-orange-50 text-orange-600 border-orange-100', dotClass: 'bg-orange-500 animate-pulse' },
    ready: { label: 'Xong', colorClass: 'bg-green-50 text-green-600 border-green-100', dotClass: 'bg-green-500' },
    served: { label: 'Đã giao', colorClass: 'bg-gray-50 text-gray-400 border-gray-100', dotClass: 'bg-gray-300' }
};

const Kitchen = () => {
    const dispatch = useAppDispatch();
    const { status: tableStatus } = useAppSelector(state => state.table);
    const tables = useAppSelector(state => state.table.allIds.map(id => state.table.byId[id]));
    const [currentTime, setCurrentTime] = useState(new Date());

    const { orders, activeTablesToDisplay } = useMemo(() => {
        const tableIdToGroupKey = {};
        const consolidatedGroups = {};

        // 1. Build global merge map
        tables.forEach(t => {
            if (t.active_order && t.active_order.merged_tables) {
                const groupKey = t.active_order.merged_tables;
                const involvedIds = groupKey.split('-');
                involvedIds.forEach(id => {
                    tableIdToGroupKey[id] = groupKey;
                });
            }
        });

        // 2. Consolidate orders
        const handledOrderIds = new Set();
        tables.forEach(t => {
            if (t.active_order && t.active_order.items) {
                // Prevent processing the same order multiple times if it's attached to multiple tables
                if (handledOrderIds.has(t.active_order.id)) return;
                handledOrderIds.add(t.active_order.id);

                const groupKey = tableIdToGroupKey[t.id.toString()] || t.id.toString();

                if (!consolidatedGroups[groupKey]) {
                    consolidatedGroups[groupKey] = {
                        id: t.active_order.id,
                        tableId: t.id,
                        tableName: t.name || `Bàn ${t.id}`,
                        mergedTables: groupKey.includes('-') ? groupKey : null,
                        startTime: new Date(t.active_order.created_at || t.active_order.updated_at),
                        items: []
                    };
                }

                const groupItems = t.active_order.items
                    .filter(item => !item.product || item.product.type === 'food' || item.type === 'food')
                    .map(item => ({
                        id: item.id,
                        name: item.product?.name || 'Unknown',
                        quantity: item.quantity,
                        status: item.status || 'pending',
                        orderTime: new Date(item.created_at),
                        product: item.product,
                        type: item.product?.type || item.type || 'food'
                    }));

                consolidatedGroups[groupKey].items.push(...groupItems);

                const orderTime = new Date(t.active_order.created_at || t.active_order.updated_at);
                if (orderTime < consolidatedGroups[groupKey].startTime) {
                    consolidatedGroups[groupKey].startTime = orderTime;
                }
            }
        });

        const displayedGroups = new Set();
        const filteredTables = tables.filter(t => {
            if (!t.active_order) return false;
            const groupKey = tableIdToGroupKey[t.id.toString()] || t.id.toString();

            if (displayedGroups.has(groupKey)) return false;
            displayedGroups.add(groupKey);
            return true;
        });

        return {
            orders: Object.values(consolidatedGroups).filter(o => o.items.length > 0),
            activeTablesToDisplay: filteredTables
        };
    }, [tables]);

    useEffect(() => {
        if (tableStatus === 'idle') {
            dispatch(fetchTables());
        }
    }, [tableStatus, dispatch]);

    useEffect(() => {
        if (window.Echo) {
            const channel = window.Echo.channel('orders');

            const handleUpdate = (e) => {
                console.log('Real-time order update received:', e);
                dispatch(fetchTables());
            };

            channel.listen('.order_created', handleUpdate)
                .listen('.order_updated', handleUpdate)
                .listen('.item_status_updated', handleUpdate);

            return () => {
                window.Echo.leaveChannel('orders');
            };
        }
    }, [dispatch]);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 10000);
        return () => clearInterval(timer);
    }, []);

    const handleItemStatusChange = async (orderId, itemId) => {
        // Find current status to calculate next shift
        const targetOrder = orders.find(o => o.id === orderId);
        if (!targetOrder) return;
        const targetItem = targetOrder.items.find(i => i.id === itemId);
        if (!targetItem) return;

        let nextStatus = 'pending';
        if (targetItem.status === 'pending') nextStatus = 'cooking';
        else if (targetItem.status === 'cooking') nextStatus = 'ready';
        else if (targetItem.status === 'ready') nextStatus = 'served';

        try {
            await window.axios.put(`/api/order-items/${itemId}/status`, { status: nextStatus });
        } catch (error) {
            console.error('Failed to update item status:', error);
        }
    };


    // --- CENTER COLUMN LOGIC (Consolidated Items) ---
    const consolidatedItems = useMemo(() => {
        const itemMap = {};
        orders.forEach(order => {
            order.items.forEach(item => {
                if (item.status === 'served') return;
                if (!itemMap[item.name]) {
                    itemMap[item.name] = {
                        name: item.name,
                        quantity: 0,
                        pending: 0,
                        cooking: 0,
                        ready: 0,
                        tables: []
                    };
                }
                itemMap[item.name].quantity += item.quantity;
                itemMap[item.name][item.status] += item.quantity;

                const tableIdentifier = order.mergedTables || order.tableName?.replace(/[^0-9]/g, '') || order.tableId;
                if (!itemMap[item.name].tables.includes(tableIdentifier)) {
                    itemMap[item.name].tables.push(tableIdentifier);
                }
            });
        });
        return Object.values(itemMap).sort((a, b) => b.quantity - a.quantity);
    }, [orders]);

    return (

        <div className="mdt-kitchen-page max-w-[1600px] mx-auto px-4 lg:px-6 py-4 lg:h-[calc(100vh-0px)] lg:overflow-hidde bg-gray-50">
            <div className="grid grid-cols-12 gap-4 lg:gap-6 h-auto lg:h-full">

                {/* LEFT COLUMN: Table List (Adaptive Width) */}
                <div className="col-span-12 md:col-span-4 lg:col-span-3 bg-gray-50/50 rounded-3xl shadow-sm border border-gray-100 flex flex-col lg:overflow-hidden lg:h-full">
                    <ActiveOrderTableList
                        tables={activeTablesToDisplay}
                        orders={orders}
                        currentTime={currentTime}
                        filterType="food"
                    />
                </div>

                {/* CENTER COLUMN: Dish List (Adaptive Width) */}
                <div className="col-span-12 md:col-span-8 lg:col-span-6 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col lg:overflow-hidden h-[500px] md:h-auto lg:h-full">
                    <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                        <h5 className="tracking-widest m-0"> Danh sách món </h5>
                        <span className="text-xs font-bold bg-orange-100 mdt-text-primary px-3 py-1 rounded-full uppercase">
                            {consolidatedItems.length} loại món
                        </span>
                    </div>
                    <div className="p-6 lg:overflow-y-auto flex-1 hide-scrollbar">
                        {consolidatedItems.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                                {consolidatedItems.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between px-2 py-3 bg-gray-50 rounded-xl border border-transparent hover:border-orange-200 transition-colors group">
                                        <div className="flex flex-col gap-1 flex-1">
                                            <h6 className="m-0 text-sm md:text-base font-bold text-gray">{item.name}</h6>
                                            <div className="flex flex-wrap gap-1">
                                                {item.tables.map((t, tid) => (
                                                    <span key={tid} className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-700 uppercase tracking-tighter">
                                                        Bàn {t}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-center text-sm font-black mdt-text-primary bg-orange-50 w-10 h-10 rounded-xl shadow-sm border border-orange-100">
                                            X{item.quantity}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-300 italic py-20">
                                <svg className="w-16 h-16 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <p>Không có món nào đang chờ xử lý</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN: Time Warnings (Full width on Tablet, 1/4 on Desktop) */}
                <div className="col-span-12 lg:col-span-3 lg:h-full flex flex-col lg:overflow-hidden">
                    <DelayWarnings
                        tables={tables}
                        orders={orders}
                        currentTime={currentTime}
                        onItemClick={handleItemStatusChange}
                        filterType="food"
                    />
                </div>

            </div>
        </div>

    );
};

export default Kitchen;