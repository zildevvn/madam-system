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
                    groupKey: groupKey,
                    is_printed: order.is_printed || order.is_printed === 1 || order.is_printed === '1',
                    print_count: Number(order.print_count || 0)
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
                const rawType = item.product?.type || item.type;
                const productType = (rawType || '').toString().toLowerCase().trim();
                const normalizedFilter = filterType ? filterType.toString().toLowerCase().trim() : null;

                if (normalizedFilter) {
                    if (productType !== normalizedFilter) {
                        return;
                    }
                }

                const itemData = {
                    id: item.id,
                    allIds: [item.id],
                    rawItems: [{ id: item.id, quantity: item.quantity }],
                    name: item.product?.name || item.name || 'Unknown',
                    name_vi: item.product?.name_vi || '',
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
                    order_id: item.order_id, 
                    reservation_item_id: item.reservation_item_id,
                    parent_order_id: order.parent_order_id || null,
                    isSplitItem: !!order.parent_order_id
                };

                if (groupByCompositeKey) {
                    const idKey = item.product_id || itemData.name;
                    // [FIX] Include order_id in the composite key to prevent merging items from separate orders 
                    // on the same table (split bills). This ensures useCashierSegmentation can correctly 
                    // redistribute items to their respective table cards.
                    const compositeKey = `${idKey}-${itemData.note}-${item.status}-${item.order_id}`;
                    if (group.itemsMap[compositeKey]) {
                        group.itemsMap[compositeKey].quantity += itemData.quantity;
                        group.itemsMap[compositeKey].allIds.push(item.id);
                        group.itemsMap[compositeKey].rawItems.push({ id: item.id, quantity: itemData.quantity });
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
            group.is_printed = group.orders.some(o => o.is_printed || o.is_printed === 1 || o.is_printed === '1');
            group.print_count = Math.max(0, ...group.orders.map(o => Number(o.print_count || 0)));
            const printedAts = group.orders.map(o => o.printed_at || o.printedAt).filter(Boolean);
            group.printed_at = printedAts.length > 0 ? printedAts.sort().reverse()[0] : null;
            group.printedAt = group.printed_at;

            // [WHY] Only use the real `server` relationship from the database.
            // [RULE] Never fall back to localStorage user — that identity belongs to the current
            // viewer (e.g. admin on the Bills page), NOT the staff who created/handled the order.
            const staffList = [...new Set(group.orders.map(o => o.server?.name).filter(Boolean))];
            group.staffName = staffList.length > 0 ? staffList.join(', ') : null;

            // [WHY] Group is considered served if all items are either 'ready' (cooked) or 'served' (at table).
            // This matches the logic in ActiveOrderTableList.jsx for showing "HOÀN TẤT".
            group.served = group.items.length > 0 && group.items.every(i => i.status === 'ready' || i.status === 'served');
        }

        if (displayedGroups.has(groupKey)) return false;

        // [RULE] If a filterType is active (Bar/Kitchen), hide tables that have 0 matching items
        if (filterType && group.items.length === 0) return false;

        displayedGroups.add(groupKey);
        return true;
    });

    const orders = Object.values(consolidatedGroups)
        .filter(o => o.items.length > 0 || (o.orders && o.orders.length > 0))
        .sort((a, b) => a.id - b.id);

    return {
        orders,
        orderDict,
        activeTablesToDisplay
    };
};
