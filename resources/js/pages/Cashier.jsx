import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useConsolidatedOrders } from '../hooks/useConsolidatedOrders';
import { useCashierSegmentation } from '../hooks/useCashierSegmentation';
import CashierIndividualLane from '../components/cashier/CashierIndividualLane';
import CashierGroupLane from '../components/cashier/CashierGroupLane';
import CashierHistoryLane from '../components/cashier/CashierHistoryLane';
import orderApi from '../services/orderApi';
import { useCashierHistory } from '../hooks/useCashierHistory';
import { useCashierData } from '../hooks/useCashierData';
import { useAppDispatch } from '../store/hooks';
import { optimisticallyCompleteOrder, fetchTables } from '../store/slices/tableSlice';


import CheckoutManager from '../components/cashier/CheckoutManager';

import { formatLocalDate } from '../shared/utils/formatLocalDate';

const COLLAPSE_ZONES = {
    INDIVIDUAL: 'individual',
    GROUP: 'group',
    HISTORY: 'history'
};

const Cashier = () => {
    const dispatch = useAppDispatch();
    const {
        orders,
        orderDict,
        currentTime,
        allTables,
        status,
        error
    } = useConsolidatedOrders(null, false);

    const [selectedTableId, setSelectedTableId] = useState(null);
    const [collapsedSection, setCollapsedSection] = useState(null); // Expand all by default
    const [isReopening, setIsReopening] = useState(null);
    const [editingHistoryOrder, setEditingHistoryOrder] = useState(null);

    // [WHY] Centralized date state for history filtering
    const getTodayStr = () => {
        return formatLocalDate(new Date());
    };
    const [selectedDate, setSelectedDate] = useState(getTodayStr());

    const {
        reservations,
        historyOrders,
        isLoadingRes,
        refreshData
    } = useCashierData(status, selectedDate);

    // [WHY] Segment orders into Group Reservations vs Individual Tables
    const { groupOrders, individualOrders, individualTables, groupTables, tableDict } = useCashierSegmentation(orders, allTables);

    // [WHY] Derive the full selectedTable object dynamically so it never goes out of sync
    const selectedTable = useMemo(() => {
        if (!selectedTableId) return null;
        return tableDict[selectedTableId] || null;
    }, [selectedTableId, tableDict]);

    // [WHY] Force state-driven print isolation
    useEffect(() => {
        const handleBefore = () => document.body.classList.add('is-printing-receipt');
        const handleAfter = () => document.body.classList.remove('is-printing-receipt');

        window.addEventListener('beforeprint', handleBefore);
        window.addEventListener('afterprint', handleAfter);

        return () => {
            window.removeEventListener('beforeprint', handleBefore);
            window.removeEventListener('afterprint', handleAfter);
            document.body.classList.remove('is-printing-receipt');
        };
    }, []);

    const handleActiveTableSelect = useCallback((table) => {
        setSelectedTableId((table.groupKey || table.id).toString());
    }, []);

    const handleSplitSuccess = useCallback((newOrder) => {
        // [WHY] If we split, we want to immediately focus on the NEW bill
        // [FIX] Store only the ID to dynamically pick up the new order card
        setSelectedTableId(newOrder.id.toString());
    }, []);

    const handleHistoryPaymentSuccess = useCallback(() => {
        setEditingHistoryOrder(null);
        refreshData();
        dispatch(fetchTables());
    }, [refreshData, dispatch]);

    const handleActivePaymentSuccess = useCallback((paidOrderId) => {
        setSelectedTableId(null);

        if (paidOrderId) {
            dispatch(optimisticallyCompleteOrder(paidOrderId));
        }
        dispatch(fetchTables());
    }, [dispatch]);

    const handleReopenOrder = useCallback(async (orderId) => {
        if (!window.confirm("Are you sure you want to reopen this bill? This will move it back to active status.")) return;

        setIsReopening(orderId);
        try {
            await orderApi.reopen(orderId);
            refreshData();
            dispatch(fetchTables());
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || "Failed to reopen order");
        } finally {
            setIsReopening(null);
        }
    }, [refreshData, dispatch]);

    const handleEditHistoryOrder = useCallback((order) => {
        setEditingHistoryOrder(order);
    }, []);

    const consolidatedHistory = useCashierHistory(historyOrders);

    const toggleHandlers = useMemo(() => {
        return Object.values(COLLAPSE_ZONES).reduce((acc, zone) => {
            acc[zone] = () => setCollapsedSection(prev => prev === zone ? null : zone);
            return acc;
        }, {});
    }, []);

    const laneClasses = useMemo(() => {
        const getSplitLaneClass = (thisZone, otherZone) => {
            if (collapsedSection === thisZone) return 'w-full lg:w-[20%] is-collapsed';
            if (collapsedSection === otherZone) return 'w-full lg:w-[80%]';
            return 'w-full lg:w-1/2';
        };

        return {
            [COLLAPSE_ZONES.INDIVIDUAL]: getSplitLaneClass(COLLAPSE_ZONES.INDIVIDUAL, COLLAPSE_ZONES.GROUP),
            [COLLAPSE_ZONES.GROUP]: getSplitLaneClass(COLLAPSE_ZONES.GROUP, COLLAPSE_ZONES.INDIVIDUAL),
            [COLLAPSE_ZONES.HISTORY]: collapsedSection === COLLAPSE_ZONES.HISTORY ? 'w-full !min-h-0' : 'w-full'
        };
    }, [collapsedSection]);

    const handleCloseTable = useCallback(() => setSelectedTableId(null), []);
    const handleCloseHistory = useCallback(() => setEditingHistoryOrder(null), []);

    if (status === 'loading' && allTables.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    return (
        <div className="cashier-page pb-20">
            {/* [RULE] All interactive UI goes inside .no-print for selective isolation */}
            <div className="no-print">
                <div className="main-inner pb-8 relative overflow-x-hidden">
                    <div className="w-full max-w-[1600px] mx-auto px-[20px]">
                        {/* Top Row: Active Lanes */}
                        <div className="flex flex-col lg:flex-row gap-4 relative items-start">
                            <CashierIndividualLane
                                containerClassName={laneClasses[COLLAPSE_ZONES.INDIVIDUAL]}
                                isCollapsed={collapsedSection === COLLAPSE_ZONES.INDIVIDUAL}
                                individualTables={individualTables}
                                individualOrders={individualOrders}
                                currentTime={currentTime}
                                onTableClick={handleActiveTableSelect}
                                onToggleCollapse={toggleHandlers[COLLAPSE_ZONES.INDIVIDUAL]}
                            />

                            <CashierGroupLane
                                containerClassName={laneClasses[COLLAPSE_ZONES.GROUP]}
                                isCollapsed={collapsedSection === COLLAPSE_ZONES.GROUP}
                                groupTables={groupTables}
                                groupOrders={groupOrders}
                                currentTime={currentTime}
                                onTableClick={handleActiveTableSelect}
                                onToggleCollapse={toggleHandlers[COLLAPSE_ZONES.GROUP]}
                            />
                        </div>

                        {/* Bottom Row: History Lane (Full Width) */}
                        <CashierHistoryLane
                            containerClassName={laneClasses[COLLAPSE_ZONES.HISTORY]}
                            isCollapsed={collapsedSection === COLLAPSE_ZONES.HISTORY}
                            historyOrders={consolidatedHistory}
                            allTables={allTables}
                            onToggleCollapse={toggleHandlers[COLLAPSE_ZONES.HISTORY]}
                            onEditOrder={handleEditHistoryOrder}
                            onReopenOrder={handleReopenOrder}
                            isReopening={isReopening}
                            selectedDate={selectedDate}
                            onDateChange={setSelectedDate}
                        />
                    </div>
                </div>

                <CheckoutManager
                    selectedTable={selectedTable}
                    editingHistoryOrder={editingHistoryOrder}
                    individualOrders={individualOrders}
                    groupOrders={groupOrders}
                    allTables={allTables}
                    onSplitSuccess={handleSplitSuccess}
                    onHistoryPaymentSuccess={handleHistoryPaymentSuccess}
                    onActivePaymentSuccess={handleActivePaymentSuccess}
                    onCloseTable={handleCloseTable}
                    onCloseHistory={handleCloseHistory}
                />
            </div>
        </div>
    );
};

export default Cashier;
