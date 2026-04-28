import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useConsolidatedOrders } from '../hooks/useConsolidatedOrders';
import { useCashierSegmentation } from '../hooks/useCashierSegmentation';
import Receipt from '../components/cashier/Receipt';
import PaymentModal from '../components/cashier/PaymentModal';
import CashierIndividualLane from '../components/cashier/CashierIndividualLane';
import CashierGroupLane from '../components/cashier/CashierGroupLane';
import CashierHistoryLane from '../components/cashier/CashierHistoryLane';
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
    const { groupOrders, individualOrders, individualTables, groupTables } = useCashierSegmentation(orders, allTables);
    
    // [WHY] Force state-driven print isolation
    useEffect(() => {
        const handleBefore = () => document.body.classList.add('is-printing-receipt');
        const handleAfter = () => document.body.classList.remove('is-printing-receipt');

        window.addEventListener('beforeprint', handleBefore);
        window.addEventListener('afterprint', handleAfter);

        return () => {
            window.removeEventListener('beforeprint', handleBefore);
            window.removeEventListener('afterprint', handleAfter);
            document.body.classList.remove('is-printing-receipt');
        };
    }, []);

    const handleTableClick = (table) => {
        const lookupKey = (table.groupKey || table.id).toString();
        const currentOrder = individualOrders[lookupKey] || groupOrders[lookupKey];

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
            refreshData();
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || "Failed to reopen order");
        } finally {
            setIsReopening(null);
        }
    };

    const handleEditHistoryOrder = (order) => {
        setEditingHistoryOrder(order);
        const lookupKey = `history-${order.id}`;
        setTableContexts(prev => ({
            ...prev,
            [lookupKey]: {
                step: 2,
                paymentMethod: order.payment_method || 'cash',
                showExtras: true,
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

    const historyLayout = useMemo(() => ({
        history: collapsedSection === 'history' ? 'w-full !min-h-0' : 'w-full',
        isHistoryCollapsed: collapsedSection === 'history'
    }), [collapsedSection]);

    // [WHY] Unified state for Payment Modal to eliminate duplication between Active and History flows
    const activeModal = useMemo(() => {
        if (selectedTable && currentContext) {
            return {
                id: currentLookupKey,
                table: selectedTable,
                order: currentOrder,
                context: currentContext,
                isHistory: false,
                onClose: () => setSelectedTable(null)
            };
        }
        const hKey = editingHistoryOrder ? `history-${editingHistoryOrder.id}` : null;
        if (editingHistoryOrder && tableContexts[hKey]) {
            return {
                id: hKey,
                table: editingHistoryOrder.table,
                order: editingHistoryOrder,
                context: tableContexts[hKey],
                isHistory: true,
                onClose: () => setEditingHistoryOrder(null)
            };
        }
        return null;
    }, [selectedTable, currentContext, editingHistoryOrder, tableContexts, currentLookupKey, currentOrder]);

    const displayTableName = useMemo(() => {
        if (!activeModal) return '';
        const name = activeModal.order?.tableName || activeModal.table?.name;
        return name ? `Bàn ${name.replace(/^Bàn\s+/i, '')}` : 'Mang đi';
    }, [activeModal]);

    if (status === 'loading' && allTables.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    return (
        <div className="cashier-page pb-20">
            {/* [RULE] All interactive UI goes inside .no-print for selective isolation */}
            <div className="no-print">
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
                        <CashierHistoryLane 
                            layout={historyLayout}
                            historyOrders={consolidatedHistory}
                            onToggleCollapse={() => setCollapsedSection(collapsedSection === 'history' ? null : 'history')}
                            onEditOrder={handleEditHistoryOrder}
                            onReopenOrder={handleReopenOrder}
                            isReopening={isReopening}
                        />
                    </div>
                </div>

                {/* Unified Payment Popup Modal */}
                {activeModal && (
                    <PaymentModal
                        selectedTable={activeModal.table}
                        currentOrder={activeModal.order}
                        allTables={allTables}
                        isHistoryEdit={activeModal.isHistory}
                        onClose={activeModal.onClose}
                        onPaymentSuccess={handlePaymentSuccess}

                        // Controlled Props from context
                        draftItems={activeModal.context.draftItems}
                        onUpdateDraftItems={(items) => updateTableContext(activeModal.id, { draftItems: items })}

                        discountType={activeModal.context.discountType}
                        onUpdateDiscountType={(type) => updateTableContext(activeModal.id, { discountType: type })}

                        discountValue={activeModal.context.discountValue}
                        onUpdateDiscountValue={(val) => updateTableContext(activeModal.id, { discountValue: val })}

                        step={activeModal.context.step}
                        onUpdateStep={(s) => updateTableContext(activeModal.id, { step: s })}

                        cashierNote={activeModal.context.cashierNote}
                        onUpdateCashierNote={(note) => updateTableContext(activeModal.id, { cashierNote: note })}

                        paymentMethod={activeModal.context.paymentMethod}
                        onUpdatePaymentMethod={(method) => updateTableContext(activeModal.id, { paymentMethod: method })}

                        showExtras={activeModal.context.showExtras}
                        onUpdateShowExtras={(show) => updateTableContext(activeModal.id, { showExtras: show })}
                    />
                )}
            </div>

            {/* Unified Receipt Printing Portal */}
            {activeModal && createPortal(
                <Receipt
                    order={{...activeModal.order, items: activeModal.context.draftItems}}
                    tableName={displayTableName}
                    allTables={allTables}
                    discountType={activeModal.context.discountType}
                    discountValue={activeModal.context.discountValue}
                />,
                document.body
            )}
        </div>
    );
};

export default Cashier;
