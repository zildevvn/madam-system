import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import statsApi from '../services/statsApi';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import toast from 'react-hot-toast';

/**
 * useEmployeePerformance Hook
 * [WHY] Decouples date filters, realtime socket listeners, and data-fetching logic 
 * from the employee performance UI to ensure a predictable state lifecycle.
 */
export const useEmployeePerformance = () => {
    const [period, setPeriod] = useState('today');
    const [customStartDate, setCustomStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [customEndDate, setCustomEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [stats, setStats] = useState({ restaurant: [], seller: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Derive startDate and endDate from period (single source of truth)
    const { startDate, endDate } = useMemo(() => {
        if (period === 'custom') {
            return { startDate: customStartDate, endDate: customEndDate };
        }

        const today = new Date();
        if (period === 'week') {
            const start = startOfWeek(today, { weekStartsOn: 1 });
            const end = endOfWeek(today, { weekStartsOn: 1 });
            return {
                startDate: format(start, 'yyyy-MM-dd'),
                endDate: format(end, 'yyyy-MM-dd')
            };
        }

        if (period === 'month') {
            const start = startOfMonth(today);
            const end = endOfMonth(today);
            return {
                startDate: format(start, 'yyyy-MM-dd'),
                endDate: format(end, 'yyyy-MM-dd')
            };
        }

        // Default to 'today'
        return {
            startDate: format(today, 'yyyy-MM-dd'),
            endDate: format(today, 'yyyy-MM-dd')
        };
    }, [period, customStartDate, customEndDate]);

    const fetchPerformance = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
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
            const errorMsg = error?.response?.data?.message || 'Không thể tải dữ liệu hiệu suất nhân sự.';
            setError(errorMsg);
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    }, [period, startDate, endDate]);

    // Keep active reference to the latest fetchPerformance to avoid socket re-subscriptions
    const fetchPerformanceRef = useRef(fetchPerformance);
    useEffect(() => {
        fetchPerformanceRef.current = fetchPerformance;
    }, [fetchPerformance]);

    // Debounced initial & filter-based fetch
    useEffect(() => {
        const handler = setTimeout(() => {
            fetchPerformance();
        }, 150);
        return () => clearTimeout(handler);
    }, [fetchPerformance]);

    const socketDebounceTimeoutRef = useRef(null);

    // Stable socket event handler with 500ms debounce to prevent excessive backend API calls
    const handleSocketEvent = useCallback(() => {
        if (socketDebounceTimeoutRef.current) {
            clearTimeout(socketDebounceTimeoutRef.current);
        }
        socketDebounceTimeoutRef.current = setTimeout(() => {
            fetchPerformanceRef.current();
        }, 500);
    }, []);

    // Clean up any pending socket debounce timers on unmount
    useEffect(() => {
        return () => {
            if (socketDebounceTimeoutRef.current) {
                clearTimeout(socketDebounceTimeoutRef.current);
            }
        };
    }, []);

    // Global Socket synchronization to reflect updates instantly
    useEffect(() => {
        if (window.Echo) {
            const orderChannel = window.Echo.channel('orders');
            
            orderChannel.listen('.order_created', handleSocketEvent);
            orderChannel.listen('.order_updated', handleSocketEvent);
            orderChannel.listen('.reservation_updated', handleSocketEvent);

            return () => {
                orderChannel.stopListening('.order_created');
                orderChannel.stopListening('.order_updated');
                orderChannel.stopListening('.reservation_updated');
            };
        }
    }, [handleSocketEvent]);

    const handlePeriodChange = useCallback((newPeriod) => {
        setPeriod(newPeriod);
    }, []);

    return {
        period,
        startDate,
        endDate,
        setStartDate: setCustomStartDate,
        setEndDate: setCustomEndDate,
        stats,
        loading,
        error,
        handlePeriodChange,
        fetchPerformance
    };
};
