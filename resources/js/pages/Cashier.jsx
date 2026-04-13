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
    } = useConsolidatedOrders(null, true);

    const [selectedTable, setSelectedTable] = useState(null);
    const [tableContexts, setTableContexts] = useState({}); // { [tableId]: { step, discountType, discountValue, draftItems } }
    const [reservations, setReservations] = useState([]);
    const [isGroupVisible, setIsGroupVisible] = useState(true); // [NEW] Toggle state for Group lane
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

    // [WHY] Exploded Data: We transform the unified orders array into two segmented billing lanes:
    // 1. groupLaneOrderDict: Contains only shared pre-ordered items.
    // 2. individualLaneOrderDict: Contains only local extra items per table.
    const explodedData = useMemo(() => {
        const groupLaneOrderDict = {};
        const individualLaneOrderDict = {};
        const individualTablesList = [];
        const processedOrderIds = new Set();

        orders.forEach(order => {
            if (processedOrderIds.has(order.id)) return;
            processedOrderIds.add(order.id);

            // [RULE] Split logic applies strictly to group reservations
            const isGroupSplitRequired = order.reservation_id && order.reservation && order.reservation.type === 'group';

            if (isGroupSplitRequired) {
                const groupKey = order.mergedTables || order.tableId.toString();

                // A. MASTER GROUP PART (Pre-orders only)
                // [WHY] Per user request: In the Group section, only display the pre-ordered (shared) items.
                const preOrderItems = order.items.filter(item => !!item.reservation_item_id);

                // Fallback: If no pre-orders exist, show everything to avoid empty card if system data is incomplete
                const groupItems = preOrderItems.length > 0 ? preOrderItems : order.items;

                groupLaneOrderDict[groupKey] = {
                    ...order,
                    items: groupItems,
                    isGroupMaster: true
                };

                // B. INDIVIDUAL TABLE PARTS (Extras only)
                // [WHY] Each table in the group gets a separate card for their extras.
                const allTableIds = order.mergedTables ? order.mergedTables.split('-') : [order.tableId.toString()];
                allTableIds.forEach(tId => {
                    const extraItems = order.items.filter(item => !item.reservation_item_id && item.tableId?.toString() === tId.toString());
                    if (extraItems.length > 0) {
                        const extraKey = `extra-${tId}`;
                        const tableObj = allTables.find(tbl => tbl.id.toString() === tId.toString());

                        individualLaneOrderDict[extraKey] = {
                            ...order,
                            id: order.id,
                            tableId: parseInt(tId),
                            tableName: `Table ${tId}`,
                            mergedTables: null,
                            items: extraItems,
                            isTableExtra: true,
                            isGroup: false
                        };

                        individualTablesList.push({
                            ...tableObj || { id: parseInt(tId), name: `Table ${tId}` },
                            id: extraKey,
                            originalTableId: parseInt(tId),
                            name: `Table ${tId}`,
                            groupKey: extraKey
                        });
                    }
                });
            } else {
                // REGULAR INDIVIDUAL TABLE
                const tableIdStr = order.tableId.toString();
                individualLaneOrderDict[tableIdStr] = order;
                const tableObj = allTables.find(tbl => tbl.id === order.tableId);
                if (tableObj) {
                    individualTablesList.push(tableObj);
                }
            }
        });

        // [SAFETY] Global Fallback: Ensure UI stability if split logic returns nothing but data exists
        if (Object.keys(groupLaneOrderDict).length === 0 && Object.keys(individualLaneOrderDict).length === 0 && orders.length > 0) {
            orders.forEach(o => {
                individualLaneOrderDict[o.tableId.toString()] = o;
                const tableObj = allTables.find(tbl => tbl.id === o.tableId);
                if (tableObj) individualTablesList.push(tableObj);
            });
        }

        return { groupLaneOrderDict, individualLaneOrderDict, individualTablesList };
    }, [orders, allTables]);

    const { groupLaneOrderDict, individualLaneOrderDict, individualTablesList } = explodedData;

    const handleTableClick = (table) => {
        const lookupKey = (table.groupKey || table.id).toString();
        const currentOrder = individualLaneOrderDict[lookupKey] || groupLaneOrderDict[lookupKey];

        // Initialize context for this table if it doesn't already exist
        if (!tableContexts[lookupKey]) {
            setTableContexts(prev => ({
                ...prev,
                [lookupKey]: {
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
            const lookupKey = (selectedTable.groupKey || selectedTable.id).toString();
            setTableContexts(prev => {
                const newState = { ...prev };
                delete newState[lookupKey];
                return newState;
            });
        }
        setSelectedTable(null);
    };

    // [WHY] Group Tables: Derived from reservations where type === 'group'
    // We match these reservations with the segmented orders in groupLaneOrderDict.
    // [RULE] Must be called before any early returns to avoid "Rendered fewer hooks than expected"
    const groupTables = useMemo(() => {
        // console.log("[Cashier Group Split] Recalculating groupTables:", reservations.length, Object.keys(groupLaneOrderDict).length);

        const resBased = reservations
            .filter(r => r.type === 'group')
            .map(r => {
                // [RULE] High-fidelity match: reservation_id
                const matchingOrderKeyByRes = Object.keys(groupLaneOrderDict).find(key => groupLaneOrderDict[key].reservation_id === r.id);

                // [FALLBACK] Table-based match: check table ID or merged string mapping
                const matchingOrderKey = matchingOrderKeyByRes || Object.keys(groupLaneOrderDict).find(key => {
                    const order = groupLaneOrderDict[key];
                    if (!order) return false;
                    const rTableIdStr = r.table_id?.toString();
                    return order.tableId?.toString() === rTableIdStr ||
                        (order.mergedTables && order.mergedTables.split('-').includes(rTableIdStr));
                });

                if (!matchingOrderKey) {
                    // console.warn(`[Cashier Group Split] No matching order found for reservation ${r.id}`);
                    return null;
                }

                const order = groupLaneOrderDict[matchingOrderKey];
                return {
                    id: matchingOrderKey,
                    name: order.tableName,
                    isVirtual: true,
                    reservation_id: r.id,
                    groupKey: matchingOrderKey
                };
            })
            .filter(Boolean);

        // [SAFETY] Final Fallback: If no reservations matched but we have "Group Master" cards in our dict,
        // we display them anyway to ensure data is never "lost" from the UI.
        const orphanGroupKeys = Object.keys(groupLaneOrderDict).filter(key => {
            const order = groupLaneOrderDict[key];
            const isMatched = resBased.some(rb => rb.id === key);
            return order.isGroupMaster && !isMatched;
        });

        const orphanGroups = orphanGroupKeys.map(key => {
            const order = groupLaneOrderDict[key];
            return {
                id: key,
                name: order.tableName,
                isVirtual: true,
                reservation_id: order.reservation_id,
                groupKey: key
            };
        });

        const finalGroupList = [...resBased, ...orphanGroups];
        // console.log("[Cashier Group Split] Final List:", finalGroupList.length);
        return finalGroupList;
    }, [reservations, groupLaneOrderDict]);

    if (status === 'loading' && allTables.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    const currentLookupKey = selectedTable ? (selectedTable.groupKey || selectedTable.id).toString() : null;
    const currentContext = currentLookupKey ? tableContexts[currentLookupKey] : null;
    const currentOrder = currentLookupKey ? (individualLaneOrderDict[currentLookupKey] || groupLaneOrderDict[currentLookupKey]) : null;

    // [WHY] Individual tables: Segmented list from explodedData
    const individualTables = individualTablesList;




    return (
        <div className="cashier-page pb-20">
            {/* [NON-INTRUSIVE FIX] Invisible spacer to satisfy global SCSS first-child:fixed rule without changing layout */}
            <div className="hidden" aria-hidden="true"></div>

            <div className="py-8 relative overflow-x-hidden">
                {/* [NEW] Floating Tab to restore Group section */}
                {!isGroupVisible && (
                    <div
                        onClick={() => setIsGroupVisible(true)}
                        className="fixed right-0 top-1/2 -translate-y-1/2 bg-orange-500 text-white p-4 rounded-l-2xl shadow-[0_4px_20px_rgba(255,165,0,0.3)] cursor-pointer hover:pr-6 transition-all duration-300 z-50 flex items-center gap-2"
                        title="Show Group Section"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                        <span className="text-[11px] font-black uppercase tracking-widest vertical-text hidden lg:block">Khách Đoàn</span>
                    </div>
                )}

                <div className="w-full max-w-[1600px] mx-auto px-[20px]">
                    <div className="flex flex-col lg:flex-row gap-4 relative items-start">
                        {/* LEFT: Individual Tables */}
                        <div className={`transition-all duration-500 ease-[cubic-bezier(0.23, 1, 0.32, 1)] ${isGroupVisible ? 'w-full lg:w-1/2' : 'w-full'}`}>
                            <div className="py-4 px-2 flex flex-col gap-6 bg-white rounded-[16px] shadow-sm border border-gray-100 overflow-hidden min-h-[500px]">
                                <div className="flex items-center justify-between px-2">
                                    <div className="flex flex-col">
                                        <h5 className="mb-0 text-gray-900 font-black text-[15px] uppercase tracking-tight">Khách Lẻ</h5>
                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Individual Tables</span>
                                    </div>
                                    <span className="bg-gray-100 text-gray-500 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">{individualTables.length} Bàn</span>
                                </div>

                                <div className="cashier-page__list-tables bg-white rounded-[32px] shadow-sm border border-gray-100 flex flex-col overflow-hidden min-h-[400px]">
                                    <ActiveOrderTableList
                                        tables={individualTables}
                                        orders={individualLaneOrderDict}
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
                            className={`transition-all duration-500 ease-[cubic-bezier(0.23, 1, 0.32, 1)] transform 
                            ${isGroupVisible
                                    ? 'w-full lg:w-1/2 translate-x-0 opacity-100'
                                    : 'w-0 lg:w-0 translate-x-full opacity-0 pointer-events-none absolute right-0'}`}
                        >
                            <div className="py-4 px-2 flex flex-col gap-6 bg-white rounded-[16px] shadow-sm border border-orange-100 overflow-hidden min-h-[500px] min-w-full lg:min-w-[400px]">
                                <div className="flex items-center justify-between px-2">
                                    <div className="flex items-center gap-3">
                                        <div className="flex flex-col">
                                            <h5 className="mb-0 text-orange-600 font-black text-[15px] uppercase tracking-tight">Khách Đoàn</h5>
                                            <span className="text-[10px] text-orange-300 font-bold uppercase tracking-widest">Group Reservations</span>
                                        </div>
                                        <button
                                            onClick={() => setIsGroupVisible(false)}
                                            className="p-2 hover:bg-orange-50 rounded-lg text-orange-400 hover:text-orange-600 transition-colors"
                                            title="Hide Group View"
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                                        </button>
                                    </div>
                                    <span className="bg-orange-50 text-orange-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">{groupTables.length} Đoàn</span>
                                </div>
                                <div className="cashier-page__list-tables bg-white rounded-[32px] shadow-sm border border-orange-50 flex flex-col overflow-hidden min-h-[400px]">
                                    <ActiveOrderTableList
                                        tables={groupTables}
                                        orders={groupLaneOrderDict}
                                        currentTime={currentTime}
                                        onTableClick={handleTableClick}
                                        showSimpleView={true}
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
