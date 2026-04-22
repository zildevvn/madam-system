import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { format, startOfWeek, endOfWeek } from 'date-fns';

/**
 * useRevenueReport Hook
 * [WHY] Decouples reporting logic from the UI to ensure compliance with Rule 119 (Logic Separation).
 * [RULE] Manages filter state and debounced data fetching for revenue analytics.
 */
export const useRevenueReport = () => {
    const [period, setPeriod] = useState('day');
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    /**
     * getWeekRange
     * [WHY] Calculates boundaries for the week selector.
     * [RULE] Standardized to Monday start (weekStartsOn: 1).
     */
    const getWeekRange = useCallback((date) => {
        const start = startOfWeek(date, { weekStartsOn: 1 });
        const end = endOfWeek(date, { weekStartsOn: 1 });
        return {
            start: format(start, 'yyyy-MM-dd'),
            end: format(end, 'yyyy-MM-dd')
        };
    }, []);

    const fetchReport = useCallback(async () => {
        try {
            setLoading(true);
            let url = `/api/stats/revenue-report?period=${period}`;

            if (period === 'week' && startDate && endDate) {
                url += `&start_date=${startDate}&end_date=${endDate}`;
            } else {
                url += `&date=${selectedDate}`;
            }

            const res = await axios.get(url);
            setStats(res.data.data);
        } catch (error) {
            console.error('Failed to fetch revenue report:', error);
        } finally {
            setLoading(false);
        }
    }, [period, selectedDate, startDate, endDate]);

    /**
     * Debounced fetch effect
     * [RULE] Prevents request spam during rapid filter changes.
     */
    useEffect(() => {
        const handler = setTimeout(() => {
            fetchReport();
        }, 300);

        return () => clearTimeout(handler);
    }, [fetchReport]);

    const handlePeriodChange = (newPeriod) => {
        setPeriod(newPeriod);
        const today = new Date();
        setSelectedDate(format(today, 'yyyy-MM-dd'));

        if (newPeriod === 'week') {
            const range = getWeekRange(today);
            setStartDate(range.start);
            setEndDate(range.end);
        }
    };

    return {
        period,
        selectedDate,
        startDate,
        endDate,
        stats,
        loading,
        setSelectedDate,
        setStartDate,
        setEndDate,
        handlePeriodChange,
        getWeekRange,
        periods: [
            { id: 'day', label: 'Ngày' },
            { id: 'week', label: 'Tuần' },
            { id: 'month', label: 'Tháng' },
            { id: 'year', label: 'Năm' }
        ]
    };
};
