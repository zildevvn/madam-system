import { useEffect, useCallback } from 'react';
import { useCheckoutState } from './useCheckoutState';
import {
    updateQuantity,
    checkoutOrderAsync,
    cancelOrderAsync,
    updateItemNote,
    removeFromCart,
    updateOrderTableAsync,
    clearCart,
    createOrderAsync,
    setOrderNote,
    updateOrderNoteAsync,
    setGuestCount,
    updateGuestCountAsync
} from '../store/slices/orderSlice';
import { fetchTables } from '../store/slices/tableSlice';
import orderApi from '../services/orderApi';

/**
 * useCheckoutLogic: Encapsulates business logic for table checkout, 
 * including table migration, printing, and multi-table merging.
 * [WHY] Split from useCheckoutState to maintain separate of concerns.
 */
export const useCheckoutLogic = () => {
    const state = useCheckoutState();
    const {
        dispatch, navigate, tableId, activeOrderId, isConfirmed,
        isModified, selectedItems, originalItems, selectedTableId,
        mergedTableIds, setMergedTableIds, showWarningPopup,
        warningMessage,
        setShowWarningPopup,
        isTableChanged,
        isMergeChanged,
        guestCount,
        setWarningMessage, setSuccessMessage, setShowSuccessPopup
    } = state;

    const toggleMergedTable = useCallback((id) => {
        setMergedTableIds(prev =>
            prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
        );
    }, [setMergedTableIds]);

    const handleUpdateQuantity = useCallback((id, newQuantity) => {
        if (newQuantity === 0) {
            dispatch(removeFromCart(id));
        } else {
            dispatch(updateQuantity({ id, quantity: newQuantity }));
        }
    }, [dispatch]);

    const handleUpdateNote = useCallback((id, note) => {
        dispatch(updateItemNote({ id, note }));
    }, [dispatch]);

    // [WHY] Debounce is handled in the UI component. This callback both updates Redux immediately
    // and persists to the backend. If no order exists yet, only the local state is updated.
    const handleUpdateOrderNote = useCallback((note) => {
        dispatch(setOrderNote(note));
        if (state.activeOrderId) {
            dispatch(updateOrderNoteAsync({ orderId: state.activeOrderId, note }));
        }
    }, [dispatch, state.activeOrderId]);

    const handleUpdateGuestCount = useCallback((count) => {
        const guestCountNum = parseInt(count) || 1;
        dispatch(setGuestCount(guestCountNum));
        if (state.activeOrderId) {
            dispatch(updateGuestCountAsync({ orderId: state.activeOrderId, count: guestCountNum }));
        }
    }, [dispatch, state.activeOrderId]);

    const triggerBackendPrint = useCallback(async (orderId, title) => {
        if (!title) return;
        try {
            await orderApi.printDrinks(orderId, title);
        } catch (err) {
            console.error("Printing failed:", err);
            setWarningMessage('Lỗi kết nối máy in Bar. Vui lòng báo Bar thủ công!');
            setShowWarningPopup(true);
        }
    }, [setWarningMessage, setShowWarningPopup]);

    const prepareMergedTables = useCallback(() => {
        const finalTableId = selectedTableId.toString();
        const otherIds = mergedTableIds
            .filter(id => id.toString() !== finalTableId)
            .sort((a, b) => a - b);
        const combinedIds = [parseInt(finalTableId), ...otherIds];
        return combinedIds.length > 1 ? combinedIds.join('-') : null;
    }, [selectedTableId, mergedTableIds]);

    const ensureOrderSynced = useCallback(async (mergedTablesString) => {
        const finalTableId = selectedTableId.toString();
        const currentTableId = tableId.toString();
        const hasChangedTable = finalTableId !== currentTableId;
        let currentOrderId = activeOrderId;

        if (!currentOrderId) {
            const newOrder = await dispatch(createOrderAsync({
                table_id: finalTableId,
                order_type: 'dine-in',
                merged_tables: mergedTablesString
            })).unwrap();
            currentOrderId = newOrder.id;
            setSuccessMessage('Đơn hàng đã được lưu thành công.');
        } else if (hasChangedTable) {
            await dispatch(updateOrderTableAsync({
                orderId: currentOrderId,
                tableId: finalTableId
            })).unwrap();
            setSuccessMessage(`Đã chuyển sang Bàn số ${finalTableId}`);
        } else {
            setSuccessMessage('Đơn hàng đã được lưu thành công.');
        }
        return currentOrderId;
    }, [selectedTableId, tableId, activeOrderId, dispatch, setSuccessMessage]);

    const checkForDrinkChanges = useCallback((allDrinks) => {
        const hasModifiedDrinks = allDrinks.some(item => {
            const original = originalItems[item.id];
            if (!original) return true;
            return Number(original.quantity) !== Number(item.quantity) ||
                (original.note || '').trim() !== (item.note || '').trim();
        });

        const hasRemovedDrinks = Object.keys(originalItems).some(id => {
            const original = originalItems[id];
            const stillInCart = selectedItems.some(i => Number(i.id) === Number(id));
            return original.type === 'drink' && !stillInCart;
        });

        return hasModifiedDrinks || hasRemovedDrinks;
    }, [originalItems, selectedItems]);

    const buildDrinkTitle = useCallback((hasDrinkChanges, isTableMove, wasConfirmed) => {
        if (!hasDrinkChanges && !isTableMove) return null;
        const tableText = selectedTableId.toString().replace(/^Bàn\s+/i, '');
        let title = wasConfirmed ? `Bill doi mon ban so ${tableText}` : '';

        if (isTableMove && wasConfirmed) {
            const oldTable = tableId.toString().replace(/^Bàn\s+/i, '');
            const newTable = selectedTableId.toString().replace(/^Bàn\s+/i, '');
            title = `Bill Chuyen Ban - Tu Ban ${oldTable} den Ban ${newTable}`;
        }
        return title;
    }, [selectedTableId, tableId]);

    const handleCheckout = useCallback(async () => {
        try {
            const mergedTablesString = prepareMergedTables();
            const currentOrderId = await ensureOrderSynced(mergedTablesString);
            const wasConfirmed = isConfirmed;
            const hasChangedTable = selectedTableId.toString() !== tableId.toString();

            if (isModified || isMergeChanged || !wasConfirmed) {
                const allDrinks = selectedItems.filter(item => item.type === 'drink');
                const hasDrinkChanges = checkForDrinkChanges(allDrinks);
                const isTableMove = wasConfirmed && hasChangedTable;
                const drinkPrintTitle = buildDrinkTitle(hasDrinkChanges, isTableMove, wasConfirmed);

                await dispatch(checkoutOrderAsync({
                    orderId: currentOrderId,
                    items: selectedItems.map(i => ({
                        product_id: i.id,
                        quantity: i.quantity,
                        price: i.price,
                        note: i.note,
                        table_id: selectedTableId
                    })),
                    mergedTables: mergedTablesString,
                    orderNote: state.orderNote,
                    guestCount: state.guestCount
                })).unwrap();

                if (drinkPrintTitle && allDrinks.length > 0) {
                    triggerBackendPrint(currentOrderId, drinkPrintTitle);
                }

                dispatch(fetchTables());
                setShowSuccessPopup(true);
                setTimeout(() => {
                    setShowSuccessPopup(false);
                    navigate('/staff-order');
                }, 1500);

            } else if (hasChangedTable) {
                const allDrinks = selectedItems.filter(item => item.type === 'drink');
                const drinkPrintTitle = buildDrinkTitle(false, true, wasConfirmed);

                if (drinkPrintTitle && allDrinks.length > 0) {
                    triggerBackendPrint(currentOrderId, drinkPrintTitle);
                }

                dispatch(clearCart());
                dispatch(fetchTables());
                setShowSuccessPopup(true);
                setTimeout(() => {
                    setShowSuccessPopup(false);
                    navigate('/staff-order');
                }, 1500);
            }
        } catch (error) {
            console.error(error);
            alert("Lỗi Order");
        }
    }, [prepareMergedTables, ensureOrderSynced, isConfirmed, isModified, isMergeChanged, selectedItems, checkForDrinkChanges, selectedTableId, tableId, buildDrinkTitle, dispatch, triggerBackendPrint, navigate, setShowSuccessPopup]);

    const handleCancelOrder = useCallback(async () => {
        if (activeOrderId) await dispatch(cancelOrderAsync(activeOrderId));
        navigate('/staff-order');
    }, [activeOrderId, dispatch, navigate]);

    useEffect(() => {
        const handleBeforeUnload = () => {
            if (activeOrderId) navigator.sendBeacon(`/api/orders/${activeOrderId}`);
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [activeOrderId]);

    return {
        ...state,
        toggleMergedTable,
        handleUpdateQuantity,
        handleUpdateNote,
        handleUpdateOrderNote,
        handleUpdateGuestCount,
        handleCheckout,
        handleCancelOrder
    };
};
