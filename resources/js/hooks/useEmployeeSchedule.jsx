import React from 'react';
import useScheduleData from './useScheduleData';
import useWeekNavigation from './useWeekNavigation';
import useScheduleFilters from './useScheduleFilters';
import useTodayStats from './useTodayStats';
import Icon from '../components/shared/Icon';

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
        activeMobileDayIndex,
        setActiveMobileDayIndex,
        leavesByEmployee,
        roleFilteredEmployees,
        filteredSchedules
    } = useScheduleFilters(employees, leaves, weekDates);

    // 4. Staffing levels metrics calculation
    const todayStats = useTodayStats(roleFilteredEmployees, leavesByEmployee);

    // [WHY] Helper to resolve SVG iconography and classes based on active shift status.
    const getShiftBadgeStyle = (status) => {
        switch (status) {
            case 'Ca sáng':
                return {
                    bg: 'border-orange-100/50 text-orange-700',
                    icon: <span className="w-5 h-5 rounded-lg bg-orange-100 text-orange-500 flex items-center justify-center flex-shrink-0"><Icon name="sun" className="w-3 h-3" size={12} strokeWidth={2.5} /></span>
                };
            case 'Ca tối':
                return {
                    bg: 'bg-indigo-50/40 border-indigo-100/50  text-indigo-700',
                    icon: <span className="w-5 h-5 rounded-lg bg-indigo-100 text-indigo-500 flex items-center justify-center flex-shrink-0"><Icon name="moon" className="w-3 h-3" size={12} strokeWidth={2.5} /></span>
                };
            case 'Ca full time':
                return {
                    bg: 'bg-emerald-50/40 border-emerald-100/50 text-emerald-700',
                    icon: <span className="w-5 h-5 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0"><Icon name="briefcase" className="w-3 h-3" size={12} strokeWidth={2.5} /></span>
                };
            case 'Off day':
                return {
                    bg: 'bg-rose-500 border-rose-600 text-white shadow-sm shadow-rose-500/10',
                    icon: <span className="w-5 h-5 rounded-lg bg-white/20 text-white flex items-center justify-center flex-shrink-0"><Icon name="close" className="w-3 h-3" size={12} strokeWidth={2.5} /></span>
                };
            default:
                return {
                    bg: 'bg-slate-50 border-slate-100 text-slate-500',
                    icon: <span className="w-5 h-5 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center flex-shrink-0"><Icon name="alert" className="w-3 h-3" size={12} strokeWidth={2.5} /></span>
                };
        }
    };

    const getWeekdayLabel = (date) => {
        const days = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
        return days[date.getDay()];
    };

    return {
        employees,
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
        activeMobileDayIndex,
        setActiveMobileDayIndex,
        filteredSchedules,
        getShiftBadgeStyle,
        getWeekdayLabel,
        loadData,
        handlePrevWeek,
        handleCurrentWeek,
        handleNextWeek
    };
}
