import { useState, useEffect, useCallback, useRef } from 'react';
import statsApi from '../services/statsApi';
import { format } from 'date-fns';

/**
 * useReservationStats Hook
 * [WHY] Decouples Monthly Reservations Statistics fetching and filtering logic from the UI.
 */
export const useReservationStats = () => {
    const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
    const [stats, setStats] = useState({
        summary: {
            total_revenue: 0,
            total_reservations: 0,
            total_guests: 0,
            active_companies_count: 0,
            top_company: null
        },
        top_companies: [],
        company_comparison: [],
        month: ''
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchStats = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await statsApi.getReservationStats({ month: selectedMonth });
            if (res && res.data) {
                setStats(res.data);
            }
        } catch (error) {
            console.error('Failed to fetch reservation stats:', error);
            const errorMsg = error?.response?.data?.message || 'Không thể tải dữ liệu thống kê đặt chỗ.';
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    }, [selectedMonth]);

    // Keep active reference to the latest fetchStats to avoid socket re-subscriptions
    const fetchStatsRef = useRef(fetchStats);
    useEffect(() => {
        fetchStatsRef.current = fetchStats;
    }, [fetchStats]);

    // Initial and filter-based fetch
    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const socketDebounceTimeoutRef = useRef(null);

    // Stable socket event handler with 500ms debounce
    const handleSocketEvent = useCallback(() => {
        if (socketDebounceTimeoutRef.current) {
            clearTimeout(socketDebounceTimeoutRef.current);
        }
        socketDebounceTimeoutRef.current = setTimeout(() => {
            fetchStatsRef.current();
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

    return {
        selectedMonth,
        setSelectedMonth,
        stats,
        loading,
        error,
        refetch: fetchStats
    };
};
