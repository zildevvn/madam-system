import React from 'react';
import useScheduleData from './useScheduleData';
import useWeekNavigation from './useWeekNavigation';
import useScheduleFilters from './useScheduleFilters';
import useTodayStats from './useTodayStats';

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
                    icon: <span className="w-5 h-5 rounded-lg bg-orange-100 text-orange-500 flex items-center justify-center flex-shrink-0"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 3v1m0 16v1m9-9h-1M4 9h-1m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" /></svg></span>
                };
            case 'Ca tối':
                return {
                    bg: 'bg-indigo-50/40 border-indigo-100/50  text-indigo-700',
                    icon: <span className="w-5 h-5 rounded-lg bg-indigo-100 text-indigo-500 flex items-center justify-center flex-shrink-0"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg></span>
                };
            case 'Ca full time':
                return {
                    bg: 'bg-emerald-50/40 border-emerald-100/50 text-emerald-700',
                    icon: <span className="w-5 h-5 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg></span>
                };
            case 'Off day':
                return {
                    bg: 'bg-rose-500 border-rose-600 text-white shadow-sm shadow-rose-500/10',
                    icon: <span className="w-5 h-5 rounded-lg bg-white/20 text-white flex items-center justify-center flex-shrink-0"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg></span>
                };
            default:
                return {
                    bg: 'bg-slate-50 border-slate-100 text-slate-500',
                    icon: <span className="w-5 h-5 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center flex-shrink-0"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></span>
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
