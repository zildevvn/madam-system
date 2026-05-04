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
        handleSplitOrder,
        isSaving
    } = useCheckoutLogic();

    const [isSplitMode, setIsSplitMode] = React.useState(false);
    const [splitItems, setSplitItems] = React.useState([]); // Array of { order_item_id, quantity, product_id }

    const toggleSplitItem = React.useCallback((item) => {
        setSplitItems(prev => {
            // [FIX] Use order_item_id as the primary unique key to prevent data corruption
            // when multiple identical products exist with different notes/modifiers.
            const itemKey = item.order_item_id || item.id;
            const existing = prev.find(i => (i.order_item_id || i.product_id) === itemKey);
            
            if (existing) {
                return prev.filter(i => (i.order_item_id || i.product_id) !== itemKey);
            } else {
                return [...prev, { 
                    order_item_id: item.order_item_id, 
                    quantity: item.quantity, 
                    product_id: item.id 
                }];
            }
        });
    }, []);

    const confirmSplit = async () => {
        if (splitItems.length === 0) return;
        await handleSplitOrder(splitItems.map(({ order_item_id, quantity }) => ({ order_item_id, quantity })));
        setIsSplitMode(false);
        setSplitItems([]);
    };

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
                handleUpdateQuantity={handleUpdateQuantity}
                handleUpdateNote={handleUpdateNote}
                guestCount={guestCount}
                onUpdateGuestCount={handleUpdateGuestCount}
                isSplitMode={isSplitMode}
                splitItems={splitItems}
                onToggleSplitItem={toggleSplitItem}
            />

            <CheckoutOrderNote
                orderNote={orderNote}
                onUpdateOrderNote={handleUpdateOrderNote}
            />

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
                isSplitMode={isSplitMode}
                setIsSplitMode={setIsSplitMode}
                splitItemsCount={splitItems.length}
                onConfirmSplit={confirmSplit}
                isSaving={isSaving}
            />

            <StatusPopups
                showSuccessPopup={showSuccessPopup}
                successMessage={successMessage}
                showWarningPopup={showWarningPopup}
                warningMessage={warningMessage}
                setShowWarningPopup={setShowWarningPopup}
            />
        </div>
    );
}
