import { safeParseDate } from './dateUtils';

/**
 * Consolidates active tables and orders into logical groups (merged tables or group reservations).
 * @param {Array} tables - List of all tables with their active orders
 * @param {Object} tableIdToGroupKey - Mapping of table IDs to their merge group keys
 * @param {Object} options - { filterType, groupByCompositeKey, splitByFlow }
 * @returns {Object} { orders, orderDict, activeTablesToDisplay }
 */
export const consolidateOrders = (tables, tableIdToGroupKey, { filterType = null, groupByCompositeKey = false } = {}) => {
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
    // 1. First Pass: Create group objects for any table that HAS an active order.
    tables.forEach(t => {
        const rawPlural = t.active_orders || t.activeOrders;
        const rawSingular = t.active_order || t.activeOrder;
        const ordersToProcess = rawPlural || (rawSingular ? [rawSingular] : []);

        ordersToProcess.forEach(order => {
            if (!order || !order.items) return;

            const groupKey = tableIdToGroupKey[t.id.toString()] || t.id.toString();

            if (!consolidatedGroups[groupKey]) {
                const reservation = order.reservation;
                const groupName = reservation ? (reservation.company_name || reservation.lead_name) : null;
                const isTableInGroupRes = groupReservedTableIds.has(Number(t.id));

                consolidatedGroups[groupKey] = {
                    id: order.id,
                    tableId: t.id,
                    tableName: t.name || `Bàn ${t.id}`,
                    groupName: groupName,
                    isGroup: !!reservation || isTableInGroupRes,
                    mergedTables: (groupKey.split('-').filter(p => p && !isNaN(parseInt(p))).length > 1) ? groupKey : null,
                    tableNames: [], // [FIX] Will be populated in second pass
                    startTime: safeParseDate(order.created_at || order.updated_at),
                    orderNote: order.order_note || '',
                    guestCount: order.guest_count || 1,
                    items: [],
                    itemsMap: {},
                    orders: [], // [NEW] Track individual orders for split payment support
                    reservation: order.reservation,
                    groupKey: groupKey
                };
            }

            const group = consolidatedGroups[groupKey];
            if (order.reservation_id && !group.reservation_id) {
                group.reservation_id = order.reservation_id;
                group.isGroup = true;
                if (!group.reservation) group.reservation = order.reservation;
            }

            if (handledOrderIds.has(order.id)) return;
            handledOrderIds.add(order.id);
            group.orders.push(order); // [NEW] Keep reference to the source order

            const orderTime = safeParseDate(order.created_at || order.updated_at);
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
                    orderTime: safeParseDate(item.created_at),
                    product: item.product,
                    product_id: item.product_id,
                    type: productType || filterType,
                    note: item.note || '',
                    tableId: item.table_id || t.id,
                    order_id: item.order_id, // [NEW] Keep track of which order this item belongs to
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

    // 2. Second Pass: Associate ALL tables (including those without orders) with their respective groups.
    tables.forEach(t => {
        const groupKey = tableIdToGroupKey[t.id.toString()] || t.id.toString();
        const group = consolidatedGroups[groupKey];

        if (group) {
            // [WHY] Add table name if not already present. This ensures follower tables in a group 
            // reservation are listed in the 'tableName' string (e.g. Bàn 1-2-3).
            if (!group.tableNames.includes(t.name || t.id.toString())) {
                group.tableNames.push(t.name || t.id.toString());
            }
            // [WHY] Map this table to its group in the quick-lookup dictionary.
            if (!orderDict[t.id.toString()]) {
                orderDict[t.id.toString()] = group;
            }
        }
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
                .map(name => (name || '').toString().replace(/^Bàn\s+/i, ''))
                .filter(Boolean)
                .sort((a, b) => {
                    const numA = parseInt(a);
                    const numB = parseInt(b);
                    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
                    return a.localeCompare(b);
                })
                .join('-');

            if (group.isGroup || (tablesString && tablesString.includes('-'))) {
                group.tableName = `Bàn ${tablesString || group.tableId}`;
            } else {
                group.tableName = group.tableName || `Bàn ${group.tableId}`;
            }

            group.relatedOrderIds = group.orders.map(o => o.id);

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
