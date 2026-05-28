import { useState, useEffect, useCallback } from 'react';
import statsApi from '../services/statsApi';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

/**
 * useEmployeePerformance Hook
 * [WHY] Decouples date filters, realtime socket listeners, and data-fetching logic 
 * from the employee performance UI to ensure a predictable state lifecycle.
 */
export const useEmployeePerformance = () => {
    const [period, setPeriod] = useState('today');
    const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [stats, setStats] = useState({ restaurant: [], seller: [] });
    const [loading, setLoading] = useState(true);

    const fetchPerformance = useCallback(async () => {
        try {
            setLoading(true);
            const params = { period };
            if (period === 'custom') {
                params.start_date = startDate;
                params.end_date = endDate;
            }
            const res = await statsApi.getEmployeePerformance(params);
            if (res && res.data) {
                setStats(res.data);
            }
        } catch (error) {
            console.error('Failed to fetch employee performance stats:', error);
        } finally {
            setLoading(false);
        }
    }, [period, startDate, endDate]);

    // Debounced initial & filter-based fetch
    useEffect(() => {
        const handler = setTimeout(() => {
            fetchPerformance();
        }, 150);
        return () => clearTimeout(handler);
    }, [fetchPerformance]);

    // Global Socket synchronization to reflect updates instantly
    useEffect(() => {
        if (window.Echo) {
            const orderChannel = window.Echo.channel('orders');
            
            const handleSocketEvent = () => {
                fetchPerformance();
            };

            orderChannel.listen('.order_created', handleSocketEvent);
            orderChannel.listen('.order_updated', handleSocketEvent);
            orderChannel.listen('.reservation_updated', handleSocketEvent);

            return () => {
                orderChannel.stopListening('.order_created');
                orderChannel.stopListening('.order_updated');
                orderChannel.stopListening('.reservation_updated');
            };
        }
    }, [fetchPerformance]);

    const handlePeriodChange = (newPeriod) => {
        setPeriod(newPeriod);
        const today = new Date();
        if (newPeriod === 'today') {
            setStartDate(format(today, 'yyyy-MM-dd'));
            setEndDate(format(today, 'yyyy-MM-dd'));
        } else if (newPeriod === 'week') {
            const start = startOfWeek(today, { weekStartsOn: 1 });
            const end = endOfWeek(today, { weekStartsOn: 1 });
            setStartDate(format(start, 'yyyy-MM-dd'));
            setEndDate(format(end, 'yyyy-MM-dd'));
        } else if (newPeriod === 'month') {
            const start = startOfMonth(today);
            const end = endOfMonth(today);
            setStartDate(format(start, 'yyyy-MM-dd'));
            setEndDate(format(end, 'yyyy-MM-dd'));
        }
    };

    return {
        period,
        startDate,
        endDate,
        setStartDate,
        setEndDate,
        stats,
        loading,
        handlePeriodChange,
        fetchPerformance
    };
};
