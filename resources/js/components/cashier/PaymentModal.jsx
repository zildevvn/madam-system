import React, { useState } from 'react';
import { usePaymentLogic } from '../../hooks/usePaymentLogic';
import PaymentItemEditor from './PaymentItemEditor';
import PaymentModalFooter from './PaymentModalFooter';

/**
 * PaymentModal: Full-screen modal for reviewing items, applying discounts,
 * adding cashier notes, and completing payment for a table or group order.
 * [WHY] Delegates all payment logic to usePaymentLogic hook (README Component Rule).
 */
const PaymentModal = ({
    selectedTable,
    currentOrder,
    allTables = [],
    onClose,
    onPaymentSuccess,
    draftItems = [],
    onUpdateDraftItems,
    discountType = 'fixed',
    onUpdateDiscountType,
    discountValue = 0,
    onUpdateDiscountValue,
    step = 1,
    onUpdateStep,
    cashierNote = '',
    onUpdateCashierNote,
    paymentMethod,
    onUpdatePaymentMethod,
    showExtras = false,
    onUpdateShowExtras,
    isHistoryEdit = false,
    isLoading = false
}) => {
    const {
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
        handleUpdateItemDiscount,
        handleAddProduct,
        filteredProducts,
        itemDiscountsTotal,
        isSplitMode,
        setIsSplitMode,
        selectedSplitItems,
        handleSplitOrder,
        toggleSplitItem,
        handleUpdateSplitQuantity,
        handleCancelTable,
        handlePrintInvoice
    } = usePaymentLogic({
        selectedTable,
        currentOrder,
        onPaymentSuccess,
        draftItems,
        onUpdateDraftItems,
        discountType,
        discountValue,
        cashierNote,
        paymentMethod,
        setPaymentMethod: onUpdatePaymentMethod,
        isHistoryEdit
    });


    if (!selectedTable) return null;

    const tableName = (() => {
        // [RULE] Prioritize the consolidated tableName from the order object (e.g. "44-45-46")
        if (currentOrder?.tableName) {
            return currentOrder.tableName.replace(/^Bàn\s+/i, '');
        }

        // [FALLBACK] Single table resolution
        return (selectedTable.name || selectedTable.id.toString())
            .replace(/^Bàn\s+/i, '');
    })();

    const totalQty = draftItems.reduce((s, i) => s + i.quantity, 0);

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 no-print">
            <div className="bg-white rounded-t-[32px] sm:rounded-[24px] w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[95vh] sm:max-h-[88vh]">

                {/* ─── HEADER: Compact ─── */}
                <div className="px-5 py-3 flex items-center justify-between border-b border-gray-100 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                            <svg className="w-[18px] h-[18px] text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="m-0 text-[9px] font-bold uppercase tracking-widest text-gray-400">Hóa đơn</p>
                            <h4 className="label-table m-0 !text-[17px] font-black text-gray-900 leading-tight">
                                Bàn {tableName}
                            </h4>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {currentOrder && !isHistoryEdit && (
                            <button
                                onClick={handleCancelTable}
                                disabled={isProcessing}
                                className="px-3 h-8 flex items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors border-none cursor-pointer text-[10px] font-bold uppercase tracking-widest disabled:opacity-50"
                                title="Hủy bàn"
                            >
                                Hủy Bàn
                            </button>
                        )}
                        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors border-none cursor-pointer text-gray-500">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
                        </button>
                    </div>
                </div>

                {/* ─── ITEM LIST: Scrollable ─── */}
                {isLoading ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                        <div className="w-12 h-12 border-4 border-orange-100 border-t-orange-500 rounded-full animate-spin mb-4"></div>
                        <p className="text-gray-500 font-medium">Đang cập nhật dữ liệu hóa đơn...</p>
                    </div>
                ) : (
                    <PaymentItemEditor
                        selectedTable={selectedTable}
                        currentOrder={currentOrder}
                        allTables={allTables}
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
                        handleUpdateItemDiscount={handleUpdateItemDiscount}
                        handleAddProduct={handleAddProduct}
                        filteredProducts={filteredProducts}
                        compact={true}
                        isReadOnly={isHistoryEdit}
                        isSplitMode={isSplitMode}
                        selectedSplitItems={selectedSplitItems}
                        onToggleSplitItem={toggleSplitItem}
                        onUpdateSplitQuantity={handleUpdateSplitQuantity}
                    />
                )}

                {/* ─── FOOTER: Extracted ─── */}
                <PaymentModalFooter
                    showExtras={showExtras}
                    setShowExtras={onUpdateShowExtras}
                    discountType={discountType}
                    onUpdateDiscountType={onUpdateDiscountType}
                    discountValue={discountValue}
                    onUpdateDiscountValue={onUpdateDiscountValue}
                    cashierNote={cashierNote}
                    onUpdateCashierNote={onUpdateCashierNote}
                    discountAmount={discountAmount}
                    itemDiscountsTotal={itemDiscountsTotal}
                    draftTotal={draftTotal}
                    finalTotal={finalTotal}
                    totalQty={totalQty}
                    step={step}
                    onUpdateStep={onUpdateStep}
                    paymentMethod={paymentMethod}
                    setPaymentMethod={onUpdatePaymentMethod}
                    isProcessing={isProcessing}
                    handlePayment={handlePayment}
                    isGroup={!!currentOrder?.isGroup}
                    draftItemsCount={draftItems.length}
                    isHistoryEdit={isHistoryEdit}
                    isSplitMode={isSplitMode}
                    setIsSplitMode={setIsSplitMode}
                    selectedSplitItemsCount={selectedSplitItems.length}
                    handleSplitOrder={handleSplitOrder}
                />
            </div>
        </div>
    );
};

export default PaymentModal;
