import React from 'react';
import { useCheckoutLogic } from '../hooks/useCheckoutLogic';

// Sub-components
import CheckoutHeader from '../components/Checkout/CheckoutHeader';
import CheckoutFooter from '../components/Checkout/CheckoutFooter';
import CheckoutItemList from '../components/Checkout/CheckoutItemList';
import CheckoutOrderNote from '../components/Checkout/CheckoutOrderNote';
import StatusPopups from '../components/Checkout/StatusPopups';

export default function Checkout() {
    const {
        tableId,
        navigate,
        activeOrderId,
        isConfirmed,
        isModified,
        selectedItems,
        originalItems,
        allTables,
        tableIdToGroupKey,
        selectedTableId,
        setSelectedTableId,
        mergedTableIds,
        showMergeDropdown,
        setShowMergeDropdown,
        showSuccessPopup,
        successMessage,
        showWarningPopup,
        warningTitle,
        warningMessage,
        setShowWarningPopup,
        isTableChanged,
        isMergeChanged,
        toggleMergedTable,
        total,
        totalQuantity,
        handleUpdateQuantity,
        handleUpdateNote,
        handleUpdateOrderNote,
        orderNote,
        guestCount,
        handleUpdateGuestCount,
        handleCheckout,
        handleCancelOrder,
        isSaving,
        isSplitMode,
        toggleSplitMode,
        selectedSplitItems,
        toggleSplitItem,
        handleUpdateSplitQuantity,
        onConfirmSplit,
        undoSplitData,
        handleUndoSplit
    } = useCheckoutLogic();

    return (
        <div className="mdt-bg-light mdt-checkout-page min-h-screen pb-40 no-print">
            <CheckoutHeader
                isConfirmed={isConfirmed}
                navigate={navigate}
                tableId={tableId}
                selectedTableId={selectedTableId}
                setSelectedTableId={setSelectedTableId}
                allTables={allTables}
                tableIdToGroupKey={tableIdToGroupKey}
                mergedTableIds={mergedTableIds}
                toggleMergedTable={toggleMergedTable}
                showMergeDropdown={showMergeDropdown}
                setShowMergeDropdown={setShowMergeDropdown}
                isDisabled={isModified || isSaving}
            />

            <CheckoutItemList
                selectedItems={selectedItems}
                originalItems={originalItems}
                handleUpdateQuantity={handleUpdateQuantity}
                handleUpdateNote={handleUpdateNote}
                guestCount={guestCount}
                onUpdateGuestCount={handleUpdateGuestCount}
                isSplitMode={isSplitMode}
                selectedSplitItems={selectedSplitItems}
                toggleSplitItem={toggleSplitItem}
                handleUpdateSplitQuantity={handleUpdateSplitQuantity}
            />

            {!isSplitMode && (
                <CheckoutOrderNote
                    orderNote={orderNote}
                    onUpdateOrderNote={handleUpdateOrderNote}
                />
            )}

            <CheckoutFooter
                totalQuantity={totalQuantity}
                total={total}
                isConfirmed={isConfirmed}
                isModified={isModified}
                isTableChanged={isTableChanged}
                isMergeChanged={isMergeChanged}
                handleCancelOrder={handleCancelOrder}
                navigate={navigate}
                tableId={tableId}
                handleCheckout={handleCheckout}
                hasItems={selectedItems.length > 0}
                activeOrderId={activeOrderId}
                isSaving={isSaving}
                isSplitMode={isSplitMode}
                toggleSplitMode={toggleSplitMode}
                selectedSplitItems={selectedSplitItems}
                onConfirmSplit={onConfirmSplit}
            />

            <StatusPopups
                showSuccessPopup={showSuccessPopup}
                successMessage={successMessage}
                showWarningPopup={showWarningPopup}
                warningTitle={warningTitle}
                warningMessage={warningMessage}
                setShowWarningPopup={setShowWarningPopup}
            />

            {undoSplitData && (
                <div className="mdt-undoSplitData fixed top-24 left-1/2 transform -translate-x-1/2 bg-gray-900/95 backdrop-blur-md border border-gray-700 text-white p-3 sm:p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-3 sm:gap-6 z-50 animate-fade-in-down w-[92%] sm:w-auto max-w-[450px]">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path>
                            </svg>
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="font-extrabold text-[13px] sm:text-[15px] text-gray-50 leading-tight truncate">Đã tách đơn hàng</span>
                            <span className="text-[11px] sm:text-[13px] text-gray-400 mt-0.5 truncate">Bạn có thể hoàn tác ngay bây giờ.</span>
                        </div>
                    </div>
                    
                    <button
                        onClick={handleUndoSplit}
                        className="flex-shrink-0 text-amber-950 font-bold bg-amber-400 hover:bg-amber-300 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl text-[13px] sm:text-sm transition-all duration-200 flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0"
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <>
                                <svg className="animate-spin h-4 w-4 text-amber-950" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Xử lý...</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path>
                                </svg>
                                <span>Hoàn tác</span>
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}
