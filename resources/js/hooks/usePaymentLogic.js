import { useState, useEffect, useMemo, useCallback } from 'react';
import productService from '../services/productService';
import orderApi from '../services/orderApi';

export const usePaymentLogic = ({
    selectedTable,
    currentOrder,
    onPaymentSuccess,
    draftItems,
    onUpdateDraftItems,
    discountType,
    discountValue
}) => {
    const [paymentMethod, setPaymentMethod] = useState(null); // 'bank' | 'card' | 'cash'
    const [isProcessing, setIsProcessing] = useState(false);

    // Metadata state (still local as they are transient UI helpers)
    const [allProducts, setAllProducts] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showProductSearch, setShowProductSearch] = useState(false);
    const [targetTableId, setTargetTableId] = useState(selectedTable?.id);

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
            // 1. Persist changes to DB if draft items changed (Skip for group reservations which are read-only and lack product_ids)
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

            // 2. Complete payment with discount info
            await orderApi.completeOrder(currentOrder.id, paymentMethod, discountType, discountValue);
            onPaymentSuccess();
        } catch (err) {
            console.error('Payment failed:', err);
            alert('Có lỗi xảy ra khi thanh toán. Vui lòng thử lại.');
        } finally {
            setIsProcessing(false);
        }
    }, [currentOrder, paymentMethod, isProcessing, draftItems, selectedTable, discountType, discountValue, onPaymentSuccess]);

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
