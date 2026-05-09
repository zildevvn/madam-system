import { useEffect, useCallback, useMemo } from 'react';
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
    startNewOrder
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

        const order = resultAction.payload;

        if (!order) {
            dispatch(startNewOrder(tableId));
            navigate(`/order/${tableId}`);
            return;
        }

        if (order.status === 'draft') {
            navigate(`/order/${tableId}`);
        } else {
            navigate(`/checkout/${tableId}`);
        }
    }, [dispatch, navigate]);

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
        activeTab
    }), [isLoading, error, activeTab]);

    const actions = useMemo(() => ({
        onTableClick: handleTableClick
    }), [handleTableClick]);

    return { data, ui, actions };
};
