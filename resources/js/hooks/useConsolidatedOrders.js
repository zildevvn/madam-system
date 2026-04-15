import { useMemo, useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { fetchTables } from '../store/slices/tableSlice';
import { selectTables, selectTableIdToGroupKey } from '../store/selectors/tableSelectors';

/**
 * useConsolidatedOrders: Groups tables by their merged_tables string and 
 * consolidates order items. Now handles data fetching and real-time Echo subscriptions.
 * @param {string} filterType - 'food' | 'drink' | null
 * @param {boolean} groupByCompositeKey - whether to group same items together
 * @param {boolean} splitByFlow - if true, separates group reservations from individual extras (Cashier only)
 */
export const useConsolidatedOrders = (filterType = null, groupByCompositeKey = false, splitByFlow = false) => {
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

        // 0. [PRE-PASS] Identify all table IDs that are part of a Group Reservation
        // Useful for splitByFlow (Cashier) to separate extras per table.
        const groupReservedTableIds = new Set();
        tables.forEach(t => {
            const rawPlural = t.active_orders || t.activeOrders;
            const rawSingular = t.active_order || t.activeOrder;
            const orders = rawPlural || (rawSingular ? [rawSingular] : []);
            orders.forEach(o => {
                if (o && o.reservation && o.reservation.type === 'group') {
                    if (o.reservation.table_ids) {
                        o.reservation.table_ids.forEach(id => groupReservedTableIds.add(Number(id)));
                    }
                    groupReservedTableIds.add(Number(t.id));
                }
            });
        });

        // 1. Consolidate into groups
        tables.forEach(t => {
            // [FIX] Normalize casing: Backend might send activeOrders or active_orders / activeOrder or active_order
            const rawPlural = t.active_orders || t.activeOrders;
            const rawSingular = t.active_order || t.activeOrder;
            const ordersToProcess = rawPlural || (rawSingular ? [rawSingular] : []);

            ordersToProcess.forEach(order => {
                if (!order || !order.items) return;

                let groupKeyBase = tableIdToGroupKey[t.id.toString()] || t.id.toString();

                // [FORCE SEPARATION] If this table is part of a group reservation AND we are in Cashier mode (splitByFlow),
                // we force separating individual extras into one card per table (e.g. 7, 8, 9 separate).
                if (splitByFlow && groupReservedTableIds.has(Number(t.id))) {
                    const isGroupOrder = order.reservation && order.reservation.type === 'group';
                    if (!isGroupOrder) {
                        groupKeyBase = t.id.toString();
                    }
                }

                let groupKey = groupKeyBase;

                // [WHY] For Cashier, we must keep Group Reservations and Individual Extras as separate cards.
                // [RULE] If splitByFlow is true, we incorporate session metadata into the groupKey.
                if (splitByFlow) {
                    const reservation = order.reservation;
                    if (reservation && reservation.type === 'group') {
                        groupKey = `${groupKeyBase}-group-${reservation.id}`;
                    } else {
                        groupKey = `${groupKeyBase}-indiv`;
                    }
                }

                if (!consolidatedGroups[groupKey]) {
                    const reservation = order.reservation;
                    const groupName = reservation ? (reservation.company_name || reservation.lead_name) : null;

                    consolidatedGroups[groupKey] = {
                        id: order.id,
                        tableId: t.id,
                        tableName: t.name || `Bàn ${t.id}`,
                        groupName: groupName,
                        isGroup: !!reservation,
                        mergedTables: (groupKey.split('-').filter(p => p && !isNaN(parseInt(p))).length > 1) ? groupKey : null,
                        tableNames: [t.name || t.id.toString()],
                        startTime: new Date(order.created_at || order.updated_at),
                        items: [],
                        itemsMap: {},
                        reservation: order.reservation,
                        groupKey: groupKey // [NEW] Essential for sync between loops
                    };
                } else if (!consolidatedGroups[groupKey].tableNames.includes(t.name || t.id.toString())) {
                    consolidatedGroups[groupKey].tableNames.push(t.name || t.id.toString());
                }

                // [WHY] Register this table's primary active session.
                // [RULE] If multiple orders exist (Case B), we prefer mapping to the group reservation 
                // for global table context, but individual cards in Cashier have their own identity.
                const existingMapping = orderDict[t.id.toString()];
                if (!existingMapping || (order.reservation && order.reservation.type === 'group')) {
                    orderDict[t.id.toString()] = consolidatedGroups[groupKey];
                }

                // Ensure reservation_id and reservation are set if available
                const group = consolidatedGroups[groupKey];
                if (order.reservation_id && !group.reservation_id) {
                    group.reservation_id = order.reservation_id;
                    group.isGroup = true;
                    if (!group.reservation) group.reservation = order.reservation;
                }

                // 2. Only sum items if this specific order ID hasn't been handled yet
                if (handledOrderIds.has(order.id)) return;
                handledOrderIds.add(order.id);

                order.items.forEach(item => {
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

                const orderTime = new Date(order.created_at || order.updated_at);
                if (orderTime < group.startTime) {
                    group.startTime = orderTime;
                }
            });
        });

        // 2. Finalize groups and build dictionary
        const displayedGroups = new Set();
        const activeTablesToDisplay = tables.filter(t => {
            const group = orderDict[t.id.toString()];
            if (!group) return false;

            const groupKey = group.groupKey;

            if (group) {
                if (groupByCompositeKey && group.itemsMap) {
                    group.items = Object.values(group.itemsMap);
                }

                // [WHY] Format table name with range (e.g. Bàn 3-4 or Googlers - Bàn 3-4-5)
                const tablesString = group.tableNames
                    .map(name => (name || '').toString().replace(/[^0-9]/g, ''))
                    .filter(Boolean)
                    .sort((a, b) => parseInt(a) - parseInt(b))
                    .join('-');

                if (group.isGroup || (tablesString && tablesString.includes('-'))) {
                    // [CLEANUP] Remove groupName/Company from the dashboard card title as requested.
                    // Prioritize clean table range (e.g. Bàn 7-8-9).
                    group.tableName = `Bàn ${tablesString || group.tableId}`;
                } else {
                    group.tableName = group.tableName || `Bàn ${group.tableId}`;
                }

                group.served = group.items.length > 0 && group.items.every(i => i.status === 'served');
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
