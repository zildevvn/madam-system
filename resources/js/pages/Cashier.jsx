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
    } = useConsolidatedOrders(null, true, true);

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
                    draftItems: currentOrder ? [...currentOrder.items] : []
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
        const standalone = [];

        historyOrders.forEach(order => {
            if (order.reservation_id) {
                if (!groups[order.reservation_id]) {
                    groups[order.reservation_id] = {
                        ...order,
                        items: [...(order.items || [])],
                        total_price: Number(order.total_price),
                        discount_amount: Number(order.discount_amount),
                        allMergedTables: new Set(order.merged_tables ? order.merged_tables.split('-') : (order.table?.name ? [order.table.name.replace(/[^0-9]/g, '')] : []))
                    };
                } else {
                    const g = groups[order.reservation_id];
                    g.total_price += Number(order.total_price);
                    g.discount_amount += Number(order.discount_amount);
                    g.items = [...g.items, ...(order.items || [])];
                    if (order.merged_tables) {
                        order.merged_tables.split('-').forEach(t => g.allMergedTables.add(t.replace(/[^0-9]/g, '')));
                    } else if (order.table?.name) {
                        g.allMergedTables.add(order.table.name.replace(/[^0-9]/g, ''));
                    }
                    if (new Date(order.updated_at) > new Date(g.updated_at)) {
                        g.updated_at = order.updated_at;
                    }
                }
            } else {
                standalone.push(order);
            }
        });

        const consolidated = Object.values(groups).map(g => {
            if (g.allMergedTables.size > 0) {
                g.merged_tables = Array.from(g.allMergedTables)
                    .filter(Boolean)
                    .sort((a,b) => parseInt(a) - parseInt(b))
                    .join('-');
            }
            return g;
        });

        return [...consolidated, ...standalone].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    }, [historyOrders]);

    // [WHY] Mutually Exclusive Layout Calculations for Top Lanes
    const topLayout = useMemo(() => {
        if (collapsedSection === 'left') {
            return {
                left: 'w-full lg:w-[15%] is-collapsed',
                right: 'w-full lg:w-[85%]',
                isLeftCollapsed: true,
                isRightCollapsed: false
            };
        }
        if (collapsedSection === 'right') {
            return {
                left: 'w-full lg:w-[85%]',
                right: 'w-full lg:w-[15%] is-collapsed',
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
                            layout={topLayout}
                            individualTables={individualTables}
                            individualOrders={individualOrders}
                            currentTime={currentTime}
                            onTableClick={handleTableClick}
                            onToggleCollapse={() => setCollapsedSection(collapsedSection === 'left' ? null : 'left')}
                        />

                        <CashierGroupLane 
                            layout={topLayout}
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

            {/* Payment / Edit Modal */}
            {(selectedTable || editingHistoryOrder) && (currentContext || tableContexts[`history-${editingHistoryOrder?.id}`]) && (
                <PaymentModal
                    selectedTable={selectedTable || editingHistoryOrder?.table}
                    currentOrder={currentOrder || editingHistoryOrder}
                    isHistoryEdit={!!editingHistoryOrder}
                    onClose={() => {
                        setSelectedTable(null);
                        setEditingHistoryOrder(null);
                    }}
                    onPaymentSuccess={handlePaymentSuccess}

                    // Controlled Props from context
                    draftItems={editingHistoryOrder ? editingHistoryOrder.items : currentContext.draftItems}
                    onUpdateDraftItems={(items) => updateTableContext(editingHistoryOrder ? `history-${editingHistoryOrder.id}` : currentLookupKey, { draftItems: items })}

                    discountType={(editingHistoryOrder ? tableContexts[`history-${editingHistoryOrder.id}`] : currentContext).discountType}
                    onUpdateDiscountType={(type) => updateTableContext(editingHistoryOrder ? `history-${editingHistoryOrder.id}` : currentLookupKey, { discountType: type })}

                    discountValue={(editingHistoryOrder ? tableContexts[`history-${editingHistoryOrder.id}`] : currentContext).discountValue}
                    onUpdateDiscountValue={(val) => updateTableContext(editingHistoryOrder ? `history-${editingHistoryOrder.id}` : currentLookupKey, { discountValue: val })}

                    step={(editingHistoryOrder ? tableContexts[`history-${editingHistoryOrder.id}`] : currentContext).step}
                    onUpdateStep={(s) => updateTableContext(editingHistoryOrder ? `history-${editingHistoryOrder.id}` : currentLookupKey, { step: s })}

                    cashierNote={(editingHistoryOrder ? tableContexts[`history-${editingHistoryOrder.id}`] : currentContext).cashierNote}
                    onUpdateCashierNote={(note) => updateTableContext(editingHistoryOrder ? `history-${editingHistoryOrder.id}` : currentLookupKey, { cashierNote: note })}
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
