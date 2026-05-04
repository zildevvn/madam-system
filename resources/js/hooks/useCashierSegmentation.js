import { useMemo } from 'react';

/**
 * [WHY] Extracts the complex business logic for segmenting orders into 
 * Group Reservations and Individual Table channels for the Cashier dashboard.
 * [RULE] Tách UI và logic (custom hook) - README.md Rule 11.
 */
export const useCashierSegmentation = (orders, allTables) => {
    return useMemo(() => {
        const groupOrders = {};
        const individualOrders = {};
        const individualTablesList = [];

        // [PASS 1] Identify group orders first
        orders.forEach(order => {
            const isGroup = order.reservation && order.reservation.type === 'group';
            const lookupKey = order.id.toString();
            if (isGroup) {
                groupOrders[lookupKey] = {
                    ...order,
                    items: [...(order.items || [])],
                    relatedOrderIds: [order.id]
                };
            }
        });

        // [PASS 2] Collect all table IDs that belong to any group reservation
        // and build a reverse map: tableId → groupOrder lookupKey
        const groupLinkedTableIds = new Set();
        const tableIdToGroupKey = {};
        Object.entries(groupOrders).forEach(([lookupKey, order]) => {
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
        });

        // [PASS 3] Route each non-group order:
        // - Group-linked tables → Should be already segmented by consolidateOrders (via splitByFlow)
        // - Standalone tables → add to individualOrders lane
        orders.forEach(order => {
            const isGroup = order.reservation && order.reservation.type === 'group';
            const lookupKey = order.id.toString();

            if (!isGroup) {
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
                    // Return early so this order doesn't show up in Individual Lane
                    return;
                }

                // [STANDALONE] Not linked to any group
                // If this table has multiple active orders (e.g. split bills), we MUST un-merge them
                // so the cashier can interact with them individually.
                if (order.orders && order.orders.length > 1) {
                    // Sort orders by ID so the original is first
                    const sortedOrders = [...order.orders].sort((a, b) => a.id - b.id);
                    
                    sortedOrders.forEach((subOrder, index) => {
                        const subLookupKey = subOrder.id.toString();
                        
                        // Reconstruct the order object for this specific sub-order
                        const reconstructedOrder = {
                            ...order,
                            id: subOrder.id,
                            orders: [subOrder],
                            items: order.items.filter(i => i.order_id === subOrder.id)
                        };
                        
                        individualOrders[subLookupKey] = reconstructedOrder;
                        
                        const groupColorIndex = 0;
                        const baseName = order.tableName || `Bàn ${order.tableId}`;
                        const tableName = index > 0 ? `${baseName} (Tách ${index})` : baseName;
                        
                        if (order.mergedTables) {
                            individualTablesList.push({
                                id: subLookupKey,
                                name: tableName,
                                merged_tables: order.mergedTables,
                                groupKey: subLookupKey,
                                isGroupLinked: false,
                                groupColorIndex
                            });
                        } else {
                            const tableObj = allTables.find(tbl => tbl.id === order.tableId);
                            if (tableObj) {
                                individualTablesList.push({
                                    ...tableObj,
                                    name: tableName,
                                    id: subLookupKey,
                                    originalTableId: tableObj.id,
                                    groupKey: subLookupKey,
                                    isGroupLinked: false,
                                    groupColorIndex
                                });
                            }
                        }
                    });
                } else {
                    // [STANDALONE] Single order for table
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
            }
        });

        const groupTables = Object.values(groupOrders).map(order => ({
            id: order.id.toString(),
            name: order.tableName,
            isVirtual: false,
            reservation_id: order.reservation_id,
            groupKey: order.id.toString(),
            groupColorIndex: 0
        }));

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
            individualTables: individualTablesList.sort((a, b) => b.id - a.id),
            groupTables,
            tableDict
        };
    }, [orders, allTables]);
};
