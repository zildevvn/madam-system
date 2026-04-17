import React, { useState, useEffect, useMemo } from 'react';
import { useConsolidatedOrders } from '../hooks/useConsolidatedOrders';
import { useCashierSegmentation } from '../hooks/useCashierSegmentation';
import Receipt from '../components/Receipt';
import PaymentModal from '../components/PaymentModal';
import CashierIndividualLane from '../components/CashierIndividualLane';
import CashierGroupLane from '../components/CashierGroupLane';
import CashierHistoryLane from '../components/CashierHistoryLane';
import orderApi from '../services/orderApi';
import { useCashierHistory } from '../hooks/useCashierHistory';
import { useCashierData } from '../hooks/useCashierData';
import { cleanMergedString } from '../shared/utils/normalizeTableStrings';

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
    const [collapsedSection, setCollapsedSection] = useState(null); // Expand all by default
    const [isReopening, setIsReopening] = useState(null);
    const [editingHistoryOrder, setEditingHistoryOrder] = useState(null);

    const {
        reservations,
        historyOrders,
        isLoadingRes,
        refreshData
    } = useCashierData(status);

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
            refreshData();
        }
        setSelectedTable(null);
    };

    const handleReopenOrder = async (orderId) => {
        if (!window.confirm("Are you sure you want to reopen this bill? This will move it back to active status.")) return;
        
        setIsReopening(orderId);
        try {
            await orderApi.reopenOrder(orderId);
            // toast.success("Order reopened successfully");
            refreshData();
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
    
    const consolidatedHistory = useCashierHistory(historyOrders);

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
