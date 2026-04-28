import React from 'react';
import { safeParseDate } from './dateUtils';

// Constants for order status thresholds (in minutes)
const THRESHOLD_BAR_CRITICAL = 10;
const THRESHOLD_KITCHEN_CRITICAL = 20;
const THRESHOLD_KITCHEN_WARNING = 10;
const THRESHOLD_KITCHEN_ALERT = 5;

const ADDITIONAL_ITEM_THRESHOLD_MS = 30000;
const NEW_ORDER_PULSING_TIMEOUT_S = 300;

/**
 * Calculates the visual status of a table based on its order age and type.
 */
export const calculateTableStatus = (order, currentTimeTs, options = {}) => {
    const { isBar, showSimpleView, showNewOrderHighlight } = options;

    if (!order) return { statusClass: "", duration: "BÀN TRỐNG", isNewOrder: false };
    if (showSimpleView) return { statusClass: "is-busy", duration: "", isNewOrder: false };
    if (order.isServed) return { statusClass: "mdt-bg-green !text-white", duration: "HOÀN TẤT", isNewOrder: false };

    const diff = order.earliestActiveTimeTs
        ? Math.max(1, Math.floor((currentTimeTs - order.earliestActiveTimeTs) / 60000))
        : 0;

    let statusClass = "is-busy";
    if (isBar) {
        if (diff >= THRESHOLD_BAR_CRITICAL) statusClass = "mdt-bg-red !text-white";
    } else {
        if (diff >= THRESHOLD_KITCHEN_CRITICAL) statusClass = "mdt-bg-red !text-white";
        else if (diff >= THRESHOLD_KITCHEN_WARNING) statusClass = "mdt-bg-yellow mdt-text-primary";
        else if (diff >= THRESHOLD_KITCHEN_ALERT) statusClass = "mdt-bg-blue !text-white";
    }

    let isNewOrder = false;
    if (showNewOrderHighlight && order.hasAdditionalPendingItems) {
        isNewOrder = true;
        const latestDiffSeconds = (currentTimeTs - order.latestAdditionalPendingTimeTs) / 1000;
        if (latestDiffSeconds < NEW_ORDER_PULSING_TIMEOUT_S) {
            statusClass += " is-new-order";
        }
    }

    return { statusClass, duration: `${diff} PHÚT`, isNewOrder };
};

/**
 * Hook to pre-calculate and memoize filtered orders for a list of tables.
 */
export const useActiveTableOrders = (tables, orders, filterType) => {
    return React.useMemo(() => {
        if (!orders) return {};
        const map = {};
        tables.forEach(table => {
            const tableIdStr = table.id.toString();
            const order = orders[tableIdStr];

            if (!order) {
                map[tableIdStr] = null;
                return;
            }

            const items = order.items
                .filter(item => !filterType || (item.product?.type === filterType) || (item.type === filterType))
                .map(item => ({ ...item, orderTimeTs: safeParseDate(item.orderTime).getTime() }));

            if (items.length === 0) {
                map[tableIdStr] = null;
                return;
            }

            const startTimeTs = safeParseDate(order.startTime || order.created_at).getTime();
            const activeItems = items.filter(item => item.status !== 'ready' && item.status !== 'served');
            const additionalPendingItems = items.filter(item => {
                const isPending = !item.status || item.status === 'pending';
                return isPending && (item.orderTimeTs - startTimeTs > ADDITIONAL_ITEM_THRESHOLD_MS);
            });

            map[tableIdStr] = {
                ...order,
                items,
                isServed: items.every(item => item.status === 'ready' || item.status === 'served'),
                earliestActiveTimeTs: activeItems.length > 0 ? Math.min(...activeItems.map(i => i.orderTimeTs)) : null,
                latestAdditionalPendingTimeTs: additionalPendingItems.length > 0 ? Math.max(...additionalPendingItems.map(i => i.orderTimeTs)) : null,
                hasAdditionalPendingItems: additionalPendingItems.length > 0
            };
        });
        return map;
    }, [tables, orders, filterType]);
};
