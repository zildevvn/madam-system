import React, { useState, useEffect, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';

// Store & Hooks
import { useAppDispatch } from '../store/hooks';
import { optimisticallyCompleteOrder, fetchTables } from '../store/slices/tableSlice';
import { useConsolidatedOrders } from '../hooks/useConsolidatedOrders';
import { useCashierSegmentation } from '../hooks/useCashierSegmentation';
import { useCashierHistory } from '../hooks/useCashierHistory';
import { useCashierData } from '../hooks/useCashierData';

// Services & Utils
import orderApi from '../services/orderApi';
import { formatLocalDate } from '../shared/utils/formatLocalDate';

// Components
import CashierIndividualLane from '../components/cashier/CashierIndividualLane';
import CashierGroupLane from '../components/cashier/CashierGroupLane';
import CashierHistoryLane from '../components/cashier/CashierHistoryLane';
import CheckoutManager from '../components/cashier/CheckoutManager';
import ConfirmDialog from '../components/shared/ConfirmDialog';

const COLLAPSE_ZONES = {
    INDIVIDUAL: 'individual',
    GROUP: 'group',
    HISTORY: 'history'
};

// [WHY] Centralized date helper for history filtering
const getTodayStr = () => {
    return formatLocalDate(new Date());
};

const Cashier = () => {
    const dispatch = useAppDispatch();
    const {
        orders,
        currentTime,
        allTables,
        status,
        error
    } = useConsolidatedOrders(null, false);

    const [selectedTableId, setSelectedTableId] = useState(null);
    const [collapsedSection, setCollapsedSection] = useState(null); // Expand all by default
    const [isReopening, setIsReopening] = useState(null);
    const [reopeningOrderId, setReopeningOrderId] = useState(null);
    const [editingHistoryOrder, setEditingHistoryOrder] = useState(null);

    // [WHY] Centralized date state for history filtering
    const [selectedDate, setSelectedDate] = useState(() => getTodayStr());

    const {
        reservations,
        historyOrders,
        isLoadingRes,
        isLoadingHistory,
        refreshAllData
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
        refreshAllData();
    }, [refreshAllData]);

    const handleActivePaymentSuccess = useCallback((paidOrderId) => {
        setSelectedTableId(null);

        if (paidOrderId) {
            dispatch(optimisticallyCompleteOrder(paidOrderId));
        }
        dispatch(fetchTables());
    }, [dispatch]);

    const handleReopenOrder = useCallback((orderId) => {
        setReopeningOrderId(orderId);
    }, []);

    const handleConfirmReopen = useCallback(async () => {
        if (!reopeningOrderId) return;
        const orderId = reopeningOrderId;
        setReopeningOrderId(null);

        setIsReopening(orderId);
        try {
            await orderApi.reopen(orderId);
            toast.success("Bill reopened successfully");
            refreshAllData();
            dispatch(fetchTables());
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Failed to reopen order");
        } finally {
            setIsReopening(null);
        }
    }, [reopeningOrderId, refreshAllData, dispatch]);

    const handleEditHistoryOrder = useCallback((order) => {
        setEditingHistoryOrder(order);
    }, []);

    const handleMergeBack = useCallback(async (orderId) => {
        try {
            await orderApi.mergeBack(orderId);
            toast.success("Đã gộp đơn hàng thành công");
            dispatch(fetchTables());
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Gộp đơn thất bại");
        }
    }, [dispatch]);

    const consolidatedHistory = useCashierHistory(historyOrders);

    const isIndividualCollapsed = collapsedSection === COLLAPSE_ZONES.INDIVIDUAL;
    const isGroupCollapsed = collapsedSection === COLLAPSE_ZONES.GROUP;
    const isHistoryCollapsed = collapsedSection === COLLAPSE_ZONES.HISTORY;

    const handleToggleIndividual = useCallback(() => {
        setCollapsedSection(prev => prev === COLLAPSE_ZONES.INDIVIDUAL ? null : COLLAPSE_ZONES.INDIVIDUAL);
    }, []);

    const handleToggleGroup = useCallback(() => {
        setCollapsedSection(prev => prev === COLLAPSE_ZONES.GROUP ? null : COLLAPSE_ZONES.GROUP);
    }, []);

    const handleToggleHistory = useCallback(() => {
        setCollapsedSection(prev => prev === COLLAPSE_ZONES.HISTORY ? null : COLLAPSE_ZONES.HISTORY);
    }, []);

    const laneClasses = useMemo(() => {
        return {
            [COLLAPSE_ZONES.INDIVIDUAL]: isIndividualCollapsed
                ? 'w-full lg:w-[20%] is-collapsed'
                : isGroupCollapsed
                    ? 'w-full lg:w-[80%]'
                    : 'w-full lg:w-1/2',
            [COLLAPSE_ZONES.GROUP]: isGroupCollapsed
                ? 'w-full lg:w-[20%] is-collapsed'
                : isIndividualCollapsed
                    ? 'w-full lg:w-[80%]'
                    : 'w-full lg:w-1/2',
            [COLLAPSE_ZONES.HISTORY]: isHistoryCollapsed
                ? 'w-full !min-h-0 is-collapsed'
                : 'w-full'
        };
    }, [isIndividualCollapsed, isGroupCollapsed, isHistoryCollapsed]);

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
                                isCollapsed={isIndividualCollapsed}
                                individualTables={individualTables}
                                individualOrders={individualOrders}
                                currentTime={currentTime}
                                onTableClick={handleActiveTableSelect}
                                onToggleCollapse={handleToggleIndividual}
                                onMergeBack={handleMergeBack}
                            />

                            <CashierGroupLane
                                containerClassName={laneClasses[COLLAPSE_ZONES.GROUP]}
                                isCollapsed={isGroupCollapsed}
                                groupTables={groupTables}
                                groupOrders={groupOrders}
                                currentTime={currentTime}
                                onTableClick={handleActiveTableSelect}
                                onToggleCollapse={handleToggleGroup}
                            />
                        </div>

                        {/* Bottom Row: History Lane (Full Width) */}
                        <CashierHistoryLane
                            containerClassName={laneClasses[COLLAPSE_ZONES.HISTORY]}
                            isCollapsed={isHistoryCollapsed}
                            historyOrders={consolidatedHistory}
                            allTables={allTables}
                            onToggleCollapse={handleToggleHistory}
                            onEditOrder={handleEditHistoryOrder}
                            onReopenOrder={handleReopenOrder}
                            isReopening={isReopening}
                            selectedDate={selectedDate}
                            onDateChange={setSelectedDate}
                            isLoading={isLoadingHistory}
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

                <ConfirmDialog
                    isOpen={!!reopeningOrderId}
                    title="Reopen Bill?"
                    message="Are you sure you want to reopen this bill? This will move it back to active status."
                    confirmText="Reopen"
                    cancelText="Cancel"
                    type="warning"
                    onConfirm={handleConfirmReopen}
                    onCancel={() => setReopeningOrderId(null)}
                />
            </div>
        </div>
    );
};

export default Cashier;
