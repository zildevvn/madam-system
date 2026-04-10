import React, { useState, useEffect, useMemo } from 'react';
import ActiveOrderTableList from '../components/ActiveOrderTableList';
import { useConsolidatedOrders } from '../hooks/useConsolidatedOrders';
import Receipt from '../components/Receipt';
import PaymentModal from '../components/PaymentModal';
import { reservationApi } from '../services/reservationApi';

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
    const [reservations, setReservations] = useState([]);
    const [isLoadingRes, setIsLoadingRes] = useState(false);

    const loadReservations = React.useCallback(async () => {
        setIsLoadingRes(true);
        try {
            const res = await reservationApi.getAll();
            setReservations(res.data || []);
        } catch (err) {
            console.error("Failed to fetch reservations:", err);
        } finally {
            setIsLoadingRes(false);
        }
    }, []);

    // [WHY] Fetch reservations to drive the groupTables section
    useEffect(() => {
        loadReservations();
    }, [loadReservations, status]); // Refresh when table status changes (suggests updates)

    // [WHY] Real-time listeners for the Cashier dashboard
    useEffect(() => {
        if (window.Echo) {
            const channel = window.Echo.channel('orders');

            // Listen for any events that might affect group table assignments
            channel.listen('.order_created', loadReservations)
                .listen('.order_updated', loadReservations)
                .listen('.reservation_updated', loadReservations);

            return () => window.Echo.leaveChannel('orders');
        }
    }, [loadReservations]);

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

    // [WHY] Group Tables: Derived from reservations where type === 'group'
    // We match these reservations with the consolidated orders in orderDict.
    // [RULE] Must be called before any early returns to avoid "Rendered fewer hooks than expected"
    const groupTables = useMemo(() => {
        return reservations
            .filter(r => r.type === 'group')
            .map(r => {
                // Search orderDict for an order linked to this reservation_id
                const matchingOrder = Object.values(orderDict).find(o => o.reservation_id === r.id);

                if (!matchingOrder) return null;

                // Return a "Table" like object that ActiveOrderTableList can render
                return {
                    id: matchingOrder.tableId, // The primary table ID for this group order
                    name: matchingOrder.tableName, // The formatted "ACB - Bàn 2-3" string
                    isVirtual: true,
                    reservation_id: r.id
                };
            })
            .filter(Boolean);
    }, [reservations, orderDict]);

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

    // [WHY] Individual tables: All tables with active orders that are NOT part of a group reservation
    const individualTables = activeTablesToDisplay.filter(t => !orderDict[t.id.toString()]?.isGroup);

    return (
        <div className="cashier-page md-management-page pb-20">
            <div className="md-management-page__content py-8">
                <div className="w-full max-w-[1600px] mx-auto px-[20px]">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* LEFT: Individual Tables */}
                        <div className="flex flex-col gap-6">
                            <div className="flex items-center justify-between px-2">
                                <h3 className="text-[16px] font-black text-gray-800 tracking-tight uppercase">Khách Lẻ (Individual)</h3>
                                <span className="bg-gray-100 text-gray-500 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">{individualTables.length} Bàn</span>
                            </div>
                            <div className="cashier-page__list-tables bg-white rounded-[32px] shadow-sm border border-gray-100 flex flex-col overflow-hidden min-h-[200px]">
                                <ActiveOrderTableList
                                    tables={individualTables}
                                    orders={orderDict}
                                    currentTime={currentTime}
                                    onTableClick={handleTableClick}
                                    showSimpleView={true}
                                />
                                {individualTables.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-20 opacity-40">
                                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h18v18H3zM9 9h6v6H9z" /></svg>
                                        <p className="text-[12px] font-bold mt-4 uppercase tracking-widest">Không có khách lẻ</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* RIGHT: Group Tables */}
                        <div className="flex flex-col gap-6">
                            <div className="flex items-center justify-between px-2">
                                <h3 className="text-[16px] font-black text-orange-600 tracking-tight uppercase">Khách Đoàn (Group)</h3>
                                <span className="bg-orange-50 text-orange-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">{groupTables.length} Đoàn</span>
                            </div>
                            <div className="cashier-page__list-tables bg-white rounded-[32px] shadow-sm border border-orange-100 flex flex-col overflow-hidden min-h-[200px]">
                                <ActiveOrderTableList
                                    tables={groupTables}
                                    orders={orderDict}
                                    currentTime={currentTime}
                                    onTableClick={handleTableClick}
                                    showSimpleView={true}
                                />
                                {groupTables.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-20 opacity-40">
                                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                                        <p className="text-[12px] font-bold mt-4 uppercase tracking-widest">Không có loại khách đoàn</p>
                                    </div>
                                )}
                            </div>
                        </div>
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
