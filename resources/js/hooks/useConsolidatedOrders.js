import { useMemo, useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { fetchTables } from '../store/slices/tableSlice';
import { selectTables, selectTableIdToGroupKey } from '../store/selectors/tableSelectors';

/**
 * useConsolidatedOrders: Groups tables by their merged_tables string and 
 * consolidates order items. Now handles data fetching and real-time Echo subscriptions.
 * @param {string} filterType - 'food' | 'drink' | null
 */
export const useConsolidatedOrders = (filterType = null, groupByCompositeKey = false) => {
    const dispatch = useAppDispatch();
    const tables = useAppSelector(selectTables);
    const tableIdToGroupKey = useAppSelector(selectTableIdToGroupKey);
    const { status: tableStatus, error } = useAppSelector(state => state.table);
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
            // [WHY] [CHANGE] Handle multiple active orders per table (e.g. 1 Group order + 1 Extra order)
            // [RULE] Independent flows: Distinct database records ensure distinct UI cards
            const ordersToProcess = t.active_orders?.length > 0 
                ? t.active_orders 
                : (t.active_order ? [t.active_order] : []);

            ordersToProcess.forEach(activeOrder => {
                if (activeOrder && activeOrder.items) {
                    if (handledOrderIds.has(activeOrder.id)) return;
                    handledOrderIds.add(activeOrder.id);

                    const groupKey = tableIdToGroupKey[t.id.toString()] || t.id.toString();

                    if (!consolidatedGroups[groupKey]) {
                        const reservation = activeOrder.reservation;
                        const groupName = reservation ? (reservation.company_name || reservation.lead_name) : null;

                        consolidatedGroups[groupKey] = {
                            id: activeOrder.id,
                            tableId: t.id,
                            tableName: t.name || `Bàn ${t.id}`,
                            groupName: groupName,
                            isGroup: !!reservation,
                            mergedTables: groupKey.includes('-') ? groupKey : null,
                            tableNames: [t.name || t.id.toString()],
                            startTime: new Date(activeOrder.created_at || activeOrder.updated_at),
                            items: [],
                            itemsMap: {},
                            reservation: activeOrder.reservation
                        };
                    } else if (!consolidatedGroups[groupKey].tableNames.includes(t.name || t.id.toString())) {
                        consolidatedGroups[groupKey].tableNames.push(t.name || t.id.toString());

                        if (activeOrder.merged_tables === groupKey) {
                            const reservation = activeOrder.reservation;
                            consolidatedGroups[groupKey].id = activeOrder.id;
                            consolidatedGroups[groupKey].startTime = new Date(activeOrder.created_at || activeOrder.updated_at);
                            consolidatedGroups[groupKey].tableId = t.id;
                            consolidatedGroups[groupKey].tableName = t.name || `Bàn ${t.id}`;
                            if (reservation) {
                                consolidatedGroups[groupKey].groupName = reservation.company_name || reservation.lead_name;
                                consolidatedGroups[groupKey].isGroup = true;
                                consolidatedGroups[groupKey].reservation_id = reservation.id;
                                consolidatedGroups[groupKey].reservation = reservation;
                            }
                        }
                    }

                    const group = consolidatedGroups[groupKey];

                    // Ensure reservation_id and reservation are set if available
                    if (activeOrder.reservation_id && !group.reservation_id) {
                        group.reservation_id = activeOrder.reservation_id;
                        group.isGroup = true;
                        if (!group.reservation) group.reservation = activeOrder.reservation;
                    }

                    activeOrder.items.forEach(item => {
                        const productType = item.product?.type || item.type;
                        if (filterType && productType !== filterType) return;

                        const itemData = {
                            id: item.id,
                            allIds: [item.id],
                            name: item.product?.name || item.name || 'Unknown',
                            quantity: item.quantity,
                            price: item.price || item.product?.price || 0,
                            status: item.status || 'pending',
                            done: item.status === 'ready' || item.status === 'served',
                            orderTime: new Date(item.created_at),
                            product: item.product,
                            product_id: item.product_id,
                            type: productType || filterType,
                            note: item.note || '',
                            tableId: item.table_id, // Preserve the original table ID
                            reservation_item_id: item.reservation_item_id // Preserved for UI split logic
                        };

                        if (groupByCompositeKey) {
                            // [WHY] include name in key if product_id is null to avoid merging different custom dishes
                            const idKey = item.product_id || itemData.name;
                            const compositeKey = `${idKey}-${itemData.note}-${item.status}`;
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

                    const orderTime = new Date(activeOrder.created_at || activeOrder.updated_at);
                    if (orderTime < group.startTime) {
                        group.startTime = orderTime;
                    }
                }
            });
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

                // [WHY] Format group table name (e.g. ACB - Tables 2-3-4)
                if (group.isGroup) {
                    const tablesString = group.tableNames
                        .map(name => (name || '').toString().replace(/[^0-9]/g, ''))
                        .sort((a, b) => parseInt(a) - parseInt(b))
                        .join('-');
                    group.tableName = `${group.groupName} - Bàn ${tablesString}`;
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
            status: tableStatus,
            error
        };
    }, [tables, tableIdToGroupKey, filterType, groupByCompositeKey, currentTime, tableStatus, error]);
};
