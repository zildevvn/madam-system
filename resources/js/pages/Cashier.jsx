import React, { useState, useEffect, useMemo } from 'react';
import { useConsolidatedOrders } from '../hooks/useConsolidatedOrders';
import { useCashierSegmentation } from '../hooks/useCashierSegmentation';
import Receipt from '../components/Receipt';
import PaymentModal from '../components/PaymentModal';
import { reservationApi } from '../services/reservationApi';
import CashierIndividualLane from '../components/CashierIndividualLane';
import CashierGroupLane from '../components/CashierGroupLane';

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
    const [collapsedSection, setCollapsedSection] = useState(null); // 'left' | 'right' | null
    const [isLoadingRes, setIsLoadingRes] = useState(false);

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

    // [WHY] Fetch reservations to drive the groupTables section
    useEffect(() => {
        loadReservations();
    }, [loadReservations, status]); // Refresh when table status changes (suggests updates)

    // [WHY] Real-time listeners for the Cashier dashboard
    useEffect(() => {
        if (window.Echo) {
            const channel = window.Echo.channel('orders');

            // Listen for any events that might affect group table assignments
            channel.listen('.order_created', loadReservations)
                .listen('.order_updated', loadReservations)
                .listen('.reservation_updated', loadReservations);

            return () => window.Echo.leaveChannel('orders');
        }
    }, [loadReservations]);

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
        setSelectedTable(null);
    };

    const currentLookupKey = selectedTable ? (selectedTable.groupKey || selectedTable.id).toString() : null;
    const currentContext = currentLookupKey ? tableContexts[currentLookupKey] : null;
    const currentOrder = currentLookupKey ? (individualOrders[currentLookupKey] || groupOrders[currentLookupKey]) : null;

    // [WHY] Mutually Exclusive Layout Calculations
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
                    <div className="flex flex-col lg:flex-row gap-4 relative items-start overflow-x-hidden">
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
                </div>
            </div>

            {/* Payment Popup Modal */}
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
