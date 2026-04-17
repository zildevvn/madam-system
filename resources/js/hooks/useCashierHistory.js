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

        // [WHY] Step 1: Normalize order items and basic metadata
        const normalizedHistory = historyOrders.map(order => ({
            ...order,
            mergedTables: order.merged_tables,
            isGroup: !!order.reservation_id,
            items: (order.items || []).map(i => ({
                ...i,
                name: i.product?.name || i.name || 'Unknown',
                tableId: i.table_id
            }))
        }));

        // [WHY] Step 2: Build linkage signals (ReservationID, Time, Merged Tables)
        // [RULE] If orders share ANY of these markers, they are part of one group bill.
        normalizedHistory.forEach(order => {
            const timeKey = new Date(order.updated_at).getTime().toString();
            const cleanedMerged = cleanMergedString(order.merged_tables);
            
            const signals = [
                order.reservation_id ? `res-${order.reservation_id}` : null,
                cleanedMerged ? `merged-${cleanedMerged}` : null,
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
            const timeKey = new Date(order.updated_at).getTime().toString();
            const signalKey = order.reservation_id ? `res-${order.reservation_id}` : `tx-${timeKey}-${order.payment_method}`;
            const groupKey = signalToGroupId[signalKey];

            if (!groups[groupKey]) {
                groups[groupKey] = {
                    ...order,
                    merged_tables: cleanMergedString(order.merged_tables),
                    mergedTables: cleanMergedString(order.merged_tables),
                    items: [...(order.items || [])],
                    total_price: Number(order.total_price),
                    discount_amount: Number(order.discount_amount),
                    allTableIds: new Set()
                };
                
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
                g.items = [...g.items, ...(order.items || [])];
                
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
            if (g.allTableIds.size > 1) {
                const range = generateTableRange(g.allTableIds);
                g.merged_tables = range;
                g.mergedTables = range;
            }
            return g;
        }).sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    }, [historyOrders]);
};
