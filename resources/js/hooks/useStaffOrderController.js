import { useEffect, useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
    fetchTables,
    selectAllTables,
    selectBusyTables,
    selectBusyTablesCount,
    selectEmptyTablesCount
} from '../store/slices/tableSlice';
import {
    fetchActiveOrderAsync,
    startNewOrder,
    setActiveOrder,
    mergeBackAsync
} from '../store/slices/orderSlice';

export const useStaffOrderController = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const { status, error, activeTab } = useAppSelector(state => state.table);

    const tables = useAppSelector(selectAllTables);
    const busyTables = useAppSelector(selectBusyTables);
    const busyTablesCount = useAppSelector(selectBusyTablesCount);
    const emptyTablesCount = useAppSelector(selectEmptyTablesCount);

    const isLoading = status === 'loading';

    const [pendingOrders, setPendingOrders] = useState(null);
    const [selectedTableId, setSelectedTableId] = useState(null);
    const [isProcessingMerge, setIsProcessingMerge] = useState(false);

    // ✅ Fetch tables
    useEffect(() => {
        if (status === 'idle') {
            dispatch(fetchTables());
        }
    }, [status, dispatch]);

    // ✅ Stable action
    const handleTableClick = useCallback(async (tableId) => {
        const resultAction = await dispatch(fetchActiveOrderAsync(tableId));

        if (fetchActiveOrderAsync.rejected.match(resultAction)) {
            console.error(resultAction.error);
            return;
        }

        const orders = resultAction.payload;

        if (!orders || orders.length === 0) {
            dispatch(startNewOrder(tableId));
            navigate(`/order/${tableId}`);
            return;
        }

        if (orders.length === 1) {
            const order = orders[0];
            dispatch(setActiveOrder(order));
            if (order.status === 'draft') {
                navigate(`/order/${tableId}`);
            } else {
                navigate(`/checkout/${tableId}`);
            }
            return;
        }

        // Multiple orders (due to split), prompt user to select
        setPendingOrders(orders);
        setSelectedTableId(tableId);
    }, [dispatch, navigate]);

    const handleSelectOrder = useCallback((order) => {
        dispatch(setActiveOrder(order));
        setPendingOrders(null);
        if (order.status === 'draft') {
            navigate(`/order/${selectedTableId}`);
        } else {
            navigate(`/checkout/${selectedTableId}`);
        }
    }, [dispatch, navigate, selectedTableId]);

    const handleCancelSelection = useCallback(() => {
        setPendingOrders(null);
        setSelectedTableId(null);
    }, []);

    const handleMergeBack = useCallback(async (splitOrderId) => {
        if (!splitOrderId || isProcessingMerge) return;
        setIsProcessingMerge(true);
        try {
            await dispatch(mergeBackAsync(splitOrderId)).unwrap();
            
            // Re-fetch the orders for this table to update the modal
            const resultAction = await dispatch(fetchActiveOrderAsync(selectedTableId));
            if (fetchActiveOrderAsync.fulfilled.match(resultAction)) {
                const orders = resultAction.payload;
                if (!orders || orders.length <= 1) {
                    setPendingOrders(null); // Close modal if only 1 or 0 orders remain
                } else {
                    setPendingOrders(orders);
                }
            }
        } catch (error) {
            console.error("Failed to merge order back:", error);
            alert("Gộp đơn thất bại. Vui lòng thử lại!");
        } finally {
            setIsProcessingMerge(false);
        }
    }, [dispatch, selectedTableId, isProcessingMerge]);

    // ✅ Memo data
    const data = useMemo(() => ({
        tables,
        busyTables,
        stats: {
            busy: busyTablesCount,
            empty: emptyTablesCount,
            total: tables.length
        }
    }), [tables, busyTables, busyTablesCount, emptyTablesCount]);

    const ui = useMemo(() => ({
        isLoading,
        error,
        activeTab,
        pendingOrders,
        isProcessingMerge
    }), [isLoading, error, activeTab, pendingOrders, isProcessingMerge]);

    const actions = useMemo(() => ({
        onTableClick: handleTableClick,
        onSelectOrder: handleSelectOrder,
        onCancelSelection: handleCancelSelection,
        onMergeBack: handleMergeBack
    }), [handleTableClick, handleSelectOrder, handleCancelSelection, handleMergeBack]);

    return { data, ui, actions };
};
