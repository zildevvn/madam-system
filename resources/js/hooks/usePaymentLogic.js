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
    const [isProcessing, setIsProcessing] = useState(false);

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
        return selectedTable?.id;
    });

    // Fetch products for "Add new items"
    useEffect(() => {
        productService.getProducts().then(res => setAllProducts(res.data)).catch(console.error);
    }, []);

    const draftTotal = useMemo(() => {
        return draftItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    }, [draftItems]);

    const discountAmount = useMemo(() => {
        if (!discountValue || discountValue <= 0) return 0;
        if (discountType === 'percent') {
            return Math.min(draftTotal, (draftTotal * discountValue) / 100);
        }
        return Math.min(draftTotal, discountValue);
    }, [discountType, discountValue, draftTotal]);

    const finalTotal = useMemo(() => {
        return Math.max(0, draftTotal - discountAmount);
    }, [draftTotal, discountAmount]);

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
                            table_id: i.tableId || currentOrder.tableId
                        })),
                        currentOrder?.mergedTables || selectedTable.merged_tables || null
                    );
                }

                // 2. Complete payment for ALL related orders
                for (const orderId of orderIds) {
                    await orderApi.completeOrder(orderId, paymentMethod, discountType, discountValue, cashierNote);
                }
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
        let newItems;
        if (quantity < 1) {
            newItems = draftItems.filter(i =>
                !((i.product_id || i.id) === productId && (i.tableId || selectedTable.id) === tableId)
            );
        } else {
            newItems = draftItems.map(i =>
                ((i.product_id || i.id) === productId && (i.tableId || selectedTable.id) === tableId)
                    ? { ...i, quantity }
                    : i
            );
        }
        onUpdateDraftItems(newItems);
    }, [draftItems, selectedTable.id, onUpdateDraftItems]);

    const handleUpdateNote = useCallback((productId, tableId, note) => {
        const newItems = draftItems.map(i =>
            ((i.product_id || i.id) === productId && (i.tableId || selectedTable.id) === tableId)
                ? { ...i, note }
                : i
        );
        onUpdateDraftItems(newItems);
    }, [draftItems, selectedTable.id, onUpdateDraftItems]);

    const handleAddProduct = useCallback((product) => {
        const activeTId = targetTableId || selectedTable.id;
        const existing = draftItems.find(i =>
            (i.product_id || i.id) === product.id &&
            (i.tableId || selectedTable.id) === activeTId
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

    return {
        paymentMethod,
        setPaymentMethod,
        isProcessing,
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
        handleAddProduct,
        filteredProducts
    };
};
