import React, { useReducer, useEffect, useMemo, useCallback, useState } from 'react';
import { createPortal, flushSync } from 'react-dom';
import PaymentModal from './PaymentModal';
import Receipt from './Receipt';
import { resolveTableName } from '../../shared/utils/normalizeTableStrings';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import Icon from '../shared/Icon';
import { getPaymentEditPermission } from '../../shared/utils/paymentPermissions';

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
                    payments: [],
                    showExtras: false,
                    initializedOrderId: action.payload.orderId
                }
            };
        case 'INITIALIZE_HISTORY': {
            const historyPayments = action.payload.order.payments || [];
            const isSplitHistory = historyPayments.length > 1;
            return {
                ...state,
                [action.payload.lookupKey]: {
                    step: 2,
                    paymentMethod: isSplitHistory ? 'split' : (action.payload.order.payment_method || 'cash'),
                    payments: historyPayments.map(p => ({
                        payment_method: p.payment_method,
                        amount: Number(p.amount)
                    })),
                    showExtras: true,
                    discountType: action.payload.order.discount_type || 'fixed',
                    discountValue: action.payload.order.discount_value || 0,
                    cashierNote: action.payload.order.cashier_note || '',
                    draftItems: action.payload.order.items || [],
                    serverItems: action.payload.order.items || [], // [FIX] For consistency
                    initializedOrderId: action.payload.order.id
                }
            };
        }
        case 'UPDATE_FIELD': {
            const { lookupKey, updates } = action.payload;
            if (!state[lookupKey]) return state;
            return {
                ...state,
                [lookupKey]: { ...state[lookupKey], ...updates }
            };
        }
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
        case 'CLEAR': {
            const next = { ...state };
            delete next[action.payload.lookupKey];
            return next;
        }
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
    const [isPrinting, setIsPrinting] = useState(false);
    const currentUser = useCurrentUser();

    // [WHY] Listen to browser beforeprint/afterprint events to mount/unmount the Receipt.
    useEffect(() => {
        const handleBeforePrint = () => {
            flushSync(() => {
                setIsPrinting(true);
            });
        };
        const handleAfterPrint = () => {
            setIsPrinting(false);
        };

        window.addEventListener('beforeprint', handleBeforePrint);
        window.addEventListener('afterprint', handleAfterPrint);

        return () => {
            window.removeEventListener('beforeprint', handleBeforePrint);
            window.removeEventListener('afterprint', handleAfterPrint);
        };
    }, []);

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
    }, [selectedTable, currentOrder, currentLookupKey, contexts]);

    // [WHY] Auto-initialize context for history orders (History Flow)
    useEffect(() => {
        if (!editingHistoryOrder) return;
        const lookupKey = `history-${editingHistoryOrder.id}`;
        if (!contexts[lookupKey]) {
            dispatch({ type: 'INITIALIZE_HISTORY', payload: { lookupKey, order: editingHistoryOrder } });
        }
    }, [editingHistoryOrder, contexts]);

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

    const tableMap = useMemo(() => {
        const map = {};
        allTables.forEach(t => {
            if (t?.id) {
                map[t.id.toString()] = t;
            }
        });
        return map;
    }, [allTables]);

    const displayTableName = useMemo(() => {
        if (!activeModal) return '';
        const orderData = {
            ...activeModal.order,
            table: activeModal.order?.table || activeModal.table
        };
        return resolveTableName(orderData, allTables, tableMap);
    }, [activeModal, allTables, tableMap]);

    const updateContext = useCallback((id, updates) => {
        dispatch({ type: 'UPDATE_FIELD', payload: { lookupKey: id, updates } });
    }, [dispatch]);

    const activeModalId = activeModal?.id;
    const activeOrderId = activeModal?.order?.id;
    const isActiveHistory = activeModal?.isHistory;

    const handlePaymentSuccessProxy = useCallback((newOrder) => {
        if (activeModalId) {
            dispatch({ type: 'CLEAR', payload: { lookupKey: activeModalId } });

            if (newOrder) {
                onSplitSuccess(newOrder);
            } else if (isActiveHistory) {
                onHistoryPaymentSuccess();
            } else {
                onActivePaymentSuccess(activeOrderId);
            }
        }
    }, [activeModalId, activeOrderId, isActiveHistory, dispatch, onSplitSuccess, onHistoryPaymentSuccess, onActivePaymentSuccess]);

    const modalHandlers = useMemo(() => {
        if (!activeModalId) return {};
        return {
            onUpdateDraftItems: (items) => updateContext(activeModalId, { draftItems: items }),
            onUpdateDiscountType: (type) => updateContext(activeModalId, { discountType: type }),
            onUpdateDiscountValue: (val) => updateContext(activeModalId, { discountValue: val }),
            onUpdateStep: (s) => updateContext(activeModalId, { step: s }),
            onUpdateCashierNote: (note) => updateContext(activeModalId, { cashierNote: note }),
            onUpdatePaymentMethod: (method) => updateContext(activeModalId, { paymentMethod: method }),
            onUpdateShowExtras: (show) => updateContext(activeModalId, { showExtras: show }),
            onUpdatePayments: (payments) => updateContext(activeModalId, { payments: payments })
        };
    }, [activeModalId, updateContext]);

    const isGroup = !!activeModal?.order?.isGroup;
    const currentMethod = activeModalId ? contexts[activeModalId]?.paymentMethod : null;

    // [WHY] Automatically validate selected payment method when group status changes.
    // Non-group orders cannot use the 'debt' method. If 'debt' is selected and isGroup is false,
    // we default back to 'cash' to prevent invalid hidden states in the checkout.
    useEffect(() => {
        if (!activeModalId) return;
        if (!isGroup && currentMethod === 'debt') {
            updateContext(activeModalId, { paymentMethod: 'cash' });
        }
    }, [isGroup, activeModalId, currentMethod, updateContext]);

    const permissionResult = useMemo(() => {
        if (!activeModal || !activeModal.isHistory) return { allowed: true };
        return getPaymentEditPermission(activeModal.order, currentUser);
    }, [activeModal, currentUser]);

    if (!activeModal) return null;

    if (activeModal.isHistory && !permissionResult.allowed) {
        return (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                <div className="bg-white rounded-[24px] w-full max-w-md p-6 shadow-2xl flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
                        <Icon name="lock" className="w-8 h-8 text-red-500" size={32} />
                    </div>
                    <h3 className="text-lg font-black text-gray-900 mb-2 uppercase tracking-wide">Access Denied</h3>
                    <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                        {permissionResult.reason || 'You do not have permission to edit this payment history record.'}
                    </p>
                    <button
                        onClick={activeModal.onClose}
                        className="w-full py-3 bg-gray-950 hover:bg-gray-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer"
                    >
                        Close
                    </button>
                </div>
            </div>
        );
    }

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
                discountType={ctx?.discountType || 'fixed'}
                discountValue={ctx?.discountValue || 0}
                step={ctx?.step || 1}
                cashierNote={ctx?.cashierNote || ''}
                paymentMethod={ctx?.paymentMethod || 'cash'}
                payments={ctx?.payments || []}
                showExtras={ctx?.showExtras || false}
                {...modalHandlers}
            />

            {isPrinting && createPortal(
                <Receipt
                    order={{ ...activeModal.order, items: ctx?.draftItems || [] }}
                    tableName={displayTableName}
                    allTables={allTables}
                    discountType={ctx?.discountType || 'fixed'}
                    discountValue={ctx?.discountValue || 0}
                    paymentMethod={ctx?.paymentMethod || activeModal.order?.payment_method}
                    payments={ctx?.payments || activeModal.order?.payments}
                />,
                document.body
            )}
        </>
    );
};

export default CheckoutManager;
