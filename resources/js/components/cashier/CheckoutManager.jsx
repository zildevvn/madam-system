import React, { useReducer, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import PaymentModal from './PaymentModal';
import Receipt from './Receipt';

/**
 * [WHY] checkoutReducer handles all transitions for the checkout state.
 * Prevents "God object" issues by centralizing state logic and ensuring
 * immutable updates without manual merging bugs.
 */
const checkoutReducer = (state, action) => {
    switch (action.type) {
        case 'INITIALIZE_TABLE':
            return {
                ...state,
                [action.payload.lookupKey]: {
                    step: 1,
                    discountType: 'fixed',
                    discountValue: 0,
                    cashierNote: '',
                    draftItems: action.payload.items,
                    serverItems: action.payload.items, // [FIX] Track server state to avoid local adjustment wipes
                    paymentMethod: 'cash',
                    showExtras: false,
                    initializedOrderId: action.payload.orderId
                }
            };
        case 'INITIALIZE_HISTORY':
            return {
                ...state,
                [action.payload.lookupKey]: {
                    step: 2,
                    paymentMethod: action.payload.order.payment_method || 'cash',
                    showExtras: true,
                    discountType: action.payload.order.discount_type || 'fixed',
                    discountValue: action.payload.order.discount_value || 0,
                    cashierNote: action.payload.order.cashier_note || '',
                    draftItems: action.payload.order.items || [],
                    serverItems: action.payload.order.items || [], // [FIX] For consistency
                    initializedOrderId: action.payload.order.id
                }
            };
        case 'UPDATE_FIELD':
            const { lookupKey, updates } = action.payload;
            if (!state[lookupKey]) return state;
            return {
                ...state,
                [lookupKey]: { ...state[lookupKey], ...updates }
            };
        case 'REFRESH_ITEMS':
            if (!state[action.payload.lookupKey]) return state;
            return {
                ...state,
                [action.payload.lookupKey]: {
                    ...state[action.payload.lookupKey],
                    draftItems: action.payload.items,
                    serverItems: action.payload.items // [FIX] Sync server state tracker
                }
            };
        case 'CLEAR':
            const next = { ...state };
            delete next[action.payload.lookupKey];
            return next;
        default:
            return state;
    }
};

/**
 * CheckoutManager: Encapsulates the complex checkout state map and initialization logic.
 * [WHY] Decouples Checkout state from the main Dashboard (Cashier.jsx).
 * This prevents unnecessary re-renders of the lanes when updating checkout details.
 */
const CheckoutManager = ({
    selectedTable,
    editingHistoryOrder,
    individualOrders,
    groupOrders,
    allTables,
    onSplitSuccess,
    onHistoryPaymentSuccess,
    onActivePaymentSuccess,
    onCloseTable,
    onCloseHistory
}) => {
    const [contexts, dispatch] = useReducer(checkoutReducer, {});

    const currentLookupKey = selectedTable ? (selectedTable.groupKey || selectedTable.id).toString() : null;
    const currentOrder = currentLookupKey ? (individualOrders[currentLookupKey] || groupOrders[currentLookupKey]) : null;

    // [WHY] Auto-initialize context for selected table/order (Active Flow)
    useEffect(() => {
        if (!selectedTable || !currentOrder) return;

        const lookupKey = currentLookupKey;
        const initialItems = currentOrder.items || [];

        const existing = contexts[lookupKey];
        // [FIX] Since split orders are now their own table cards, we don't need initializedOrderId check
        // for switching between split and full bill. However, we still need to know if the underlying
        // order ID changed (e.g. table merged or reassigned).
        const isOrderSwitched = existing && existing.initializedOrderId !== currentOrder.id;

        // [FIX] Detect if items changed ON THE SERVER by comparing currentOrder.items (initialItems)
        // with our last known serverItems. We do NOT compare with draftItems because draftItems
        // contains local adjustments which would trigger a false-positive refresh and wipe those adjustments.
        const serverItemsChanged = existing && existing.step === 1 &&
            JSON.stringify(existing.serverItems) !== JSON.stringify(initialItems);

        if (!existing || isOrderSwitched) {
            dispatch({ type: 'INITIALIZE_TABLE', payload: { lookupKey, items: initialItems, orderId: currentOrder.id } });
        } else if (serverItemsChanged) {
            // [FIX] Defensive guard: never wipe existing draftItems with an empty server list.
            // This prevents transient fetchTables states (during payment/broadcast) from clearing
            // items that are correctly in the parent order but temporarily missing from the payload.
            const wouldClearItems = initialItems.length === 0 && (existing.draftItems || []).length > 0;
            if (!wouldClearItems) {
                dispatch({ type: 'REFRESH_ITEMS', payload: { lookupKey, items: initialItems } });
            }
        }
    }, [selectedTable, currentOrder, currentLookupKey]);

    // [WHY] Auto-initialize context for history orders (History Flow)
    useEffect(() => {
        if (!editingHistoryOrder) return;
        const lookupKey = `history-${editingHistoryOrder.id}`;
        if (!contexts[lookupKey]) {
            dispatch({ type: 'INITIALIZE_HISTORY', payload: { lookupKey, order: editingHistoryOrder } });
        }
    }, [editingHistoryOrder]);

    let activeModal = null;
    if (selectedTable) {
        activeModal = {
            id: currentLookupKey,
            table: selectedTable,
            order: currentOrder,
            context: contexts[currentLookupKey],
            isHistory: false,
            onClose: onCloseTable
        };
    } else if (editingHistoryOrder) {
        const hKey = `history-${editingHistoryOrder.id}`;
        activeModal = {
            id: hKey,
            table: editingHistoryOrder.table,
            order: editingHistoryOrder,
            context: contexts[hKey],
            isHistory: true,
            onClose: onCloseHistory
        };
    }

    let displayTableName = '';
    if (activeModal) {
        const name = activeModal.order?.tableName || activeModal.table?.name;
        displayTableName = name ? `Bàn ${name.replace(/^Bàn\s+/i, '')}` : 'Mang đi';
    }

    const updateContext = (id, updates) => dispatch({ type: 'UPDATE_FIELD', payload: { lookupKey: id, updates } });

    const handlePaymentSuccessProxy = (newOrder) => {
        if (activeModal) {
            const paidOrderId = activeModal.order?.id;
            dispatch({ type: 'CLEAR', payload: { lookupKey: activeModal.id } });

            if (newOrder) {
                onSplitSuccess(newOrder);
            } else if (activeModal.isHistory) {
                onHistoryPaymentSuccess();
            } else {
                onActivePaymentSuccess(paidOrderId);
            }
        }
    };

    if (!activeModal) return null;

    const ctx = activeModal.context;

    return (
        <>
            <PaymentModal
                selectedTable={activeModal.table}
                currentOrder={activeModal.order}
                allTables={allTables}
                isHistoryEdit={activeModal.isHistory}
                onClose={activeModal.onClose}
                onPaymentSuccess={handlePaymentSuccessProxy}
                isLoading={!ctx}

                // Controlled props from the isolated state
                draftItems={ctx?.draftItems || []}
                onUpdateDraftItems={(items) => updateContext(activeModal.id, { draftItems: items })}
                discountType={ctx?.discountType || 'fixed'}
                onUpdateDiscountType={(type) => updateContext(activeModal.id, { discountType: type })}
                discountValue={ctx?.discountValue || 0}
                onUpdateDiscountValue={(val) => updateContext(activeModal.id, { discountValue: val })}
                step={ctx?.step || 1}
                onUpdateStep={(s) => updateContext(activeModal.id, { step: s })}
                cashierNote={ctx?.cashierNote || ''}
                onUpdateCashierNote={(note) => updateContext(activeModal.id, { cashierNote: note })}
                paymentMethod={ctx?.paymentMethod || 'cash'}
                onUpdatePaymentMethod={(method) => updateContext(activeModal.id, { paymentMethod: method })}
                showExtras={ctx?.showExtras || false}
                onUpdateShowExtras={(show) => updateContext(activeModal.id, { showExtras: show })}
            />

            {createPortal(
                <Receipt
                    order={{ ...activeModal.order, items: ctx?.draftItems || [] }}
                    tableName={displayTableName}
                    allTables={allTables}
                    discountType={ctx?.discountType || 'fixed'}
                    discountValue={ctx?.discountValue || 0}
                />,
                document.body
            )}
        </>
    );
};

export default CheckoutManager;
