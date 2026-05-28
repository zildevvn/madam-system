import { useState, useEffect, useCallback, useRef } from 'react';
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
    updateGuestCountAsync,
    splitOrderAsync,
    addToCart,
    addCustomToCart
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
        mergedTableIds, setMergedTableIds,
        setShowWarningPopup,
        isTableChanged,
        isMergeChanged,
        guestCount,
        orderNote,
        setWarningTitle, setWarningMessage, setSuccessMessage, setShowSuccessPopup,
        allTables, currentUser
    } = state;

    const [isSaving, setIsSaving] = useState(false);
    const isProcessing = useRef(false);

    // [RULE] Use AbortController and timer tracking for safe unmounting
    const cleanupAbortRef = useRef(new AbortController());
    const timersRef = useRef(new Set());

    useEffect(() => {
        return () => {
            cleanupAbortRef.current.abort();
            timersRef.current.forEach(clearTimeout);
            timersRef.current.clear();
        };
    }, []);

    /**
     * @param {Function} callback
     * @param {number} delay
     */
    const safeSetTimeout = useCallback((callback, delay) => {
        const id = setTimeout(() => {
            timersRef.current.delete(id);
            if (!cleanupAbortRef.current.signal.aborted) {
                callback();
            }
        }, delay);
        timersRef.current.add(id);
        return id;
    }, []);

    // Split Bill State
    const [isSplitMode, setIsSplitMode] = useState(false);
    const [selectedSplitItems, setSelectedSplitItems] = useState([]); // Array of { order_item_id, quantity }

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
        if (activeOrderId) {
            dispatch(updateOrderNoteAsync({ orderId: activeOrderId, note }));
        }
    }, [dispatch, activeOrderId]);

    const handleUpdateGuestCount = useCallback((count) => {
        // [WHY] Allow empty string so user can clear and re-type multi-digit numbers
        dispatch(setGuestCount(count));

        const guestCountNum = Number(count);
        if (!isNaN(guestCountNum) && guestCountNum >= 1 && activeOrderId) {
            dispatch(updateGuestCountAsync({ orderId: activeOrderId, count: guestCountNum }));
        }
    }, [dispatch, activeOrderId]);

    const triggerBackendPrint = useCallback(async (orderId, title) => {
        if (!title) return;
        try {
            await orderApi.print(orderId, title);
        } catch (err) {
            console.error("Printing failed:", err);
            // setWarningMessage('Lỗi kết nối máy in Bar. Vui lòng báo Bar thủ công!');
            // setShowWarningPopup(true);
        }
    }, [setWarningMessage, setShowWarningPopup]);

    const prepareMergedTables = useCallback(() => {
        const finalTableId = selectedTableId.toString();
        const otherIds = mergedTableIds
            .filter(id => id.toString() !== finalTableId)
            .sort((a, b) => a - b);
        const combinedIds = [Number(finalTableId), ...otherIds];
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
                merged_tables: mergedTablesString,
                user_id: currentUser?.id
            })).unwrap();
            currentOrderId = newOrder.id;
            setSuccessMessage('Đơn hàng đã được lưu thành công.');
        } else if (hasChangedTable) {
            await dispatch(updateOrderTableAsync({
                orderId: currentOrderId,
                tableId: finalTableId
            })).unwrap();

            const currentTable = allTables.find(t => t.id.toString() === finalTableId);
            const tableName = currentTable?.name || `Bàn số ${finalTableId}`;
            setSuccessMessage(`Đã chuyển sang ${tableName}`);
        } else {
            setSuccessMessage('Đơn hàng đã được lưu thành công.');
        }
        return currentOrderId;
    }, [selectedTableId, tableId, activeOrderId, dispatch, setSuccessMessage, allTables, currentUser]);

    const checkForDrinkChanges = useCallback((allDrinks) => {
        const hasModifiedDrinks = allDrinks.some(item => {
            // [WHY] item.id is now the unique key (item-ID or numeric product ID)
            const original = originalItems[item.id];
            if (!original) return true;
            return Number(original.quantity) !== Number(item.quantity) ||
                (original.note || '').trim() !== (item.note || '').trim();
        });

        const hasRemovedDrinks = Object.keys(originalItems).some(id => {
            const original = originalItems[id];
            // [WHY] Convert both to strings for strict equality to safely compare string-prefixed vs numeric IDs.
            const stillInCart = selectedItems.some(i => String(i.id) === String(id));
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
        // [WHY] useRef (isProcessing) provides a synchronous guard against race conditions,
        // which useState (isSaving) cannot guarantee because state updates are asynchronous.
        if (isProcessing.current) return;
        isProcessing.current = true;
        setIsSaving(true);

        try {
            const mergedTablesString = prepareMergedTables();
            const currentOrderId = await ensureOrderSynced(mergedTablesString);
            const wasConfirmed = isConfirmed;
            const hasChangedTable = selectedTableId.toString() !== tableId.toString();

            if (isModified || isMergeChanged || !wasConfirmed) {
                const allDrinks = selectedItems.filter(item => item.type === 'drink' && !item.isSplit);
                const hasDrinkChanges = checkForDrinkChanges(allDrinks);
                const isTableMove = wasConfirmed && hasChangedTable;
                const drinkPrintTitle = buildDrinkTitle(hasDrinkChanges, isTableMove, wasConfirmed);

                await dispatch(checkoutOrderAsync({
                    orderId: currentOrderId,
                    items: selectedItems.filter(i => !i.isSplit).map(i => ({
                        product_id: (i.isCustom || i.product_id === null) ? null : (i.product_id || i.id),
                        order_item_id: i.order_item_id || null,
                        name: (i.isCustom || i.product_id === null) ? i.name : undefined,
                        type: (i.isCustom || i.product_id === null) ? i.type : undefined,
                        quantity: i.quantity,
                        price: i.price,
                        note: i.note,
                        table_id: selectedTableId
                    })),
                    mergedTables: mergedTablesString,
                    orderNote: orderNote,
                    guestCount: Number(guestCount) || 1,
                    userId: currentUser?.id
                })).unwrap();

                if (drinkPrintTitle && allDrinks.length > 0) {
                    await triggerBackendPrint(currentOrderId, drinkPrintTitle);
                }

                dispatch(fetchTables());
                setShowSuccessPopup(true);
                safeSetTimeout(() => {
                    setShowSuccessPopup(false);
                    navigate('/staff-order');
                }, 1500);

            } else if (hasChangedTable) {
                const allDrinks = selectedItems.filter(item => item.type === 'drink' && !item.isSplit);
                const drinkPrintTitle = buildDrinkTitle(false, true, wasConfirmed);

                if (drinkPrintTitle && allDrinks.length > 0) {
                    await triggerBackendPrint(currentOrderId, drinkPrintTitle);
                }

                dispatch(clearCart());
                dispatch(fetchTables());
                setShowSuccessPopup(true);
                safeSetTimeout(() => {
                    setShowSuccessPopup(false);
                    navigate('/staff-order');
                }, 1500);
            }
        } catch (error) {
            console.error(error);
            alert("Lỗi Order");
        } finally {
            isProcessing.current = false;
            setIsSaving(false);
        }
    }, [
        prepareMergedTables, ensureOrderSynced, isConfirmed, isModified,
        isMergeChanged, selectedItems, checkForDrinkChanges, selectedTableId,
        tableId, buildDrinkTitle, dispatch, triggerBackendPrint, navigate,
        setShowSuccessPopup, orderNote, guestCount, currentUser
    ]);

    const handleCancelOrder = useCallback(async () => {
        if (activeOrderId) await dispatch(cancelOrderAsync(activeOrderId));
        navigate('/staff-order');
    }, [activeOrderId, dispatch, navigate]);

    const handleSplitOrder = useCallback(async (itemsToSplit) => {
        if (isProcessing.current || !activeOrderId || !itemsToSplit.length) return;
        isProcessing.current = true;
        setIsSaving(true);
        try {
            await dispatch(splitOrderAsync({
                orderId: activeOrderId,
                items: itemsToSplit
            })).unwrap();

            dispatch(fetchTables()); // [NEW] Refresh global table state to reflect the new split order

            setSuccessMessage('Đã tách đơn hàng thành công.');
            setShowSuccessPopup(true);
            safeSetTimeout(() => setShowSuccessPopup(false), 2000);
        } catch (error) {
            console.error(error);
            setWarningTitle('Tách đơn thất bại!');
            setWarningMessage('Vui lòng kiểm tra lại món hoặc thử lại sau!');
            setShowWarningPopup(true);
        } finally {
            isProcessing.current = false;
            setIsSaving(false);
        }
    }, [activeOrderId, dispatch, setSuccessMessage, setShowSuccessPopup, setWarningTitle, setWarningMessage, setShowWarningPopup]);

    const toggleSplitMode = useCallback(() => {
        setIsSplitMode(prev => !prev);
        setSelectedSplitItems([]);
    }, []);

    const toggleSplitItem = useCallback((item) => {
        setSelectedSplitItems(prev => {
            const itemId = item.order_item_id || item.id;
            const existing = prev.find(i => String(i.order_item_id || i.id) === String(itemId));
            if (existing) {
                return prev.filter(i => String(i.order_item_id || i.id) !== String(itemId));
            } else {
                return [...prev, { order_item_id: itemId, quantity: 1 }];
            }
        });
    }, []);

    const handleUpdateSplitQuantity = useCallback((itemId, quantity) => {
        setSelectedSplitItems(prev =>
            prev.map(i => String(i.order_item_id || i.id) === String(itemId) ? { ...i, quantity } : i)
        );
    }, []);

    const onConfirmSplit = useCallback(async () => {
        if (!selectedSplitItems.length) return;

        // Distribute split quantities across individual database order items
        const distributedSplitItems = [];
        
        selectedSplitItems.forEach(splitItem => {
            const splitItemId = splitItem.order_item_id || splitItem.id;
            
            // Find the representative item to get product/note mapping
            const repItem = selectedItems.find(it => String(it.order_item_id || it.id) === String(splitItemId));
            if (!repItem) return;

            // Find all matching items in cart (same product/note or custom name/note)
            const matchingItems = selectedItems.filter(it => {
                if (repItem.product_id) {
                    return it.product_id === repItem.product_id && (it.note || '') === (repItem.note || '');
                } else {
                    return it.name === repItem.name && (it.note || '') === (repItem.note || '');
                }
            });

            // Distribute requested split quantity
            let remainingToSplit = splitItem.quantity;
            for (const it of matchingItems) {
                if (remainingToSplit <= 0) break;
                if (!it.order_item_id) continue; // Skip unsaved drafts

                const availableQty = it.quantity;
                const splitQty = Math.min(availableQty, remainingToSplit);
                
                distributedSplitItems.push({
                    order_item_id: it.order_item_id,
                    quantity: splitQty
                });
                
                remainingToSplit -= splitQty;
            }
        });

        if (distributedSplitItems.length === 0) return;

        await handleSplitOrder(distributedSplitItems);
        setIsSplitMode(false);
        setSelectedSplitItems([]);
    }, [selectedSplitItems, selectedItems, handleSplitOrder]);

    useEffect(() => {
        const handleBeforeUnload = () => {
            if (activeOrderId) navigator.sendBeacon(`/api/orders/${activeOrderId}`);
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [activeOrderId]);

    return {
        ...state,
        isSaving,
        toggleMergedTable,
        handleUpdateQuantity,
        handleUpdateNote,
        handleUpdateOrderNote,
        handleUpdateGuestCount,
        handleCheckout,
        handleCancelOrder,
        handleSplitOrder,
        isSplitMode,
        setIsSplitMode,
        toggleSplitMode,
        selectedSplitItems,
        toggleSplitItem,
        handleUpdateSplitQuantity,
        onConfirmSplit
    };
};
