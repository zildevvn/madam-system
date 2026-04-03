import { useMemo, useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { fetchTables, selectTables, selectTableIdToGroupKey } from '../store/slices/tableSlice';
import { selectTables as selectTablesFromSelector, selectTableIdToGroupKey as selectTableIdToGroupKeyFromSelector } from '../store/selectors/tableSelectors';

/**
 * useConsolidatedOrders: Groups tables by their merged_tables string and 
 * consolidates order items. Now handles data fetching and real-time Echo subscriptions.
 * @param {string} filterType - 'food' | 'drink' | null
 */
export const useConsolidatedOrders = (filterType = null, groupByCompositeKey = false) => {
    const dispatch = useAppDispatch();
    const tables = useAppSelector(selectTablesFromSelector);
    const tableIdToGroupKey = useAppSelector(selectTableIdToGroupKeyFromSelector);
    const { status: tableStatus } = useAppSelector(state => state.table);
    const [currentTime, setCurrentTime] = useState(new Date());

    // 1. Fetch tables on mount if idle
    useEffect(() => {
        if (tableStatus === 'idle') {
            dispatch(fetchTables());
        }
    }, [tableStatus, dispatch]);

    // 2. Real-time subscriptions
    useEffect(() => {
        if (window.Echo) {
            const channel = window.Echo.channel('orders');
            const handleUpdate = () => dispatch(fetchTables());

            channel.listen('.order_created', handleUpdate)
                .listen('.order_updated', handleUpdate)
                .listen('.item_status_updated', handleUpdate);

            return () => window.Echo.leaveChannel('orders');
        }
    }, [dispatch]);

    // 3. 10-second timer for elapsed time calculations
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 10000);
        return () => clearInterval(timer);
    }, []);

    return useMemo(() => {
        const consolidatedGroups = {};
        const handledOrderIds = new Set();
        const orderDict = {};

        // 1. Consolidate into groups
        tables.forEach(t => {
            if (t.active_order && t.active_order.items) {
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
                        items: [],
                        itemsMap: {}
                    };
                }

                const group = consolidatedGroups[groupKey];

                t.active_order.items.forEach(item => {
                    const productType = item.product?.type || item.type;
                    if (filterType && productType !== filterType) return;

                    const itemData = {
                        id: item.id,
                        allIds: [item.id],
                        name: item.product?.name || 'Unknown',
                        quantity: item.quantity,
                        status: item.status || 'pending',
                        orderTime: new Date(item.created_at),
                        product: item.product,
                        type: productType || filterType,
                        note: item.note || ''
                    };

                    if (groupByCompositeKey) {
                        const compositeKey = `${item.product_id}-${itemData.note}`;
                        if (group.itemsMap[compositeKey]) {
                            group.itemsMap[compositeKey].quantity += itemData.quantity;
                            group.itemsMap[compositeKey].allIds.push(item.id);
                            if (itemData.orderTime < group.itemsMap[compositeKey].orderTime) {
                                group.itemsMap[compositeKey].orderTime = itemData.orderTime;
                            }
                        } else {
                            group.itemsMap[compositeKey] = itemData;
                        }
                    } else {
                        group.items.push(itemData);
                    }
                });

                const orderTime = new Date(t.active_order.created_at || t.active_order.updated_at);
                if (orderTime < group.startTime) {
                    group.startTime = orderTime;
                }
            }
        });

        // 2. Finalize groups and build dictionary
        const displayedGroups = new Set();
        const activeTablesToDisplay = tables.filter(t => {
            if (!t.active_order) return false;
            const groupKey = tableIdToGroupKey[t.id.toString()] || t.id.toString();

            const group = consolidatedGroups[groupKey];
            if (group) {
                if (groupByCompositeKey && group.itemsMap) {
                    group.items = Object.values(group.itemsMap);
                }
                group.served = group.items.length > 0 && group.items.every(i => i.status === 'served');
                orderDict[t.id.toString()] = group;
            }

            if (displayedGroups.has(groupKey)) return false;
            displayedGroups.add(groupKey);
            return true;
        });

        const orders = Object.values(consolidatedGroups).filter(o => o.items.length > 0);

        return {
            orders,
            orderDict,
            activeTablesToDisplay,
            allTables: tables,
            tableIdToGroupKey,
            currentTime,
            status: tableStatus
        };
    }, [tables, tableIdToGroupKey, filterType, groupByCompositeKey, currentTime, tableStatus]);
};
