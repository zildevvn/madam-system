import { useMemo } from 'react';
import { cleanMergedString, generateTableRange } from '../shared/utils/normalizeTableStrings';

/**
 * useCashierHistory
 * [WHY] Extracts complex grouping/consolidation logic for historical bills.
 * [RULE] Tách logic và UI — README.md Component Rule. Keeps Cashier.jsx clean.
 * @param {Array} historyOrders - Raw orders from API
 * @returns {Array} Consolidated and sorted history bills
 */
export const useCashierHistory = (historyOrders = []) => {
    return useMemo(() => {
        const groups = {};
        const signalToGroupId = {};
        const handledItemIds = new Set(); // [WHY] Prevent processing the same item twice

        // [WHY] Step 1: Normalize order items and basic metadata
        const normalizedHistory = historyOrders.map(order => ({
            ...order,
            mergedTables: order.merged_tables,
            isGroup: !!order.reservation_id,
            items: (order.items || []).map(i => ({
                ...i,
                name: i.product?.name || i.name || 'Unknown',
                tableId: i.table_id || order.table_id // [WHY] Use order.table_id as fallback
            }))
        }));

        // [WHY] Step 2: Build linkage signals (ReservationID, Time, Merged Tables)
        // [RULE] If orders share ANY of these markers, they are part of one group bill.
        normalizedHistory.forEach(order => {
            // [WHY] Round time to nearest 2 seconds to handle minor drift in DB timestamps
            const roundedTime = Math.floor(new Date(order.updated_at).getTime() / 2000) * 2000;
            const timeKey = roundedTime.toString();
            const cleanedMerged = cleanMergedString(order.merged_tables);
            
            const signals = [
                order.reservation_id ? `res-${order.reservation_id}` : null,
                cleanedMerged ? `merged-${cleanedMerged}-${timeKey}` : null, // [WHY] Scoped by time to avoid cross-day grouping
                `tx-${timeKey}-${order.payment_method}`
            ].filter(Boolean);

            let existingGroupId = null;
            for (const s of signals) {
                if (signalToGroupId[s]) {
                    existingGroupId = signalToGroupId[s];
                    break;
                }
            }

            const groupId = existingGroupId || signals[0];
            signals.forEach(s => signalToGroupId[s] = groupId);
        });

        // [WHY] Step 3: Group orders and accumulate totals
        normalizedHistory.forEach(order => {
            const roundedTime = Math.floor(new Date(order.updated_at).getTime() / 2000) * 2000;
            const timeKey = roundedTime.toString();
            const signalKey = order.reservation_id ? `res-${order.reservation_id}` : `tx-${timeKey}-${order.payment_method}`;
            const groupKey = signalToGroupId[signalKey];

            if (!groups[groupKey]) {
                groups[groupKey] = {
                    ...order,
                    merged_tables: cleanMergedString(order.merged_tables),
                    mergedTables: cleanMergedString(order.merged_tables),
                    itemsMap: {}, // [WHY] Use map to group items by product + note
                    total_price: Number(order.total_price),
                    discount_amount: Number(order.discount_amount),
                    allTableIds: new Set()
                };

                // [WHY] Initialize itemsMap with the first order's items
                (order.items || []).forEach(item => {
                    const itemId = item.id || item.order_item_id;
                    if (itemId && handledItemIds.has(itemId)) return;
                    if (itemId) handledItemIds.add(itemId);

                    const tid = item.tableId || order.table_id;
                    const key = `${item.product_id || item.name}-${item.note || ''}`; // [WHY] No tid in key to merge across tables
                    groups[groupKey].itemsMap[key] = { ...item, tableId: tid };
                });
                
                // Track all table IDs involved
                const cm = cleanMergedString(order.merged_tables);
                if (cm) cm.split('-').forEach(id => groups[groupKey].allTableIds.add(parseInt(id)));
                else if (order.table_id) groups[groupKey].allTableIds.add(parseInt(order.table_id));
                
                if (order.reservation?.table_ids) {
                    order.reservation.table_ids.forEach(id => groups[groupKey].allTableIds.add(parseInt(id)));
                }
            } else {
                const g = groups[groupKey];
                g.total_price += Number(order.total_price);
                g.discount_amount += Number(order.discount_amount);
                
                // [WHY] Merge items into the existing itemsMap
                (order.items || []).forEach(item => {
                    const itemId = item.id || item.order_item_id;
                    if (itemId && handledItemIds.has(itemId)) return;
                    if (itemId) handledItemIds.add(itemId);

                    const tid = item.tableId || order.table_id;
                    const key = `${item.product_id || item.name}-${item.note || ''}`; // [WHY] No tid in key to merge across tables
                    if (g.itemsMap[key]) {
                        g.itemsMap[key].quantity += item.quantity;
                    } else {
                        g.itemsMap[key] = { ...item, tableId: tid };
                    }
                });
                
                // Inherit cashier note
                if (order.cashier_note && !g.cashier_note) {
                    g.cashier_note = order.cashier_note;
                }
                
                // [WHY] Inherit reservation metadata if found in any related order
                if (order.reservation && !g.reservation) {
                    g.reservation = order.reservation;
                    g.reservation_id = order.reservation_id;
                    g.isGroup = true;
                }
                
                const cm = cleanMergedString(order.merged_tables);
                if (cm) cm.split('-').forEach(id => g.allTableIds.add(parseInt(id)));
                else if (order.table_id) g.allTableIds.add(parseInt(order.table_id));
                
                if (order.reservation?.table_ids) {
                    order.reservation.table_ids.forEach(id => g.allTableIds.add(parseInt(id)));
                }

                if (new Date(order.updated_at) > new Date(g.updated_at)) {
                    g.updated_at = order.updated_at;
                }
            }
        });

        // [WHY] Step 4: Final formatting (Ranges and Sorting)
        return Object.values(groups).map(g => {
            // [WHY] Convert itemsMap back to array for UI consumption
            g.items = Object.values(g.itemsMap);
            
            // [WHY] Ensure each item has a tableId for the PaymentItemEditor's grouping logic
            // If the item doesn't have one, fallback to the group's primary table_id.
            g.items.forEach(item => {
                if (!item.tableId) item.tableId = g.table_id;
            });

            if (g.allTableIds.size > 1) {
                const range = generateTableRange(g.allTableIds);
                g.merged_tables = range;
                g.mergedTables = range;
                g.tableName = range; // [WHY] Ensure components like Receipt use the full range name
            }
            return g;
        }).sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    }, [historyOrders]);
};
