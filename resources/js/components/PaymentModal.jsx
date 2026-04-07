import React, { useState, useEffect, useMemo } from 'react';
import productService from '../services/productService';
import orderApi from '../services/orderApi';
import PaymentItemEditor from './PaymentItemEditor';
import PaymentMethodSelector from './PaymentMethodSelector';

const PaymentModal = ({
    selectedTable,
    currentOrder,
    onClose,
    onPaymentSuccess,
    discountType,
    setDiscountType,
    discountValue,
    setDiscountValue
}) => {
    const [step, setStep] = useState(1); // 1: Preview, 2: Payment
    const [paymentMethod, setPaymentMethod] = useState(null); // 'bank' | 'card' | 'cash'
    const [isProcessing, setIsProcessing] = useState(false);

    // Local editing state
    const [draftItems, setDraftItems] = useState(currentOrder ? [...currentOrder.items] : []);
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

    const handlePayment = async () => {
        if (!currentOrder || !paymentMethod || isProcessing) return;

        setIsProcessing(true);
        try {
            // 1. Persist changes to DB if draft items changed
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

            // 2. Complete payment with discount info
            await orderApi.completeOrder(currentOrder.id, paymentMethod, discountType, discountValue);
            onPaymentSuccess();
        } catch (err) {
            console.error('Payment failed:', err);
            alert('Có lỗi xảy ra khi thanh toán. Vui lòng thử lại.');
        } finally {
            setIsProcessing(false);
        }
    };
    const handleUpdateQuantity = (productId, tableId, quantity) => {
        if (quantity < 1) {
            setDraftItems(prev => prev.filter(i =>
                !((i.product_id || i.id) === productId && (i.tableId || selectedTable.id) === tableId)
            ));
        } else {
            setDraftItems(prev => prev.map(i =>
                ((i.product_id || i.id) === productId && (i.tableId || selectedTable.id) === tableId)
                    ? { ...i, quantity }
                    : i
            ));
        }
    };

    const handleUpdateNote = (productId, tableId, note) => {
        setDraftItems(prev => prev.map(i =>
            ((i.product_id || i.id) === productId && (i.tableId || selectedTable.id) === tableId)
                ? { ...i, note }
                : i
        ));
    };

    const handleAddProduct = (product) => {
        const activeTId = targetTableId || selectedTable.id;
        const existing = draftItems.find(i =>
            (i.product_id || i.id) === product.id &&
            (i.tableId || selectedTable.id) === activeTId
        );

        if (existing) {
            setDraftItems(prev => prev.map(i =>
                (i === existing) ? { ...i, quantity: i.quantity + 1 } : i
            ));
        } else {
            setDraftItems(prev => [...prev, {
                id: product.id,
                product_id: product.id,
                name: product.name,
                price: product.price,
                quantity: 1,
                note: '',
                tableId: activeTId
            }]);
        }
        setShowProductSearch(false);
        setSearchQuery('');
    };
    const filteredProducts = useMemo(() => {
        if (!searchQuery) return [];
        const query = searchQuery.toLowerCase();
        return allProducts.filter(p => p.name.toLowerCase().includes(query)).slice(0, 5);
    }, [allProducts, searchQuery]);

    if (!selectedTable) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="bg-white rounded-t-[32px] sm:rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[95vh] sm:max-h-[90vh]">
                {/* Header */}
                <div className="px-6 py-3 flex items-center justify-between border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center shrink-0">
                            <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="m-0 text-[10px] font-bold uppercase tracking-widest text-gray-400">Hóa đơn thanh toán</p>
                            <h4 className="m-0 !text-[18px] font-black text-gray-900">
                                Bàn {(currentOrder?.mergedTables || selectedTable.name || selectedTable.id.toString()).replace(/^Bàn\s+/i, '')}
                            </h4>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors border-none cursor-pointer text-gray-500">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
                    </button>
                </div>

                <PaymentItemEditor
                    selectedTable={selectedTable}
                    currentOrder={currentOrder}
                    draftItems={draftItems}
                    allProducts={allProducts}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    showProductSearch={showProductSearch}
                    setShowProductSearch={setShowProductSearch}
                    targetTableId={targetTableId}
                    setTargetTableId={setTargetTableId}
                    handleUpdateQuantity={handleUpdateQuantity}
                    handleUpdateNote={handleUpdateNote}
                    handleAddProduct={handleAddProduct}
                    filteredProducts={filteredProducts}
                />

                {/* Discount Section */}
                <div className="px-6 py-3 border-t border-gray-50">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Giảm giá</span>
                        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                            <button
                                onClick={() => setDiscountType('fixed')}
                                className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${discountType === 'fixed' ? 'bg-white text-orange-500 shadow-sm' : 'text-gray-400'}`}
                            >
                                VNĐ
                            </button>
                            <button
                                onClick={() => setDiscountType('percent')}
                                className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${discountType === 'percent' ? 'bg-white text-orange-500 shadow-sm' : 'text-gray-400'}`}
                            >
                                %
                            </button>
                        </div>
                    </div>
                    <div className="relative">
                        <input
                            type="number"
                            value={discountValue || ''}
                            onChange={(e) => setDiscountValue(Math.max(0, parseFloat(e.target.value) || 0))}
                            placeholder="Nhập mức giảm..."
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-700 outline-none focus:border-orange-200 transition-colors"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 font-bold text-xs uppercase">
                            {discountType === 'percent' ? '%' : 'vnđ'}
                        </div>
                    </div>
                </div>

                {/* Total Row */}
                <div className="mx-3 flex flex-col bg-orange-50 rounded-2xl px-4 py-3 gap-1">
                    {discountAmount > 0 && (
                        <div className="flex justify-between items-center opacity-60">
                            <span className="text-xs font-bold text-gray-600">Tạm tính</span>
                            <span className="text-xs font-bold text-gray-600 line-through">{draftTotal.toLocaleString()}đ</span>
                        </div>
                    )}
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-700 text-sm">Tổng cộng</span>
                            {draftItems.length > 0 && (
                                <span className="text-[10px] font-black text-orange-500 bg-orange-100 px-2 py-0.5 rounded-full">
                                    {draftItems.reduce((s, i) => s + i.quantity, 0)} món
                                </span>
                            )}
                        </div>
                        <span className="text-xl font-black text-orange-500">{finalTotal.toLocaleString()}đ</span>
                    </div>
                    {discountAmount > 0 && (
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-orange-400">Đã giảm</span>
                            <span className="text-[10px] font-bold text-orange-400">-{discountAmount.toLocaleString()}đ</span>
                        </div>
                    )}
                </div>

                {step === 2 && <PaymentMethodSelector paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod} />}

                {/* Actions */}
                <div className="px-6 pb-6 pt-4 grid grid-cols-2 gap-3">
                    <button onClick={() => window.print()} className="btn-print mdt-btn !bg-gray-100 !text-gray-500 rounded-xl font-bold hover:bg-gray-200 transition-colors cursor-pointer border-none">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2m8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                        In hóa đơn
                    </button>

                    {step === 1 ? (
                        <button disabled={draftItems.length === 0} onClick={() => setStep(2)} className={`mdt-btn cursor-pointer ${draftItems.length === 0 ? '!bg-gray-200 !text-gray-400 shadow-none cursor-not-allowed' : ''}`}>
                            Tiếp theo
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                        </button>
                    ) : (
                        <button disabled={draftItems.length === 0 || !paymentMethod || isProcessing} onClick={handlePayment} className={`mdt-btn cursor-pointer ${(draftItems.length === 0 || !paymentMethod || isProcessing) ? 'btn-confirm !bg-gray-200 !text-gray-400 shadow-none cursor-not-allowed' : ''}`}>
                            {isProcessing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>}
                            {isProcessing ? 'Đang xử lý...' : 'Xác Nhận'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;
