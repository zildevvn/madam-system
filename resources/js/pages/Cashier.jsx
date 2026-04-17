import React, { useState, useEffect, useMemo } from 'react';
import { useConsolidatedOrders } from '../hooks/useConsolidatedOrders';
import { useCashierSegmentation } from '../hooks/useCashierSegmentation';
import Receipt from '../components/Receipt';
import PaymentModal from '../components/PaymentModal';
import { reservationApi } from '../services/reservationApi';
import CashierIndividualLane from '../components/CashierIndividualLane';
import CashierGroupLane from '../components/CashierGroupLane';
import CashierHistoryLane from '../components/CashierHistoryLane';
import orderApi from '../services/orderApi';
const Cashier = () => {
    const {
        orders,
        orderDict,
        currentTime,
        allTables,
        status,
        error
    } = useConsolidatedOrders(null, true);

    const [selectedTable, setSelectedTable] = useState(null);
    const [tableContexts, setTableContexts] = useState({}); // { [tableId]: { step, discountType, discountValue, draftItems } }
    const [reservations, setReservations] = useState([]);
    const [collapsedSection, setCollapsedSection] = useState(null); // Expand all by default
    const [isLoadingRes, setIsLoadingRes] = useState(false);
    const [historyOrders, setHistoryOrders] = useState([]);
    const [isReopening, setIsReopening] = useState(null);
    const [editingHistoryOrder, setEditingHistoryOrder] = useState(null);

    const loadReservations = React.useCallback(async () => {
        setIsLoadingRes(true);
        try {
            const res = await reservationApi.getAll();
            setReservations(res.data || []);
        } catch (err) {
            console.error("Failed to fetch reservations:", err);
        } finally {
            setIsLoadingRes(false);
        }
    }, []);

    const loadHistory = React.useCallback(async () => {
        try {
            const res = await orderApi.getHistory(15);
            setHistoryOrders(res.data || []);
        } catch (err) {
            console.error("Failed to fetch history:", err);
        }
    }, []);

    // [WHY] Fetch reservations and history
    useEffect(() => {
        loadReservations();
        loadHistory();
    }, [loadReservations, loadHistory, status]); // Refresh when table status changes (suggests updates)

    // [WHY] Real-time listeners for the Cashier dashboard
    useEffect(() => {
        if (window.Echo) {
            const channel = window.Echo.channel('orders');

            const handleUpdate = () => {
                loadReservations();
                loadHistory();
            };

            channel.listen('.order_created', handleUpdate)
                .listen('.order_updated', handleUpdate)
                .listen('.item_status_updated', handleUpdate)
                .listen('.reservation_updated', handleUpdate);

            return () => window.Echo.leaveChannel('orders');
        }
    }, [loadReservations, loadHistory]);

    // [WHY] Segment orders into Group Reservations vs Individual Tables
    // [RULE] Tách UI và logic (custom hook) — README.md Component Rule
    const { groupOrders, individualOrders, individualTables, groupTables } = useCashierSegmentation(orders, allTables);

    const handleTableClick = (table) => {
        const lookupKey = (table.groupKey || table.id).toString();
        const currentOrder = individualOrders[lookupKey] || groupOrders[lookupKey];

        // [WHY] Initialize context for this table if it doesn't already exist
        if (!tableContexts[lookupKey]) {
            setTableContexts(prev => ({
                ...prev,
                [lookupKey]: {
                    step: 1,
                    discountType: 'fixed',
                    discountValue: 0,
                    cashierNote: '',
                    draftItems: currentOrder ? [...currentOrder.items] : [],
                    paymentMethod: 'cash',
                    showExtras: false
                }
            }));
        }
        setSelectedTable(table);
    };

    const updateTableContext = (tableId, updates) => {
        setTableContexts(prev => ({
            ...prev,
            [tableId]: {
                ...(prev[tableId] || {}),
                ...updates
            }
        }));
    };

    const handlePaymentSuccess = () => {
        if (selectedTable) {
            const lookupKey = (selectedTable.groupKey || selectedTable.id).toString();
            setTableContexts(prev => {
                const newState = { ...prev };
                delete newState[lookupKey];
                return newState;
            });
        }
        if (editingHistoryOrder) {
            setEditingHistoryOrder(null);
            loadHistory();
        }
        setSelectedTable(null);
    };

    const handleReopenOrder = async (orderId) => {
        if (!window.confirm("Are you sure you want to reopen this bill? This will move it back to active status.")) return;
        
        setIsReopening(orderId);
        try {
            await orderApi.reopenOrder(orderId);
            // toast.success("Order reopened successfully");
            loadHistory();
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || "Failed to reopen order");
        } finally {
            setIsReopening(null);
        }
    };

    const handleEditHistoryOrder = (order) => {
        // [WHY] Map history order to the format expected by PaymentModal
        setEditingHistoryOrder(order);
        
        // We set context for this "pseudo-table" if it's not a real active table
        const lookupKey = `history-${order.id}`;
        setTableContexts(prev => ({
            ...prev,
            [lookupKey]: {
                step: 2, // Jump straight to payment step
                paymentMethod: order.payment_method || 'cash', // Pre-fill current payment method
                showExtras: true, // Show Note and Discount by default for history edit
                discountType: order.discount_type || 'fixed',
                discountValue: order.discount_value || 0,
                cashierNote: order.cashier_note || '',
                draftItems: order.items || []
            }
        }));
    };

    const currentLookupKey = selectedTable ? (selectedTable.groupKey || selectedTable.id).toString() : null;
    const currentContext = currentLookupKey ? tableContexts[currentLookupKey] : null;
    const currentOrder = currentLookupKey ? (individualOrders[currentLookupKey] || groupOrders[currentLookupKey]) : null;
    
    // [WHY] Consolidate history orders by reservation_id for Group Reservations
    // [RULE] Match Group Reservation lane behavior: one card per group transaction
    const consolidatedHistory = useMemo(() => {
        const groups = {};

        // Helper to clean -indiv, -group and other internal suffixes
        const cleanMergedString = (str) => {
            if (!str) return null;
            return str.split('-')
                .map(p => p.toString().replace(/[^0-9]/g, ''))
                .filter(Boolean)
                .sort((a,b) => parseInt(a) - parseInt(b))
                .join('-');
        };

        // [WHY] Normalize all orders first to ensure items have a 'name' property and match active order shape
        const normalizedHistory = historyOrders.map(order => ({
            ...order,
            mergedTables: order.merged_tables, // [MAP] For PaymentItemEditor
            isGroup: !!order.reservation_id,    // [MAP] For PaymentModalFooter
            items: (order.items || []).map(i => ({
                ...i,
                name: i.product?.name || i.name || 'Unknown',
                tableId: i.table_id // [WHY] Preserve null for shared items; PaymentItemEditor uses this to group into 'GROUP'
            }))
        }));

        // [WHY] Multi-signal grouping logic (Two Pass)
        // [RULE] If orders share a Reservation ID OR a Transaction Timestamp OR a Merged Table string, they belong together.
        const signalToGroupId = {};
        
        // Pass 1: Build Linkages
        normalizedHistory.forEach(order => {
            const timeKey = new Date(order.updated_at).getTime().toString();
            const cleanedMerged = cleanMergedString(order.merged_tables);
            
            const signals = [
                order.reservation_id ? `res-${order.reservation_id}` : null,
                cleanedMerged ? `merged-${cleanedMerged}` : null,
                `tx-${timeKey}-${order.payment_method}`
            ].filter(Boolean);

            // Find an existing group ID from any of the signals
            let existingGroupId = null;
            for (const s of signals) {
                if (signalToGroupId[s]) {
                    existingGroupId = signalToGroupId[s];
                    break;
                }
            }

            // If found, link all current signals to this group. If not, create a new one.
            const groupId = existingGroupId || signals[0];
            signals.forEach(s => signalToGroupId[s] = groupId);
        });

        // Pass 2: Grouping
        normalizedHistory.forEach(order => {
            const timeKey = new Date(order.updated_at).getTime().toString();
            const groupKey = signalToGroupId[order.reservation_id ? `res-${order.reservation_id}` : `tx-${timeKey}-${order.payment_method}`];

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
                if (order.cashier_note && !g.cashier_note) {
                    g.cashier_note = order.cashier_note;
                }
                // [WHY] Ensure if any order in the group has reservation metadata, the group card carries it
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

        const consolidated = Object.values(groups).map(g => {
            if (g.allTableIds.size > 1) {
                const range = Array.from(g.allTableIds)
                    .filter(Boolean)
                    .sort((a,b) => parseInt(a) - parseInt(b))
                    .join('-');
                g.merged_tables = range;
                g.mergedTables = range;
            }
            return g;
        });

        return consolidated.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    }, [historyOrders]);

    // [WHY] Mutually Exclusive Layout Calculations for Top Lanes
    const layout = useMemo(() => {
        if (collapsedSection === 'left') {
            return {
                left: 'w-full lg:w-[20%] is-collapsed',
                right: 'w-full lg:w-[80%]',
                isLeftCollapsed: true,
                isRightCollapsed: false
            };
        }
        if (collapsedSection === 'right') {
            return {
                left: 'w-full lg:w-[80%]',
                right: 'w-full lg:w-[20%] is-collapsed',
                isLeftCollapsed: false,
                isRightCollapsed: true
            };
        }
        return {
            left: 'w-full lg:w-1/2',
            right: 'w-full lg:w-1/2',
            isLeftCollapsed: false,
            isRightCollapsed: false
        };
    }, [collapsedSection]);

    // History Layout: Simple full-width toggle
    const historyLayout = useMemo(() => ({
        history: collapsedSection === 'history' ? 'w-full !min-h-0' : 'w-full',
        isHistoryCollapsed: collapsedSection === 'history'
    }), [collapsedSection]);

    // [WHY] Early return AFTER all hooks to comply with React's rules of hooks
    if (status === 'loading' && allTables.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    return (
        <div className="cashier-page pb-20">
            {/* [NON-INTRUSIVE FIX] Invisible spacer to satisfy global SCSS first-child:fixed rule */}
            <div className="hidden" aria-hidden="true"></div>

            <div className="py-8 relative overflow-x-hidden">
                <div className="w-full max-w-[1600px] mx-auto px-[20px]">
                    {/* Top Row: Active Lanes */}
                    <div className="flex flex-col lg:flex-row gap-4 relative items-start">
                        <CashierIndividualLane 
                            layout={layout}
                            individualTables={individualTables}
                            individualOrders={individualOrders}
                            currentTime={currentTime}
                            onTableClick={handleTableClick}
                            onToggleCollapse={() => setCollapsedSection(collapsedSection === 'left' ? null : 'left')}
                        />

                        <CashierGroupLane 
                            layout={layout}
                            groupTables={groupTables}
                            groupOrders={groupOrders}
                            currentTime={currentTime}
                            onTableClick={handleTableClick}
                            onToggleCollapse={() => setCollapsedSection(collapsedSection === 'right' ? null : 'right')}
                        />
                    </div>

                    {/* Bottom Row: History Lane (Full Width) */}
                    < CashierHistoryLane 
                        layout={historyLayout}
                        historyOrders={consolidatedHistory}
                        onToggleCollapse={() => setCollapsedSection(collapsedSection === 'history' ? null : 'history')}
                        onEditOrder={handleEditHistoryOrder}
                        onReopenOrder={handleReopenOrder}
                        isReopening={isReopening}
                    />
                </div>
            </div>

            {/* Original Payment Popup Modal for Active Tables */}
            {selectedTable && currentContext && (
                <PaymentModal
                    selectedTable={selectedTable}
                    currentOrder={currentOrder}
                    onClose={() => setSelectedTable(null)}
                    onPaymentSuccess={handlePaymentSuccess}

                    // Controlled Props from context
                    draftItems={currentContext.draftItems}
                    onUpdateDraftItems={(items) => updateTableContext(currentLookupKey, { draftItems: items })}

                    discountType={currentContext.discountType}
                    onUpdateDiscountType={(type) => updateTableContext(currentLookupKey, { discountType: type })}

                    discountValue={currentContext.discountValue}
                    onUpdateDiscountValue={(val) => updateTableContext(currentLookupKey, { discountValue: val })}

                    step={currentContext.step}
                    onUpdateStep={(s) => updateTableContext(currentLookupKey, { step: s })}

                    cashierNote={currentContext.cashierNote}
                    onUpdateCashierNote={(note) => updateTableContext(currentLookupKey, { cashierNote: note })}

                    paymentMethod={currentContext.paymentMethod}
                    onUpdatePaymentMethod={(method) => updateTableContext(currentLookupKey, { paymentMethod: method })}

                    showExtras={currentContext.showExtras}
                    onUpdateShowExtras={(show) => updateTableContext(currentLookupKey, { showExtras: show })}
                />
            )}

            {/* Separate Modal Logic for History Editing to avoid Key (RK) conflicts */}
            {editingHistoryOrder && tableContexts[`history-${editingHistoryOrder.id}`] && (
                <PaymentModal
                    selectedTable={editingHistoryOrder.table}
                    currentOrder={editingHistoryOrder}
                    isHistoryEdit={true}
                    onClose={() => setEditingHistoryOrder(null)}
                    onPaymentSuccess={handlePaymentSuccess}

                    // Controlled Props from context (isolated from active table contexts)
                    draftItems={editingHistoryOrder.items}
                    onUpdateDraftItems={(items) => updateTableContext(`history-${editingHistoryOrder.id}`, { draftItems: items })}

                    discountType={tableContexts[`history-${editingHistoryOrder.id}`].discountType}
                    onUpdateDiscountType={(type) => updateTableContext(`history-${editingHistoryOrder.id}`, { discountType: type })}

                    discountValue={tableContexts[`history-${editingHistoryOrder.id}`].discountValue}
                    onUpdateDiscountValue={(val) => updateTableContext(`history-${editingHistoryOrder.id}`, { discountValue: val })}

                    step={tableContexts[`history-${editingHistoryOrder.id}`].step}
                    onUpdateStep={(s) => updateTableContext(`history-${editingHistoryOrder.id}`, { step: s })}

                    cashierNote={tableContexts[`history-${editingHistoryOrder.id}`].cashierNote}
                    onUpdateCashierNote={(note) => updateTableContext(`history-${editingHistoryOrder.id}`, { cashierNote: note })}

                    paymentMethod={tableContexts[`history-${editingHistoryOrder.id}`].paymentMethod}
                    onUpdatePaymentMethod={(method) => updateTableContext(`history-${editingHistoryOrder.id}`, { paymentMethod: method })}

                    showExtras={tableContexts[`history-${editingHistoryOrder.id}`].showExtras}
                    onUpdateShowExtras={(show) => updateTableContext(`history-${editingHistoryOrder.id}`, { showExtras: show })}
                />
            )}

            {/* Hidden Print Area */}
            {selectedTable && currentOrder && currentContext && (
                <div className="hidden-print">
                    <Receipt
                        order={currentOrder}
                        tableName={selectedTable?.name}
                        discountType={currentContext.discountType}
                        discountValue={currentContext.discountValue}
                    />
                </div>
            )}
        </div>
    );
};

export default Cashier;
