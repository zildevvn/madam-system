import { useMemo, useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { fetchTables } from '../store/slices/tableSlice';
import { selectTables, selectTableIdToGroupKey } from '../store/selectors/tableSelectors';
import { consolidateOrders } from '../shared/utils/consolidateOrders';

/**
 * useConsolidatedOrders: Groups tables by their merged_tables string and 
 * consolidates order items. Now handles data fetching and real-time Echo subscriptions.
 * @param {string} filterType - 'food' | 'drink' | null
 * @param {boolean} groupByCompositeKey - whether to group same items together
 * @param {boolean} splitByFlow - if true, separates group reservations from individual extras (Cashier only)
 */
export const useConsolidatedOrders = (filterType = null, groupByCompositeKey = false) => {
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

            // [WHY] Listen for all relevant order/item events.
            // [RULE] We use specific event names matching the backend's broadcastAs() values.
            channel.listen('.order_created', handleUpdate)
                .listen('.order_updated', handleUpdate)
                .listen('.item_status_updated', handleUpdate);

            return () => {
                // [FIX] Use stopListening instead of leaveChannel to avoid killing 
                // subscriptions for other hooks sharing this channel on the same page.
                channel.stopListening('.order_created', handleUpdate)
                    .stopListening('.order_updated', handleUpdate)
                    .stopListening('.item_status_updated', handleUpdate);
            };
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
            groupByCompositeKey
        });

        return {
            ...result,
            allTables: tables,
            tableIdToGroupKey,
            currentTime,
            status: tableStatus,
            error
        };
    }, [tables, tableIdToGroupKey, filterType, groupByCompositeKey, currentTime, tableStatus, error]);
};
