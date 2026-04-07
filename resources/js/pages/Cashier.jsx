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

    const handleTableClick = (table) => {
        setSelectedTable(table);
    };

    const handlePaymentSuccess = () => {
        setSelectedTable(null);
    };

    if (status === 'loading' && allTables.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    const currentOrder = selectedTable ? orderDict[selectedTable.id.toString()] : null;

    return (
        <div className="cashier-page md-management-page pb-20">
            <div className="md-management-page__content py-8">
                <div className="w-full max-w-[1200px] mx-auto px-[20px] flex flex-col gap-6">
                    <div className="cashier-page__list-tables bg-gray-50/50 rounded-3xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
                        <ActiveOrderTableList
                            tables={activeTablesToDisplay}
                            orders={orderDict}
                            currentTime={currentTime}
                            onTableClick={handleTableClick}
                        />
                    </div>
                </div>
            </div>

            {/* Payment Popup Modal */}
            {selectedTable && (
                <PaymentModal
                    selectedTable={selectedTable}
                    currentOrder={currentOrder}
                    onClose={() => setSelectedTable(null)}
                    onPaymentSuccess={handlePaymentSuccess}
                />
            )}

            {/* Hidden Print Area */}
            {selectedTable && currentOrder && (
                <div className="hidden-print">
                    <Receipt
                        order={currentOrder}
                        tableName={selectedTable?.name}
                    />
                </div>
            )}
        </div>
    );
};

export default Cashier;
