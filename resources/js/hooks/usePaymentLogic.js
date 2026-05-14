import { useState, useEffect, useMemo, useCallback } from 'react';
import productService from '../services/productService';
import orderApi from '../services/orderApi';

/**
 * usePaymentLogic: Encapsulates all payment-related state and handlers for the Cashier modal.
 * [WHY] Tách UI và logic — keeps PaymentModal focused on rendering.
 * @param {Object} params - Payment context from the parent component
 * @returns {Object} Payment state, totals, and handler functions
 */
export const usePaymentLogic = ({
    selectedTable,
    currentOrder,
    onPaymentSuccess,
    draftItems,
    onUpdateDraftItems,
    discountType,
    discountValue,
    cashierNote,
    isHistoryEdit = false,
    paymentMethod,
    setPaymentMethod
}) => {
    // [WHY] Centralized table resolution logic to ensure consistent ID identification across all handlers.
    const dbTableId = useMemo(() => 
        selectedTable?.originalTableId || 
        currentOrder?.tableId || 
        currentOrder?.table_id || 
        currentOrder?.table?.id
    , [selectedTable, currentOrder]);

    const [isProcessing, setIsProcessing] = useState(false);
    const [isSplitMode, setIsSplitMode] = useState(false);
    const [selectedSplitItems, setSelectedSplitItems] = useState([]); // Array of { order_item_id, quantity }

    // Metadata state (still local as they are transient UI helpers)
    const [allProducts, setAllProducts] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showProductSearch, setShowProductSearch] = useState(false);
    const [targetTableId, setTargetTableId] = useState(() => {
        // [WHY] For group orders, default to the first table in the reservation
        // so the table selector's first button is active on open.
        const tableIds = currentOrder?.reservation?.table_ids;
        if (currentOrder?.reservation?.type === 'group' && Array.isArray(tableIds) && tableIds.length > 0) {
            return Number([...tableIds].sort((a, b) => Number(a) - Number(b))[0]);
        }
        // [FIX] Ensure we use the database table ID (not the order lookup key)
        return dbTableId || selectedTable?.id;
    });

    // Fetch products for "Add new items"
    useEffect(() => {
        productService.getProducts().then(res => setAllProducts(res.data)).catch(console.error);
    }, []);

    const itemDiscountsTotal = useMemo(() => {
        return draftItems.reduce((sum, i) => {
            const val = Number(i.discount || 0);
            const type = i.discountType || 'fixed';
            const itemGross = i.price * i.quantity;

            if (type === 'percent') {
                return sum + (itemGross * val / 100);
            }
            return sum + (val * i.quantity);
        }, 0);
    }, [draftItems]);

    const draftTotal = useMemo(() => {
        return draftItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    }, [draftItems]);

    const discountAmount = useMemo(() => {
        if (!discountValue || discountValue <= 0) return 0;
        // Global discount applies to the total AFTER item discounts have been applied
        const remainingTotal = Math.max(0, draftTotal - itemDiscountsTotal);
        if (discountType === 'percent') {
            return Math.min(remainingTotal, (remainingTotal * discountValue) / 100);
        }
        return Math.min(remainingTotal, discountValue);
    }, [discountType, discountValue, draftTotal, itemDiscountsTotal]);

    const finalTotal = useMemo(() => {
        return Math.max(0, draftTotal - itemDiscountsTotal - discountAmount);
    }, [draftTotal, itemDiscountsTotal, discountAmount]);

    const handlePayment = useCallback(async () => {
        if (!currentOrder || !paymentMethod || isProcessing) return;

        setIsProcessing(true);
        try {
            if (isHistoryEdit) {
                // [WHY] History edit only updates payment details, no item checkout required
                await orderApi.updatePayment(currentOrder.id, {
                    payment_method: paymentMethod,
                    discount_type: discountType,
                    discount_value: discountValue,
                    cashier_note: cashierNote
                });
            } else {
                // [WHY] relatedOrderIds contains all order IDs merged into a unified group view.
                // We must complete each one to properly close the group + individual extras.
                const orderIds = currentOrder.relatedOrderIds || [currentOrder.id];

                // 1. Persist changes to DB if draft items changed (Skip for pure group reservations which are read-only)
                if (!currentOrder.isGroup) {
                    await orderApi.checkoutOrder(
                        currentOrder.id,
                        draftItems.map(i => ({
                            product_id: i.product_id || i.id,
                            quantity: i.quantity,
                            price: i.price,
                            note: i.note,
                            discount: i.discount || 0,
                            discount_type: i.discountType || 'fixed', // [NEW] Pass type to backend
                            table_id: i.tableId || currentOrder.tableId
                        })),
                        currentOrder?.mergedTables || selectedTable.merged_tables || null
                    );
                }

                // 2. Complete payment for ALL related orders in ONE atomic call
                const relatedIds = currentOrder.relatedOrderIds || [currentOrder.id];
                await orderApi.completeOrder(
                    currentOrder.id,
                    paymentMethod,
                    discountType,
                    discountValue,
                    cashierNote,
                    relatedIds
                );
            }

            onPaymentSuccess();
        } catch (err) {
            console.error('Payment failed:', err);
            alert('Có lỗi xảy ra khi cập nhật. Vui lòng thử lại.');
        } finally {
            setIsProcessing(false);
        }
    }, [currentOrder, paymentMethod, isProcessing, draftItems, selectedTable, discountType, discountValue, cashierNote, onPaymentSuccess, isHistoryEdit]);

    const handleUpdateQuantity = useCallback((productId, tableId, quantity) => {
        const fallbackTId = dbTableId || selectedTable?.id;
        let newItems;
        if (quantity < 1) {
            newItems = draftItems.filter(i =>
                !((i.product_id || i.id) === productId && (i.tableId || fallbackTId) === tableId)
            );
        } else {
            newItems = draftItems.map(i =>
                ((i.product_id || i.id) === productId && (i.tableId || fallbackTId) === tableId)
                    ? { ...i, quantity }
                    : i
            );
        }
        onUpdateDraftItems(newItems);
    }, [draftItems, selectedTable, dbTableId, onUpdateDraftItems]);

    const handleUpdateNote = useCallback((productId, tableId, note) => {
        const fallbackTId = dbTableId || selectedTable?.id;
        const newItems = draftItems.map(i =>
            ((i.product_id || i.id) === productId && (i.tableId || fallbackTId) === tableId)
                ? { ...i, note }
                : i
        );
        onUpdateDraftItems(newItems);
    }, [draftItems, selectedTable, dbTableId, onUpdateDraftItems]);

    const handleUpdateItemDiscount = useCallback((productId, tableId, updates) => {
        const fallbackTId = dbTableId || selectedTable?.id;
        const newItems = draftItems.map(i =>
            ((i.product_id || i.id) === productId && (i.tableId || fallbackTId) === tableId)
                ? { ...i, ...updates }
                : i
        );
        onUpdateDraftItems(newItems);
    }, [draftItems, selectedTable, dbTableId, onUpdateDraftItems]);

    const handleAddProduct = useCallback((product) => {
        const activeTId = targetTableId || dbTableId || selectedTable?.id;
        const existing = draftItems.find(i =>
            (i.product_id || i.id) === product.id &&
            (i.tableId || activeTId) === activeTId
        );

        let newItems;
        if (existing) {
            newItems = draftItems.map(i =>
                (i === existing) ? { ...i, quantity: i.quantity + 1 } : i
            );
        } else {
            newItems = [...draftItems, {
                id: product.id,
                product_id: product.id,
                name: product.name,
                price: product.price,
                quantity: 1,
                note: '',
                discount: 0,
                discountType: 'fixed',
                tableId: activeTId
            }];
        }
        onUpdateDraftItems(newItems);
        setShowProductSearch(false);
        setSearchQuery('');
    }, [draftItems, targetTableId, selectedTable.id, onUpdateDraftItems]);

    const filteredProducts = useMemo(() => {
        if (!searchQuery) return [];
        const query = searchQuery.toLowerCase();
        return allProducts.filter(p => p.name.toLowerCase().includes(query)).slice(0, 5);
    }, [allProducts, searchQuery]);

    const handleSplitOrder = useCallback(async () => {
        if (!currentOrder || selectedSplitItems.length === 0 || isProcessing) return;

        setIsProcessing(true);
        try {
            const response = await orderApi.splitOrder(currentOrder.id, selectedSplitItems);
            setIsSplitMode(false);
            setSelectedSplitItems([]);
            // [WHY] Refresh data after split
            onPaymentSuccess(response.data.new_order);
            return response.data;
        } catch (err) {
            console.error('Split failed:', err);
            alert('Có lỗi xảy ra khi tách đơn. Vui lòng thử lại.');
        } finally {
            setIsProcessing(false);
        }
    }, [currentOrder, selectedSplitItems, isProcessing, onPaymentSuccess]);

    const toggleSplitItem = useCallback((item) => {
        setSelectedSplitItems(prev => {
            const itemId = item.order_item_id || item.id;
            const existing = prev.find(i => i.order_item_id === itemId);
            if (existing) {
                return prev.filter(i => i.order_item_id !== itemId);
            } else {
                // [WHY] Initialize with the full quantity of the item
                return [...prev, { order_item_id: itemId, quantity: item.quantity }];
            }
        });
    }, []);

    const handleUpdateSplitQuantity = useCallback((itemId, quantity) => {
        setSelectedSplitItems(prev =>
            prev.map(i => i.order_item_id === itemId ? { ...i, quantity } : i)
        );
    }, []);

    return {
        paymentMethod,
        setPaymentMethod,
        isProcessing,
        isSplitMode,
        setIsSplitMode,
        selectedSplitItems,
        handleSplitOrder,
        toggleSplitItem,
        handleUpdateSplitQuantity,
        allProducts,
        searchQuery,
        setSearchQuery,
        showProductSearch,
        setShowProductSearch,
        targetTableId,
        setTargetTableId,
        draftTotal,
        discountAmount,
        finalTotal,
        handlePayment,
        handleUpdateQuantity,
        handleUpdateNote,
        handleUpdateItemDiscount,
        handleAddProduct,
        filteredProducts
    };
};
