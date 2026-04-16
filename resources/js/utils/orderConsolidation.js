/**
 * Consolidates active tables and orders into logical groups (merged tables or group reservations).
 * @param {Array} tables - List of all tables with their active orders
 * @param {Object} tableIdToGroupKey - Mapping of table IDs to their merge group keys
 * @param {Object} options - { filterType, groupByCompositeKey, splitByFlow }
 * @returns {Object} { orders, orderDict, activeTablesToDisplay }
 */
export const consolidateOrders = (tables, tableIdToGroupKey, { filterType = null, groupByCompositeKey = false, splitByFlow = false } = {}) => {
    const consolidatedGroups = {};
    const handledOrderIds = new Set();
    const orderDict = {};

    // 0. [PRE-PASS] Identify all table IDs that are part of a Group Reservation
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
        const rawPlural = t.active_orders || t.activeOrders;
        const rawSingular = t.active_order || t.activeOrder;
        const ordersToProcess = rawPlural || (rawSingular ? [rawSingular] : []);

        ordersToProcess.forEach(order => {
            if (!order || !order.items) return;

            // [RULE] A table always follows its assigned group key from the store.
            let groupKeyBase = tableIdToGroupKey[t.id.toString()] || t.id.toString();

            // [WHY] Identify if this table belongs to a Group Reservation.
            // We use the pre-pass 'groupReservedTableIds' for this.
            const isTableInGroupRes = groupReservedTableIds.has(Number(t.id));

            let groupKey = groupKeyBase;
            if (splitByFlow) {
                // [WHY] Standard split: Groups vs Individuals.
                // However, for Group Reservations, everything MUST stay together.
                const reservation = order.reservation;
                if (reservation && reservation.type === 'group') {
                    groupKey = `${groupKeyBase}-group-${reservation.id}`;
                } else if (isTableInGroupRes) {
                    // [FIX] This is an individual extra on a reserved table.
                    // We FORCE it into the '-group-' key so it merges with the set menu / package.
                    // We find the reservation ID from the tables' existing group data.
                    const parentOrderWithRes = ordersToProcess.find(o => o.reservation?.type === 'group');
                    const resId = order.reservation_id || parentOrderWithRes?.reservation?.id;
                    if (resId) {
                        groupKey = `${groupKeyBase}-group-${resId}`;
                    } else {
                        groupKey = `${groupKeyBase}-indiv`;
                    }
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
                    isGroup: !!reservation || isTableInGroupRes,
                    mergedTables: (groupKey.split('-').filter(p => p && !isNaN(parseInt(p))).length > 1) ? groupKey : null,
                    tableNames: [t.name || t.id.toString()],
                    startTime: new Date(order.created_at || order.updated_at),
                    items: [],
                    itemsMap: {},
                    reservation: order.reservation,
                    groupKey: groupKey
                };
            } else if (!consolidatedGroups[groupKey].tableNames.includes(t.name || t.id.toString())) {
                consolidatedGroups[groupKey].tableNames.push(t.name || t.id.toString());
            }

            const existingMapping = orderDict[t.id.toString()];
            if (!existingMapping || (order.reservation && order.reservation.type === 'group')) {
                orderDict[t.id.toString()] = consolidatedGroups[groupKey];
            }

            const group = consolidatedGroups[groupKey];
            if (order.reservation_id && !group.reservation_id) {
                group.reservation_id = order.reservation_id;
                group.isGroup = true;
                if (!group.reservation) group.reservation = order.reservation;
            }

            if (handledOrderIds.has(order.id)) return;
            handledOrderIds.add(order.id);

            const orderTime = new Date(order.created_at || order.updated_at);
            if (orderTime < group.startTime) {
                group.startTime = orderTime;
            }

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
                    tableId: item.table_id || t.id,
                    reservation_item_id: item.reservation_item_id
                };

                if (groupByCompositeKey) {
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
        });
    });

    // 2. Finalize groups and build list for display
    const displayedGroups = new Set();
    
    // [WHY] Ensure all tables that are part of a group reservation point to the same group object.
    // This handles Case 3 (Hybrid) where followers might receive individual orders later.
    Object.values(consolidatedGroups).forEach(group => {
        if (group.reservation && group.reservation.table_ids) {
            group.reservation.table_ids.forEach(id => {
                if (!orderDict[id.toString()]) {
                    orderDict[id.toString()] = group;
                }
            });
        }
    });

    const activeTablesToDisplay = tables.filter(t => {
        const group = orderDict[t.id.toString()];
        if (!group) return false;

        const groupKey = group.groupKey;

        if (group) {
            if (groupByCompositeKey && group.itemsMap) {
                group.items = Object.values(group.itemsMap);
            }

            const tablesString = group.tableNames
                .map(name => (name || '').toString().replace(/[^0-9]/g, ''))
                .filter(Boolean)
                .sort((a, b) => parseInt(a) - parseInt(b))
                .join('-');

            if (group.isGroup || (tablesString && tablesString.includes('-'))) {
                group.tableName = `Bàn ${tablesString || group.tableId}`;
            } else {
                group.tableName = group.tableName || `Bàn ${group.tableId}`;
            }

            // [WHY] Group is considered served if all items are either 'ready' (cooked) or 'served' (at table).
            // This matches the logic in ActiveOrderTableList.jsx for showing "HOÀN TẤT".
            group.served = group.items.length > 0 && group.items.every(i => i.status === 'ready' || i.status === 'served');
        }

        if (displayedGroups.has(groupKey)) return false;
        displayedGroups.add(groupKey);
        return true;
    });

    const orders = Object.values(consolidatedGroups).filter(o => o.items.length > 0);

    return {
        orders,
        orderDict,
        activeTablesToDisplay
    };
};
