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
        onConfirmSplit
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
        </div>
    );
}
