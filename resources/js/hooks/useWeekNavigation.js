import { useState, useMemo } from 'react';

/**
 * useWeekNavigation Micro-Hook
 * [WHY] Handles the date navigation arithmetic in local user calendar format.
 * [RULE] Maintains lightweight single responsibility under 200 lines.
 */
export default function useWeekNavigation() {
    const [currentDate, setCurrentDate] = useState(new Date());

    // [WHY] Processes dates of the active selected week (Mon - Sun) in the user's local timezone.
    const weekDates = useMemo(() => {
        const startOfWeek = new Date(currentDate);
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
        startOfWeek.setDate(diff);
        startOfWeek.setHours(0, 0, 0, 0);

        const dates = [];
        for (let i = 0; i < 7; i++) {
            const nextDate = new Date(startOfWeek);
            nextDate.setDate(startOfWeek.getDate() + i);
            dates.push(nextDate);
        }
        return dates;
    }, [currentDate]);

    // [WHY] Format string indicator for selected week range display.
    const weekRangeTitle = useMemo(() => {
        if (weekDates.length === 0) return '';
        const first = weekDates[0];
        const last = weekDates[6];
        const formatDate = (d) => d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
        return `${formatDate(first)} - ${formatDate(last)}`;
    }, [weekDates]);

    const handlePrevWeek = () => {
        const prev = new Date(currentDate);
        prev.setDate(currentDate.getDate() - 7);
        setCurrentDate(prev);
    };

    const handleCurrentWeek = () => setCurrentDate(new Date());

    const handleNextWeek = () => {
        const next = new Date(currentDate);
        next.setDate(currentDate.getDate() + 7);
        setCurrentDate(next);
    };

    return {
        weekDates,
        weekRangeTitle,
        handlePrevWeek,
        handleCurrentWeek,
        handleNextWeek
    };
}
