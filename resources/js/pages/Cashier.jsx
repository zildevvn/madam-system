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
                                    orders={individualLaneOrderDict}
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
                                    orders={groupLaneOrderDict}
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
