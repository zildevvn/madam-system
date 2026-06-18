import React from 'react';
import useScheduleData from './useScheduleData';
import useWeekNavigation from './useWeekNavigation';
import useScheduleFilters from './useScheduleFilters';
import useTodayStats from './useTodayStats';

// [WHY] Helper to resolve styling configurations based on active shift status.
const getShiftBadgeStyle = (status) => {
    switch (status) {
        case 'Ca sáng':
            return {
                bg: 'border-orange-100/50 text-orange-700',
                iconName: 'sun',
                iconClass: 'w-5 h-5 rounded-lg bg-orange-100 text-orange-500 flex items-center justify-center flex-shrink-0'
            };
        case 'Ca tối':
            return {
                bg: 'bg-indigo-50/40 border-indigo-100/50  text-indigo-700',
                iconName: 'moon',
                iconClass: 'w-5 h-5 rounded-lg bg-indigo-100 text-indigo-500 flex items-center justify-center flex-shrink-0'
            };
        case 'Ca full time':
            return {
                bg: 'bg-emerald-50/40 border-emerald-100/50 text-emerald-700',
                iconName: 'briefcase',
                iconClass: 'w-5 h-5 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0'
            };
        case 'Off day':
            return {
                bg: 'bg-rose-500 border-rose-600 text-white shadow-sm shadow-rose-500/10',
                iconName: 'close',
                iconClass: 'w-5 h-5 rounded-lg bg-white/20 text-white flex items-center justify-center flex-shrink-0'
            };
        default:
            return {
                bg: 'bg-slate-50 border-slate-100 text-slate-500',
                iconName: 'alert',
                iconClass: 'w-5 h-5 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center flex-shrink-0'
            };
    }
};

const getWeekdayLabel = (date) => {
    const days = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    return days[date.getDay()];
};

/**
 * useEmployeeSchedule Coordinator Hook (Facade Pattern)
 * [WHY] Aggregates single-responsibility micro-hooks and exposes a clean interface.
 * [RULE] Adheres strictly to modular composition rules without forming a "God Hook".
 */
export default function useEmployeeSchedule() {
    // 1. Core data loading
    const { employees, leaves, loading, loadData } = useScheduleData();

    // 2. Week navigation calendar controls
    const {
        weekDates,
        weekRangeTitle,
        handlePrevWeek,
        handleCurrentWeek,
        handleNextWeek
    } = useWeekNavigation();

    // 3. User filter compiling & grids processing
    const {
        searchQuery,
        setSearchQuery,
        shiftFilter,
        setShiftFilter,
        roleTab,
        setRoleTab,
        leavesByEmployee,
        roleFilteredEmployees,
        filteredSchedules,
        activeEmployees,
        roleCounts
    } = useScheduleFilters(employees, leaves, weekDates);

    // 4. Staffing levels metrics calculation
    const todayStats = useTodayStats(roleFilteredEmployees, leavesByEmployee);

    return {
        employees,
        activeEmployees,
        roleCounts,
        leaves,
        loading,
        roleTab,
        setRoleTab,
        weekDates,
        weekRangeTitle,
        todayStats,
        searchQuery,
        setSearchQuery,
        shiftFilter,
        setShiftFilter,
        filteredSchedules,
        getShiftBadgeStyle,
        getWeekdayLabel,
        loadData,
        handlePrevWeek,
        handleCurrentWeek,
        handleNextWeek
    };
}
