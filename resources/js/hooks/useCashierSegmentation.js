import { useMemo } from 'react';

/**
 * [WHY] Extracts the complex business logic for segmenting orders into 
 * Group Reservations and Individual Table channels for the Cashier dashboard.
 * [RULE] Tách UI và logic (custom hook) - README.md Rule 11.
 */
export const useCashierSegmentation = (orders, allTables) => {
    return useMemo(() => {
        // [WHY] Normalize is_printed and isGroup status upfront to prevent type/logic mismatch bugs
        const normalizedOrders = orders.map(order => {
            const subOrders = (order.orders || []).map(o => ({
                ...o,
                is_printed: Boolean(Number(o.is_printed))
            }));
            
            return {
                ...order,
                is_printed: Boolean(Number(order.is_printed)),
                orders: subOrders,
                isGroup: !!(order.reservation && order.reservation.type === 'group')
            };
        });

        const groupOrders = {};
        const individualOrders = {};
        const individualTablesList = [];

        const groupLinkedTableIds = new Set();
        const tableIdToGroupKey = {};
        const nonGroupOrdersList = [];

        // [PASS 1] Partition group vs non-group orders and build table linkages
        normalizedOrders.forEach(order => {
            const lookupKey = order.id.toString();

            if (order.isGroup) {
                groupOrders[lookupKey] = {
                    ...order,
                    items: [...(order.items || [])],
                    relatedOrderIds: [order.id]
                };

                const resId = order.reservation?.id;
                if (resId) {
                    if (order.reservation?.table_ids) {
                        order.reservation.table_ids.forEach(id => {
                            const tid = Number(id);
                            groupLinkedTableIds.add(tid);
                            tableIdToGroupKey[tid] = lookupKey;
                        });
                    }
                    if (order.tableId) {
                        const tid = Number(order.tableId);
                        groupLinkedTableIds.add(tid);
                        tableIdToGroupKey[tid] = lookupKey;
                    }
                }
            } else {
                nonGroupOrdersList.push(order);
            }
        });

        // [PASS 2] Route each non-group order:
        // - Group-linked tables → Should be already segmented by consolidateOrders (via splitByFlow)
        // - Standalone tables → add to individualOrders lane
        nonGroupOrdersList.forEach(order => {
            const lookupKey = order.id.toString();
            const tid = Number(order.tableId);
            const isGroupLinked = groupLinkedTableIds.has(tid);
            const parentGroupKey = tableIdToGroupKey[tid];

            if (isGroupLinked && parentGroupKey && groupOrders[parentGroupKey]) {
                // [MERGE] Fold these items into the master group order for unified billing
                const parentGroup = groupOrders[parentGroupKey];
                parentGroup.relatedOrderIds.push(order.id);
                if (order.items && order.items.length > 0) {
                    parentGroup.items.push(...order.items);
                }
                parentGroup.is_printed = parentGroup.is_printed || order.is_printed;
                parentGroup.print_count = Math.max(parentGroup.print_count || 0, Number(order.print_count || 0));
                const printedAts = [parentGroup.printed_at, parentGroup.printedAt, order.printed_at, order.printedAt].filter(Boolean);
                parentGroup.printed_at = printedAts.sort().reverse()[0] || null;
                parentGroup.printedAt = parentGroup.printed_at;
                // Return early so this order doesn't show up in Individual Lane
                return;
            }

            // [STANDALONE] Not linked to any group
            // If this table has multiple active orders, we must distinguish between:
            // 1. Merged Tables: Multiple orders from DIFFERENT tables (keep as ONE card)
            // 2. Split Bills: Multiple orders from the SAME table (un-merge into MULTIPLE cards)
            let splitOrders = [];
            let mainOrders = [];

            if (order.orders && order.orders.length > 1) {
                const sortedOrders = [...order.orders].sort((a, b) => a.id - b.id);
                const seenTableIds = new Set();
                sortedOrders.forEach(subOrder => {
                    // The first order we see for any given table is a "main" order.
                    // Any subsequent order for the SAME table is a "split" bill.
                    if (!seenTableIds.has(subOrder.table_id)) {
                        seenTableIds.add(subOrder.table_id);
                        mainOrders.push(subOrder);
                    } else {
                        splitOrders.push(subOrder);
                    }
                });
            } else {
                mainOrders = order.orders || [];
            }

            if (splitOrders.length > 0) {
                // There are split bills! We must un-merge them.

                // Card 1: Main Orders Combined (Original table + any merged tables)
                const mainLookupKey = lookupKey;
                const mainOrderIds = mainOrders.map(o => o.id);
                const mainReconstructed = {
                    ...order,
                    id: mainOrders[0].id,
                    orders: mainOrders,
                    relatedOrderIds: mainOrderIds, // [FIX] Isolate to main orders only
                    items: order.items.filter(i => mainOrderIds.includes(i.order_id)),
                    is_printed: mainOrders.some(o => o.is_printed),
                    print_count: Math.max(0, ...mainOrders.map(o => Number(o.print_count || 0))),
                    printed_at: mainOrders.map(o => o.printed_at || o.printedAt).filter(Boolean).sort().reverse()[0] || null,
                    printedAt: mainOrders.map(o => o.printed_at || o.printedAt).filter(Boolean).sort().reverse()[0] || null,
                    hasUnpaidSplits: true
                };

                individualOrders[mainLookupKey] = mainReconstructed;
                individualTablesList.push({
                    id: mainLookupKey,
                    name: order.tableName || `Bàn ${order.tableId}`,
                    merged_tables: order.mergedTables,
                    groupKey: mainLookupKey,
                    isGroupLinked: false,
                    groupColorIndex: 0
                });

                // Card 2+: Split Orders
                splitOrders.forEach((subOrder, index) => {
                    const subLookupKey = subOrder.id.toString();
                    const subOrderIds = [subOrder.id];
                    const subReconstructed = {
                        ...order,
                        id: subOrder.id,
                        orders: [subOrder],
                        relatedOrderIds: subOrderIds, // [FIX] Isolate to this split order only
                        items: order.items.filter(i => i.order_id === subOrder.id),
                        is_printed: subOrder.is_printed,
                        print_count: Number(subOrder.print_count || 0),
                        printed_at: subOrder.printed_at || subOrder.printedAt || null,
                        printedAt: subOrder.printed_at || subOrder.printedAt || null,
                        hasUnpaidSplits: true
                    };

                    individualOrders[subLookupKey] = subReconstructed;

                    const baseName = order.tableName || `Bàn ${order.tableId}`;
                    const tableName = `${baseName} (Tách ${index + 1})`;

                    individualTablesList.push({
                        id: subLookupKey,
                        name: tableName,
                        merged_tables: order.mergedTables,
                        groupKey: subLookupKey,
                        isGroupLinked: false,
                        groupColorIndex: 0,
                        isSplit: true
                    });
                });
            } else {
                // [STANDALONE] Single order OR Merged tables with NO split bills.
                // Keep them consolidated into a single card.
                individualOrders[lookupKey] = order;

                const groupColorIndex = 0;
                if (order.mergedTables) {
                    individualTablesList.push({
                        id: lookupKey,
                        name: order.tableName,
                        merged_tables: order.mergedTables,
                        groupKey: lookupKey,
                        isGroupLinked: false,
                        groupColorIndex
                    });
                } else {
                    const tableObj = allTables.find(tbl => tbl.id === order.tableId);
                    if (tableObj) {
                        individualTablesList.push({
                            ...tableObj,
                            name: order.tableName || tableObj.name,
                            id: lookupKey,
                            originalTableId: tableObj.id,
                            groupKey: lookupKey,
                            isGroupLinked: false,
                            groupColorIndex
                        });
                    }
                }
            }
        });

        const groupTables = Object.values(groupOrders).map(order => ({
            id: order.id.toString(),
            name: order.tableName,
            isVirtual: false,
            reservation_id: order.reservation_id,
            groupKey: order.id.toString(),
            groupColorIndex: 0
        })).sort((a, b) => {
            const aNum = Number(a.id);
            const bNum = Number(b.id);
            if (!isNaN(aNum) && !isNaN(bNum)) {
                return aNum - bNum;
            }
            return String(a.id).localeCompare(String(b.id), undefined, { numeric: true });
        });

        // [OPT] Build an O(1) lookup dictionary for all tables to prevent linear scans
        const tableDict = {};
        individualTablesList.forEach(t => {
            tableDict[(t.groupKey || t.id).toString()] = t;
        });
        groupTables.forEach(t => {
            tableDict[(t.groupKey || t.id).toString()] = t;
        });

        return {
            groupOrders,
            individualOrders,
            individualTables: individualTablesList.sort((a, b) => {
                const aNum = Number(a.id);
                const bNum = Number(b.id);
                if (!isNaN(aNum) && !isNaN(bNum)) {
                    return aNum - bNum;
                }
                return String(a.id).localeCompare(String(b.id), undefined, { numeric: true });
            }),
            groupTables,
            tableDict
        };
    }, [orders, allTables]);
};
