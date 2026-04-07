import React, { useState } from 'react';
import ActiveOrderTableList from '../components/ActiveOrderTableList';
import { useConsolidatedOrders } from '../hooks/useConsolidatedOrders';
import Receipt from '../components/Receipt';
import PaymentModal from '../components/PaymentModal';

const Cashier = () => {
    const {
        activeTablesToDisplay,
        orderDict,
        currentTime,
        allTables,
        status,
        error
    } = useConsolidatedOrders(null, true);

    const [selectedTable, setSelectedTable] = useState(null);
    const [tableContexts, setTableContexts] = useState({}); // { [tableId]: { step, discountType, discountValue, draftItems } }

    const handleTableClick = (table) => {
        const tableIdStr = table.id.toString();
        const currentOrder = orderDict[tableIdStr];

        // Initialize context for this table if it doesn't already exist
        if (!tableContexts[tableIdStr]) {
            setTableContexts(prev => ({
                ...prev,
                [tableIdStr]: {
                    step: 1,
                    discountType: 'fixed',
                    discountValue: 0,
                    draftItems: currentOrder ? [...currentOrder.items] : []
                }
            }));
        }
        setSelectedTable(table);
    };

    const updateTableContext = (tableId, updates) => {
        setTableContexts(prev => ({
            ...prev,
            [tableId]: {
                ...(prev[tableId] || {}),
                ...updates
            }
        }));
    };

    const handlePaymentSuccess = () => {
        if (selectedTable) {
            const tableId = selectedTable.id.toString();
            setTableContexts(prev => {
                const newState = { ...prev };
                delete newState[tableId];
                return newState;
            });
        }
        setSelectedTable(null);
    };

    if (status === 'loading' && allTables.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    const currentTableId = selectedTable?.id.toString();
    const currentContext = currentTableId ? tableContexts[currentTableId] : null;
    const currentOrder = currentTableId ? orderDict[currentTableId] : null;

    return (
        <div className="cashier-page md-management-page pb-20">
            <div className="md-management-page__content py-8">
                <div className="w-full max-w-[1200px] mx-auto px-[20px] flex flex-col gap-6">
                    <div className="cashier-page__list-tables bg-gray-50/50 rounded-3xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
                        <ActiveOrderTableList
                            title="Bàn đang có khách"
                            tables={activeTablesToDisplay}
                            orders={orderDict}
                            currentTime={currentTime}
                            onTableClick={handleTableClick}
                            showSimpleView={true}
                        />
                    </div>
                </div>
            </div>

            {/* Payment Popup Modal */}
            {selectedTable && currentContext && (
                <PaymentModal
                    selectedTable={selectedTable}
                    currentOrder={currentOrder}
                    onClose={() => setSelectedTable(null)}
                    onPaymentSuccess={handlePaymentSuccess}
                    
                    // Controlled Props from context
                    draftItems={currentContext.draftItems}
                    onUpdateDraftItems={(items) => updateTableContext(currentTableId, { draftItems: items })}
                    
                    discountType={currentContext.discountType}
                    onUpdateDiscountType={(type) => updateTableContext(currentTableId, { discountType: type })}
                    
                    discountValue={currentContext.discountValue}
                    onUpdateDiscountValue={(val) => updateTableContext(currentTableId, { discountValue: val })}
                    
                    step={currentContext.step}
                    onUpdateStep={(s) => updateTableContext(currentTableId, { step: s })}
                />
            )}

            {/* Hidden Print Area */}
            {selectedTable && currentOrder && currentContext && (
                <div className="hidden-print">
                    <Receipt
                        order={currentOrder}
                        tableName={selectedTable?.name}
                        discountType={currentContext.discountType}
                        discountValue={currentContext.discountValue}
                    />
                </div>
            )}
        </div>
    );
};

export default Cashier;
