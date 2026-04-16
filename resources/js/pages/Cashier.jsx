import React, { useState, useEffect, useMemo } from 'react';
import ActiveOrderTableList from '../components/ActiveOrderTableList';
import { useConsolidatedOrders } from '../hooks/useConsolidatedOrders';
import Receipt from '../components/Receipt';
import PaymentModal from '../components/PaymentModal';
import { reservationApi } from '../services/reservationApi';

const Cashier = () => {
    const {
        activeTablesToDisplay,
        orders,
        orderDict,
        currentTime,
        allTables,
        status,
        error
    } = useConsolidatedOrders(null, true, true);

    const [selectedTable, setSelectedTable] = useState(null);
    const [tableContexts, setTableContexts] = useState({}); // { [tableId]: { step, discountType, discountValue, draftItems } }
    const [reservations, setReservations] = useState([]);
    const [collapsedSection, setCollapsedSection] = useState(null); // 'left' | 'right' | null
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

    // [WHY] Segment the consolidated orders into two billing lanes:
    // 1. groupOrders: Unified group orders (master pre-order + individual extras merged).
    // 2. individualOrders: Standard orders on non-group tables only.
    const segmentedData = useMemo(() => {
        const groupOrders = {};
        const individualOrders = {};
        const individualTablesList = [];

        // [PASS 1] Identify group orders first
        orders.forEach(order => {
            const isGroup = order.reservation && order.reservation.type === 'group';
            const lookupKey = order.id.toString();
            if (isGroup) {
                // Clone the order and initialize relatedOrderIds for multi-order payment
                groupOrders[lookupKey] = {
                    ...order,
                    items: [...(order.items || [])],
                    relatedOrderIds: [order.id]
                };
            }
        });

        // [PASS 2] Collect all table IDs that belong to any group reservation
        // and build a reverse map: tableId → groupOrder lookupKey
        const groupLinkedTableIds = new Set();
        const tableIdToResId = {};
        const tableIdToGroupKey = {}; // Maps each group-linked tableId to its group order key
        Object.entries(groupOrders).forEach(([lookupKey, order]) => {
            const resId = order.reservation?.id;
            if (resId) {
                if (order.reservation?.table_ids) {
                    order.reservation.table_ids.forEach(id => {
                        const tid = Number(id);
                        groupLinkedTableIds.add(tid);
                        tableIdToResId[tid] = resId;
                        tableIdToGroupKey[tid] = lookupKey;
                    });
                }
                if (order.tableId) {
                    const tid = Number(order.tableId);
                    groupLinkedTableIds.add(tid);
                    tableIdToResId[tid] = resId;
                    tableIdToGroupKey[tid] = lookupKey;
                }
            }
        });

        // [COLOR MAPPING] Assign a stable color index (1-20) to each reservation ID
        const getGroupColorIndex = (resId) => {
            if (!resId) return 0;
            return (Number(resId) % 20) + 1;
        };

        // [PASS 3] Route each non-group order:
        // - Group-linked tables → merge items into the parent group order
        // - Standalone tables → add to individualOrders lane
        orders.forEach(order => {
            const isGroup = order.reservation && order.reservation.type === 'group';
            const lookupKey = order.id.toString();

            if (!isGroup) {
                const tid = Number(order.tableId);
                const isGroupLinked = groupLinkedTableIds.has(tid);
                const parentGroupKey = tableIdToGroupKey[tid];

                if (isGroupLinked && parentGroupKey && groupOrders[parentGroupKey]) {
                    // [MERGE] Fold this individual order's items into the parent group order
                    const parentGroup = groupOrders[parentGroupKey];
                    parentGroup.relatedOrderIds.push(order.id);
                    if (order.items && order.items.length > 0) {
                        parentGroup.items.push(...order.items);
                    }
                } else {
                    // [STANDALONE] Not linked to any group — show in Individual lane
                    individualOrders[lookupKey] = order;
                    const resId = order.reservation_id || order.reservation?.id || tableIdToResId[tid];
                    const groupColorIndex = 0; // Standalone = no group color

                    if (order.mergedTables) {
                        individualTablesList.push({
                            id: lookupKey,
                            name: order.tableName,
                            merged_tables: order.mergedTables,
                            groupKey: lookupKey,
                            isGroupLinked: false,
                            groupColorIndex
                        });
                    } else {
                        const tableObj = allTables.find(tbl => tbl.id === order.tableId);
                        if (tableObj) {
                            individualTablesList.push({
                                ...tableObj,
                                name: order.tableName || tableObj.name,
                                id: lookupKey,
                                originalTableId: tableObj.id,
                                groupKey: lookupKey,
                                isGroupLinked: false,
                                groupColorIndex
                            });
                        }
                    }
                }
            }
        });

        return { groupOrders, individualOrders, individualTablesList };
    }, [orders, allTables]);

    const { groupOrders, individualOrders, individualTablesList } = segmentedData;

    const handleTableClick = (table) => {
        const lookupKey = (table.groupKey || table.id).toString();
        const currentOrder = individualOrders[lookupKey] || groupOrders[lookupKey];

        // Initialize context for this table if it doesn't already exist
        if (!tableContexts[lookupKey]) {
            setTableContexts(prev => ({
                ...prev,
                [lookupKey]: {
                    step: 1,
                    discountType: 'fixed',
                    discountValue: 0,
                    cashierNote: '',
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
            const lookupKey = (selectedTable.groupKey || selectedTable.id).toString();
            setTableContexts(prev => {
                const newState = { ...prev };
                delete newState[lookupKey];
                return newState;
            });
        }
        setSelectedTable(null);
    };

    // [WHY] Group Tables: Directly mapped from groupOrders
    const groupTables = useMemo(() => {
        return Object.values(groupOrders).map(order => ({
            id: order.id.toString(),
            name: order.tableName,
            isVirtual: false,
            reservation_id: order.reservation_id,
            groupKey: order.id.toString(),
            groupColorIndex: 0
        }));
    }, [groupOrders]);

    const currentLookupKey = selectedTable ? (selectedTable.groupKey || selectedTable.id).toString() : null;
    const currentContext = currentLookupKey ? tableContexts[currentLookupKey] : null;
    const currentOrder = currentLookupKey ? (individualOrders[currentLookupKey] || groupOrders[currentLookupKey]) : null;

    // [WHY] Individual tables: Segmented list from explodedData
    const individualTables = individualTablesList;

    // [WHY] Mutually Exclusive Layout Calculations
    const layout = useMemo(() => {
        if (collapsedSection === 'left') {
            return {
                left: 'w-full lg:w-[20%] is-collapsed',
                right: 'w-full lg:w-[80%]',
                isLeftCollapsed: true,
                isRightCollapsed: false
            };
        }
        if (collapsedSection === 'right') {
            return {
                left: 'w-full lg:w-[80%]',
                right: 'w-full lg:w-[20%] is-collapsed',
                isLeftCollapsed: false,
                isRightCollapsed: true
            };
        }
        return {
            left: 'w-full lg:w-1/2',
            right: 'w-full lg:w-1/2',
            isLeftCollapsed: false,
            isRightCollapsed: false
        };
    }, [collapsedSection]);

    // [WHY] Early return AFTER all hooks to comply with React's rules of hooks
    if (status === 'loading' && allTables.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
        );
    }




    return (
        <div className="cashier-page pb-20">
            {/* [NON-INTRUSIVE FIX] Invisible spacer to satisfy global SCSS first-child:fixed rule without changing layout */}
            <div className="hidden" aria-hidden="true"></div>

            <div className="py-8 relative overflow-x-hidden">

                <div className="w-full max-w-[1600px] mx-auto px-[20px]">
                    <div className="flex flex-col lg:flex-row gap-4 relative items-start overflow-x-hidden">
                        {/* LEFT: Individual Tables */}
                        <div className={`transition-all duration-500 ease-[cubic-bezier(0.23, 1, 0.32, 1)] ${layout.left}`}>
                            <div className={`py-4 ${!layout.isLeftCollapsed ? 'px-2' : 'px-1'} flex flex-col gap-6 bg-white rounded-[16px] shadow-sm border border-gray-100 overflow-hidden min-h-[500px] min-w-full ${!layout.isLeftCollapsed ? 'lg:min-w-[400px]' : 'lg:min-w-[150px]'}`}>
                                <div className="flex items-center justify-between px-2">
                                    <div className="flex flex-col">
                                        <h5 className={`mb-0 text-gray-900 font-black uppercase tracking-tight ${!layout.isLeftCollapsed ? 'text-[15px]' : 'text-[12px]'}`}>
                                            {!layout.isLeftCollapsed ? 'Khách Lẻ' : 'Lẻ'}
                                        </h5>
                                        {!layout.isLeftCollapsed && <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Individual Tables</span>}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => setCollapsedSection(collapsedSection === 'left' ? null : 'left')}
                                            className="p-2 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                                            title={!layout.isLeftCollapsed ? "Collapse Left View" : "Expand Left View"}
                                        >
                                            {!layout.isLeftCollapsed ? (
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                                            ) : (
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                                            )}
                                        </button>
                                        <span className="bg-gray-100 text-gray-500 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                                            {individualTables.length} {!layout.isLeftCollapsed ? 'Bàn' : ''}
                                        </span>
                                    </div>
                                </div>

                                <div className="cashier-page__list-tables bg-white rounded-[32px] shadow-sm border border-gray-100 flex flex-col overflow-hidden min-h-[400px]">
                                    <ActiveOrderTableList
                                        tables={individualTables}
                                        orders={individualOrders}
                                        currentTime={currentTime}
                                        onTableClick={handleTableClick}
                                        showSimpleView={true}
                                    />
                                    {individualTables.length === 0 && (
                                        <div className="flex flex-col items-center justify-center py-24 opacity-30">
                                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h18v18H3zM9 9h6v6H9z" /></svg>
                                            <p className="text-[11px] font-bold mt-4 uppercase tracking-widest">Không có khách lẻ</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: Group Tables (Sliding) */}
                        <div
                            className={`transition-all duration-500 ease-[cubic-bezier(0.23, 1, 0.32, 1)] ${layout.right}`}
                        >
                            <div className={`py-4 ${!layout.isRightCollapsed ? 'px-2' : 'px-1'} flex flex-col gap-6 bg-white rounded-[16px] shadow-sm border border-orange-100 overflow-hidden min-h-[500px] min-w-full ${!layout.isRightCollapsed ? 'lg:min-w-[400px]' : 'lg:min-w-[150px]'}`}>
                                <div className="flex items-center justify-between px-2">
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => setCollapsedSection(collapsedSection === 'right' ? null : 'right')}
                                            className="p-2 hover:bg-orange-50 rounded-lg text-orange-400 hover:text-orange-600 transition-colors"
                                            title={!layout.isRightCollapsed ? "Collapse Group View" : "Expand Group View"}
                                        >
                                            {!layout.isRightCollapsed ? (
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                                            ) : (
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                                            )}
                                        </button>
                                        <div className="flex flex-col">
                                            <h5 className={`mb-0 text-orange-600 font-black uppercase tracking-tight ${!layout.isRightCollapsed ? 'text-[15px]' : 'text-[12px]'}`}>Đoàn</h5>
                                            {!layout.isRightCollapsed && <span className="text-[10px] text-orange-300 font-bold uppercase tracking-widest">Group Reservations</span>}
                                        </div>
                                    </div>
                                    <span className="bg-orange-50 text-orange-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                                        {groupTables.length} {!layout.isRightCollapsed ? 'Đoàn' : ''}
                                    </span>
                                </div>
                                <div className="cashier-page__list-tables bg-white rounded-[32px] shadow-sm border border-orange-50 flex flex-col overflow-hidden min-h-[400px]">
                                    <ActiveOrderTableList
                                        tables={groupTables}
                                        orders={groupOrders}
                                        currentTime={currentTime}
                                        onTableClick={handleTableClick}
                                        showSimpleView={true}
                                        className="mdt-list-tables__bg-primary"
                                    />

                                    {groupTables.length === 0 && (
                                        <div className="flex flex-col items-center justify-center py-24 opacity-30">
                                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                                            <p className="text-[11px] font-bold mt-4 uppercase tracking-widest text-orange-400">Không có khách đoàn</p>
                                        </div>
                                    )}
                                </div>
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
                    onUpdateDraftItems={(items) => updateTableContext(currentLookupKey, { draftItems: items })}

                    discountType={currentContext.discountType}
                    onUpdateDiscountType={(type) => updateTableContext(currentLookupKey, { discountType: type })}

                    discountValue={currentContext.discountValue}
                    onUpdateDiscountValue={(val) => updateTableContext(currentLookupKey, { discountValue: val })}

                    step={currentContext.step}
                    onUpdateStep={(s) => updateTableContext(currentLookupKey, { step: s })}

                    cashierNote={currentContext.cashierNote}
                    onUpdateCashierNote={(note) => updateTableContext(currentLookupKey, { cashierNote: note })}
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
