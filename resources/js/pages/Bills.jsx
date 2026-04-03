import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchTables, selectAllTables } from '../store/slices/tableSlice';
import { updateItemStatusAsync } from '../store/slices/orderSlice';
import ActiveOrderTableList from '../components/ActiveOrderTableList';
import DelayWarnings from '../components/DelayWarnings';
import TableDetailModal from '../components/TableDetailModal';

const Bills = () => {
    const dispatch = useAppDispatch();
    const { status, error } = useAppSelector(state => state.table);
    const tables = useAppSelector(selectAllTables);
    const [selectedTable, setSelectedTable] = useState(null);
    const [currentTime, setCurrentTime] = useState(new Date());

    // Reactive map automatically compiled directly from the live API response mapped onto the Table Redux Store
    const { activeOrders, activeTablesToDisplay } = React.useMemo(() => {
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
        tables.forEach(t => {
            if (t.active_order && t.active_order.items) {
                const groupKey = tableIdToGroupKey[t.id.toString()] || t.id.toString();

                if (!consolidatedGroups[groupKey]) {
                    consolidatedGroups[groupKey] = {
                        id: t.active_order.id,
                        mergedTables: groupKey.includes('-') ? groupKey : null,
                        startTime: new Date(t.active_order.created_at || t.active_order.updated_at),
                        items: [],
                        itemsMap: {}
                    };
                }

                t.active_order.items.forEach(item => {
                    const productId = item.product_id;
                    const note = item.note || '';
                    const compositeKey = `${productId}-${note}`;
                    const group = consolidatedGroups[groupKey];
                    
                    if (group.itemsMap[compositeKey]) {
                        group.itemsMap[compositeKey].quantity += item.quantity;
                        group.itemsMap[compositeKey].allIds.push(item.id);
                        
                        const itemTime = new Date(item.created_at);
                        if (itemTime < group.itemsMap[compositeKey].orderTime) {
                            group.itemsMap[compositeKey].orderTime = itemTime;
                        }
                    } else {
                        group.itemsMap[compositeKey] = {
                            id: item.id,
                            allIds: [item.id],
                            name: item.product?.name || 'Unknown',
                            quantity: item.quantity,
                            orderTime: new Date(item.created_at),
                            done: item.status === 'served',
                            status: item.status || 'pending',
                            product: item.product,
                            type: item.type || item.product?.type,
                            note: item.note
                        };
                    }
                });

                const orderTime = new Date(t.active_order.created_at || t.active_order.updated_at);
                if (orderTime < consolidatedGroups[groupKey].startTime) {
                    consolidatedGroups[groupKey].startTime = orderTime;
                }
            }
        });

        const orderDict = {};
        const displayedGroups = new Set();
        const filteredTables = tables.filter(t => {
            if (!t.active_order) return false;
            const groupKey = tableIdToGroupKey[t.id.toString()] || t.id.toString();
            
            // If it's a merged group, we only display the table that matches the first ID (initiator)
            if (groupKey.includes('-')) {
                const primaryId = groupKey.split('-')[0];
                if (t.id.toString() !== primaryId) return false;
            }

            if (consolidatedGroups[groupKey]) {
                if (consolidatedGroups[groupKey].itemsMap) {
                    consolidatedGroups[groupKey].items = Object.values(consolidatedGroups[groupKey].itemsMap);
                    delete consolidatedGroups[groupKey].itemsMap;
                }
                orderDict[t.id.toString()] = {
                    ...consolidatedGroups[groupKey],
                    served: consolidatedGroups[groupKey].items.every(i => i.status === 'served')
                };
            }

            if (displayedGroups.has(groupKey)) return false;
            displayedGroups.add(groupKey);
            return true;
        });

        return { activeOrders: orderDict, activeTablesToDisplay: filteredTables };
    }, [tables]);

    const handleToggleItemStatus = async (item) => {
        const nextStatus = item.status === 'served' ? 'ready' : 'served';
        try {
            const ids = item.allIds || [item.id];
            await Promise.all(ids.map(id => dispatch(updateItemStatusAsync({ itemId: id, status: nextStatus })).unwrap()));
        } catch (error) {
            console.error('Failed to sync item status:', error);
        }
    };

    useEffect(() => {
        if (status === 'idle') {
            dispatch(fetchTables());
        }
    }, [status, dispatch]);

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

    // Update current time every minute to refresh highlights
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const handleTableClick = (table) => {
        const order = activeOrders[table.id.toString()];
        if (order) {
            setSelectedTable(table);
        }
    };


    // Calculate status counts
    const statusCounts = React.useMemo(() => {
        const counts = { active: 0, alert: 0, warning: 0, critical: 0, served: 0, total: 0 };

        Object.values(activeOrders).forEach(order => {
            if (!order || !order.items) return;
            order.items.forEach(item => {
                if (item.type !== 'food') return; // Only count food items
                counts.total++;
                if (item.status === 'ready' || item.status === 'served') {
                    counts.served++;
                } else {
                    const diffMinutes = Math.max(1, Math.floor((currentTime - item.orderTime) / 60000));
                    if (diffMinutes >= 20) counts.critical++;
                    else if (diffMinutes >= 10) counts.warning++;
                    else if (diffMinutes >= 5) counts.alert++;
                    else counts.active++;
                }
            });
        });

        return counts;
    }, [activeOrders, currentTime]);

    if (status === 'loading') {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    return (
        <div className="md-management-page pb-20 bg-gray-50">
            <div className="bg-white py-3 border-t border-b border-gray-200">
                <div className="flex items-center gap-2 w-full max-w-[1200px] mx-auto px-[20px] justify-between overflow-x-auto no-scrollbar">
                    <div className="flex items-center gap-4">
                        <p className="item-info flex items-center gap-1 m-0 text-sm text-gray-500 font-bold">
                            <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                            <span>1-5p: <span className="text-gray-900">{statusCounts.active}</span></span>
                        </p>
                        <p className="item-info flex items-center gap-1 m-0 text-sm text-blue-500 font-bold">
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            <span>5-10p: <span className="text-gray-900">{statusCounts.alert}</span></span>
                        </p>
                        <p className="item-info flex items-center gap-1 m-0 text-sm text-yellow-500 font-bold">
                            <span className="w-2 h-2 mdt-bg-yellow rounded-full"></span>
                            <span>10-20p: <span className="text-gray-900">{statusCounts.warning}</span></span>
                        </p>
                        <p className="item-info flex items-center gap-1 m-0 text-sm text-red-500 font-bold">
                            <span className="w-2 h-2 mdt-bg-red rounded-full"></span>
                            <span>&ge; 20p: <span className="text-gray-900">{statusCounts.critical}</span></span>
                        </p>
                    </div>
                </div>
            </div>
            <div className="md-management-page__content py-4 md:py-8">
                <div className="w-full max-w-[1240px] mx-auto px-[20px]">
                    <div className="grid grid-cols-12 gap-6 md:gap-4">
                        {/* Left: Table List */}
                        <div className="col-span-12 md:col-span-8 lg:col-span-9 bg-gray-50/50 rounded-3xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
                            {error && (
                                <div className="w-full bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    {error}
                                </div>
                            )}

                            <ActiveOrderTableList
                                tables={activeTablesToDisplay}
                                orders={activeOrders}
                                currentTime={currentTime}
                                onTableClick={handleTableClick}
                                filterType="food"
                            />
                        </div>

                        {/* Right: Delay Warnings Sidebar */}
                        <div className="col-span-12 md:col-span-4 lg:col-span-3">
                            <DelayWarnings
                                tables={tables}
                                orders={activeOrders}
                                currentTime={currentTime}
                                title='Danh sách món'
                                filterType="food"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Detail Popup Modal */}
            {selectedTable && (
                <TableDetailModal
                    tableId={selectedTable.id}
                    tableIndex={tables.findIndex(t => t.id === selectedTable.id)}
                    mergedTables={activeOrders[selectedTable.id.toString()]?.mergedTables}
                    orderItems={activeOrders[selectedTable.id.toString()]?.items.filter(item => item.type === 'food') || []}
                    currentTime={currentTime}
                    onClose={() => setSelectedTable(null)}
                    onToggleStatus={handleToggleItemStatus}
                />
            )}
        </div>
    );
};

export default Bills;
