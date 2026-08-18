import { useMemo } from 'react';
import { cleanMergedString, generateTableRange } from '../shared/utils/normalizeTableStrings';

/**
 * computeSignals
 * [WHY] Helper to generate the unique linkage signals for a given order (ReservationID, Time, Merged Tables).
 */
export const computeSignals = (order) => {
    // [WHY] Round time to nearest 2 seconds to handle minor drift in DB timestamps
    const roundedTime = Math.floor(new Date(order.updated_at).getTime() / 2000) * 2000;
    const timeKey = roundedTime.toString();
    const cleanedMerged = cleanMergedString(order.merged_tables);

    const signals = [
        order.reservation_id ? `res-${order.reservation_id}` : null,
        cleanedMerged ? `merged-${cleanedMerged}-${timeKey}` : null
    ].filter(Boolean);

    // [WHY] Fallback to a unique signal per order if neither merged nor group reservation
    if (signals.length === 0) {
        signals.push(`order-${order.id}`);
    }

    return signals;
};

/**
 * getPrimaryOrder
 * [WHY] Resolves the single source-of-truth order for inherited group metadata.
 * [RULE] Priority: 1. Order with a reservation. 2. Most recently updated order. 3. Fallback to first order.
 */
const getPrimaryOrder = (orders) => {
    if (!orders || orders.length === 0) return null;
    
    // Find order with reservation
    const resOrder = orders.find(o => o.reservation);
    if (resOrder) return resOrder;
    
    // Find most recently updated order
    return [...orders].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))[0];
};

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

        // [WHY] Step 1: Normalize order items and basic metadata with consistent numeric table IDs
        const normalizedHistory = historyOrders.map(order => {
            const numericTableId = order.table_id ? Number(order.table_id) : null;
            const cm = cleanMergedString(order.merged_tables);
            const parsedMergedTableIds = cm ? cm.split('-').map(Number) : [];
            const reservationTableIds = order.reservation?.table_ids 
                ? (order.reservation.table_ids || []).map(Number) 
                : [];

            return {
                ...order,
                table_id: numericTableId,
                mergedTables: order.merged_tables,
                isGroup: !!order.reservation_id,
                parsedMergedTableIds,
                reservationTableIds,
                items: (order.items || []).map(i => ({
                    ...i,
                    name: i.product?.name || i.name || 'Unknown',
                    tableId: i.table_id ? Number(i.table_id) : numericTableId
                }))
            };
        });

        // [WHY] Step 2: Build linkage signals (ReservationID, Time, Merged Tables)
        // [RULE] If orders share ANY of these markers, they are part of one group bill.
        normalizedHistory.forEach(order => {
            const signals = computeSignals(order);

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
            const signals = computeSignals(order);

            let groupKey = null;
            for (const s of signals) {
                if (signalToGroupId[s]) {
                    groupKey = signalToGroupId[s];
                    break;
                }
            }

            if (!groupKey) return; // Should not happen if Step 2 worked

            if (!groups[groupKey]) {
                groups[groupKey] = {
                    ...order,
                    merged_tables: cleanMergedString(order.merged_tables),
                    mergedTables: cleanMergedString(order.merged_tables),
                    itemsMap: {}, // [WHY] Use map to group items by product + note
                    allOrders: [order],
                    allTableIds: new Set()
                };

                // [WHY] Initialize itemsMap with the first order's items, merging duplicates of the same product/key
                (order.items || []).forEach(item => {
                    const itemId = item.id || item.order_item_id;
                    if (itemId && handledItemIds.has(itemId)) return;
                    if (itemId) handledItemIds.add(itemId);

                    const tid = item.tableId || order.table_id;
                    const key = `${item.product_id || item.name}-${item.note || ''}`; // [WHY] No tid in key to merge across tables
                    if (groups[groupKey].itemsMap[key]) {
                        groups[groupKey].itemsMap[key].quantity += item.quantity;
                    } else {
                        groups[groupKey].itemsMap[key] = { ...item, tableId: tid };
                    }
                });

                // Track all table IDs involved
                if (order.parsedMergedTableIds.length > 0) {
                    order.parsedMergedTableIds.forEach(id => groups[groupKey].allTableIds.add(id));
                } else if (order.table_id) {
                    groups[groupKey].allTableIds.add(order.table_id);
                }

                order.reservationTableIds.forEach(id => groups[groupKey].allTableIds.add(id));
            } else {
                const g = groups[groupKey];
                g.allOrders.push(order);

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

                if (order.parsedMergedTableIds.length > 0) {
                    order.parsedMergedTableIds.forEach(id => g.allTableIds.add(id));
                } else if (order.table_id) {
                    g.allTableIds.add(order.table_id);
                }

                order.reservationTableIds.forEach(id => g.allTableIds.add(id));
            }
        });

        // [WHY] Step 4: Final pass — aggregate payments and resolve display metadata.
        // [FIX] DO NOT recalculate total_price from items.
        // Backend (OrderPaymentService) already computed the correct NET price for each order,
        // including per-item discounts, VAT, and group discount distribution across split orders.
        // Recalculating from items[].price causes inflated totals because item prices are gross/pre-discount.
        return Object.values(groups).map(g => {
            const rawItems = Object.values(g.itemsMap);
            const primaryOrder = getPrimaryOrder(g.allOrders) || g.allOrders[0];

            const items = rawItems.map(item => ({
                ...item,
                tableId: item.tableId || g.table_id
            }));

            let mergedTablesRange = g.merged_tables;
            if (g.allTableIds.size > 1) {
                mergedTablesRange = generateTableRange(g.allTableIds);
            }

            const latestUpdatedAt = g.allOrders.reduce((latest, current) => {
                return new Date(current.updated_at) > new Date(latest) ? current.updated_at : latest;
            }, g.updated_at);

            const mergedPaymentsMap = g.allOrders.reduce((acc, currentOrder) => {
                (currentOrder.payments || []).forEach(p => {
                    const method = p.payment_method;
                    if (!acc[method]) {
                        acc[method] = { payment_method: method, amount: 0 };
                    }
                    acc[method].amount += Number(p.amount) || 0;
                });
                return acc;
            }, {});
            const mergedPayments = Object.values(mergedPaymentsMap);

            // [FIX] Sum total_price directly from backend values — do NOT use calculateTotals().
            const aggregatedTotalPrice = g.allOrders.reduce(
                (sum, o) => sum + (Number(o.total_price) || 0), 0
            );
            const aggregatedDiscountAmount = g.allOrders.reduce(
                (sum, o) => sum + (Number(o.discount_amount) || 0), 0
            );
            // [FIX] Use ?? not || — a legitimately-zero subtotal must not fall back to total_price.
            const aggregatedSubtotal = g.allOrders.reduce(
                (sum, o) => sum + (Number(o.subtotal ?? o.total_price) || 0), 0
            );
            // [FIX] Preserve item-level discount info instead of hardcoding 0 — sum per-item discount
            // (price * discount, or price * discount/100 for percent type) across rawItems so any UI
            // reading itemDiscountsTotal for breakdown display doesn't silently regress to 0.
            const aggregatedItemDiscountsTotal = rawItems.reduce((sum, item) => {
                const price = Number(item.price) || 0;
                const qty = Number(item.quantity) || 0;
                const disc = Number(item.discount) || 0;
                const type = item.discount_type || item.discountType || 'fixed';
                const perUnitDisc = type === 'percent' ? (price * disc / 100) : disc;
                return sum + (perUnitDisc * qty);
            }, 0);

            return {
                ...g,
                items,
                cashier_note: primaryOrder.cashier_note || null,
                reservation: primaryOrder.reservation || null,
                reservation_id: primaryOrder.reservation_id || null,
                isGroup: !!primaryOrder.reservation_id,
                total_price: aggregatedTotalPrice,
                discount_amount: aggregatedDiscountAmount,
                itemDiscountsTotal: aggregatedItemDiscountsTotal,
                subtotal: aggregatedSubtotal,
                merged_tables: mergedTablesRange,
                mergedTables: mergedTablesRange,
                tableName: mergedTablesRange,
                payments: mergedPayments.length > 0 ? mergedPayments : g.payments,
                updated_at: latestUpdatedAt
            };
        }).sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    }, [historyOrders]);
};
