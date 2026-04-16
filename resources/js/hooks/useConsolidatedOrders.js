import { useMemo, useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { fetchTables } from '../store/slices/tableSlice';
import { selectTables, selectTableIdToGroupKey } from '../store/selectors/tableSelectors';
import { consolidateOrders } from '../utils/orderConsolidation';

/**
 * useConsolidatedOrders: Groups tables by their merged_tables string and 
 * consolidates order items. Now handles data fetching and real-time Echo subscriptions.
 * @param {string} filterType - 'food' | 'drink' | null
 * @param {boolean} groupByCompositeKey - whether to group same items together
 * @param {boolean} splitByFlow - if true, separates group reservations from individual extras (Cashier only)
 */
export const useConsolidatedOrders = (filterType = null, groupByCompositeKey = false, splitByFlow = false) => {
    const dispatch = useAppDispatch();
    const tables = useAppSelector(selectTables);
    const tableIdToGroupKey = useAppSelector(selectTableIdToGroupKey);
    const { status: tableStatus, error } = useAppSelector(state => state.table);
    const [currentTime, setCurrentTime] = useState(new Date());

    // 1. Fetch tables on mount if idle
    useEffect(() => {
        if (tableStatus === 'idle') {
            dispatch(fetchTables());
        }
    }, [tableStatus, dispatch]);

    // 2. Real-time subscriptions
    useEffect(() => {
        if (window.Echo) {
            const channel = window.Echo.channel('orders');
            const handleUpdate = () => dispatch(fetchTables());

            channel.listen('.order_created', handleUpdate)
                .listen('.order_updated', handleUpdate)
                .listen('.item_status_updated', handleUpdate);

            return () => window.Echo.leaveChannel('orders');
        }
    }, [dispatch]);

    // 3. 10-second timer for elapsed time calculations
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 10000);
        return () => clearInterval(timer);
    }, []);

    return useMemo(() => {
        const result = consolidateOrders(tables, tableIdToGroupKey, {
            filterType,
            groupByCompositeKey,
            splitByFlow
        });

        return {
            ...result,
            allTables: tables,
            tableIdToGroupKey,
            currentTime,
            status: tableStatus,
            error
        };
    }, [tables, tableIdToGroupKey, filterType, groupByCompositeKey, currentTime, tableStatus, error, splitByFlow]);
};
