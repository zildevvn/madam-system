import React from 'react';
import { safeParseDate } from '../utils/dateUtils';
import { 
    THRESHOLD_BAR_CRITICAL, 
    THRESHOLD_KITCHEN_CRITICAL, 
    THRESHOLD_KITCHEN_WARNING, 
    THRESHOLD_KITCHEN_ALERT 
} from '../constants/orderThresholds';

/**
 * Custom hook to process and bucketize delayed orders.
 * Separates business logic from UI as per README.md rules.
 */
export const useDelayWarningsData = (orders, tables, currentTime, filterType, isBar) => {
    return React.useMemo(() => {
        if (!orders || !currentTime) return { critical: [], warning: [], alert: [], active: [] };

        const currentTimeTs = safeParseDate(currentTime).getTime();
        const handledOrderIds = new Set();
        const result = {
            critical: {},
            warning: {},
            alert: {},
            active: {}
        };

        const getElapsedTime = (timeTs) => {
            return Math.max(1, Math.floor((currentTimeTs - timeTs) / 60000));
        };

        const processOrder = (tableId, order) => {
            if (!order || !order.id || handledOrderIds.has(order.id)) return;
            handledOrderIds.add(order.id);

            if (order.served && !filterType) return;

            const itemsToProcess = order.items.filter(item => {
                if (item.done || item.status === 'ready' || item.status === 'served') return false;
                if (!filterType) return true;
                const rawType = item.product?.type || item.type;
                const productType = (rawType || '').toString().toLowerCase().trim();
                const normalizedFilter = filterType.toString().toLowerCase().trim();
                return productType === normalizedFilter;
            });

            const orderStartTimeTs = safeParseDate(order.startTime || order.created_at).getTime();

            itemsToProcess.forEach((item) => {
                const orderTimeTs = safeParseDate(item.orderTime).getTime();
                const diff = getElapsedTime(orderTimeTs);
                let bucketKey = 'active';
                
                if (isBar) {
                    if (diff >= THRESHOLD_BAR_CRITICAL) bucketKey = 'critical';
                } else {
                    if (diff >= THRESHOLD_KITCHEN_CRITICAL) bucketKey = 'critical';
                    else if (diff >= THRESHOLD_KITCHEN_WARNING) bucketKey = 'warning';
                    else if (diff >= THRESHOLD_KITCHEN_ALERT) bucketKey = 'alert';
                }

                const bucket = result[bucketKey];
                const itemName = item.name;
                const tableObj = tables?.find(t => t.id.toString() === tableId.toString());
                const tableNumber = tableObj?.name || tableId;
                const tableName = order.tableName || order.mergedTables || tableNumber;
                const itemNote = item.note || order.orderNote;

                const tableInfo = { 
                    name: tableName, 
                    orderTimeTs, 
                    status: item.status, 
                    orderStartTimeTs,
                    tableId: tableId,
                    quantity: item.quantity,
                    note: item.note || '',
                    allIds: [...(item.allIds || [item.id])],
                    id: item.id
                };

                if (!bucket[itemName]) {
                    bucket[itemName] = {
                        name: itemName,
                        totalQuantity: item.quantity,
                        tables: [tableInfo],
                        maxDiff: diff,
                        itemIds: [...(item.allIds || [item.id])],
                        orderId: order.id,
                        tableNotes: itemNote ? [{ tableName, note: itemNote }] : []
                    };
                } else {
                    bucket[itemName].totalQuantity += item.quantity;
                    if (itemNote) {
                        bucket[itemName].tableNotes.push({ tableName, note: itemNote });
                    }
                    const existingTable = bucket[itemName].tables.find(t => t.name === tableName && t.note === (item.note || '') && t.status === item.status);
                    if (!existingTable) {
                        bucket[itemName].tables.push(tableInfo);
                    } else {
                        if (orderTimeTs < existingTable.orderTimeTs) {
                            existingTable.orderTimeTs = orderTimeTs;
                        }
                        existingTable.quantity += item.quantity;
                        existingTable.allIds = [...existingTable.allIds, ...(item.allIds || [item.id])];
                    }
                    bucket[itemName].maxDiff = Math.max(bucket[itemName].maxDiff, diff);
                    bucket[itemName].itemIds.push(item.id);
                }
            });
        };

        if (Array.isArray(orders)) {
            orders.forEach(order => processOrder(order.tableId, order));
        } else {
            Object.entries(orders).forEach(([tableId, order]) => processOrder(tableId, order));
        }

        const formatBucket = (bucketObj) => Object.values(bucketObj).sort((a, b) => b.maxDiff - a.maxDiff);

        return {
            critical: formatBucket(result.critical),
            warning: formatBucket(result.warning),
            alert: formatBucket(result.alert),
            active: formatBucket(result.active)
        };
    }, [tables, orders, currentTime, filterType, isBar]);
};
