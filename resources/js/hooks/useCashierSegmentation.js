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
                groupOrders[lookupKey] = order;
            }
        });

        // [CASE B] Collect all table IDs that belong to any group reservation
        const groupLinkedTableIds = new Set();
        const tableIdToResId = {}; // [NEW] Map table to its reservation for color matching
        Object.values(groupOrders).forEach(order => {
            const resId = order.reservation?.id;
            if (resId) {
                if (order.reservation?.table_ids) {
                    order.reservation.table_ids.forEach(id => {
                        const tid = Number(id);
                        groupLinkedTableIds.add(tid);
                        tableIdToResId[tid] = resId;
                    });
                }
                if (order.tableId) {
                    groupLinkedTableIds.add(Number(order.tableId));
                    tableIdToResId[Number(order.tableId)] = resId;
                }
            }
        });

        // [COLOR MAPPING] Assign a stable color index (1-6) to each reservation ID
        const getGroupColorIndex = (resId) => {
            if (!resId) return 0;
            return (Number(resId) % 15) + 1;
        };

        // [PASS 2] Build individual orders, marking those on group tables
        orders.forEach(order => {
            const isGroup = order.reservation && order.reservation.type === 'group';
            const lookupKey = order.id.toString();

            if (!isGroup) {
                individualOrders[lookupKey] = order;
                const tid = Number(order.tableId);
                const isGroupLinked = groupLinkedTableIds.has(tid);
                const resId = order.reservation_id || order.reservation?.id || tableIdToResId[tid];
                const groupColorIndex = isGroupLinked ? getGroupColorIndex(resId) : 0;

                if (order.mergedTables) {
                    individualTablesList.push({
                        id: lookupKey,
                        name: order.tableName,
                        merged_tables: order.mergedTables,
                        groupKey: lookupKey,
                        isGroupLinked,
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
                            isGroupLinked,
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
            groupColorIndex: getGroupColorIndex(order.reservation?.id)
        }));

        return {
            groupOrders,
            individualOrders,
            individualTables: individualTablesList.sort((a, b) => b.id - a.id),
            groupTables
        };
    }, [orders, allTables]);
};
