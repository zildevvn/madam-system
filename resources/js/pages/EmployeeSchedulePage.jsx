import React from 'react';

// Custom Hook
import useEmployeeSchedule from '../hooks/useEmployeeSchedule.jsx';

// Subcomponents
import TodayStats from '../components/schedule/TodayStats';
import ScheduleWeekNav from '../components/schedule/ScheduleWeekNav';
import ScheduleDesktopGrid from '../components/schedule/ScheduleDesktopGrid';
import ScheduleMobileStack from '../components/schedule/ScheduleMobileStack';

/**
 * EmployeeSchedulePage Component
 * [WHY] Serves strictly as a pure UI layout component.
 * [RULE] Adheres to standard UI-logic separation: 1 component = 1 responsibility.
 * [RULE] Fully abstracts all state and transformations into the useEmployeeSchedule custom hook.
 */
export default function EmployeeSchedulePage() {
    const {
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
    } = useEmployeeSchedule();

    return (
        <div className="space-y-4 mx-auto max-w-7xl px-3 sm:px-5 lg:px-6 py-4 sm:py-6">
            {/* Header Banner */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h4 className="text-slate-900 tracking-tight uppercase">Lịch Làm Việc Hàng Tuần</h4>
            </div>

            {/* Today Statistics Segment */}
            <TodayStats todayStats={todayStats} />

            {/* Filters and Week Nav Card */}
            <ScheduleWeekNav
                roleTab={roleTab}
                setRoleTab={setRoleTab}
                employeesCount={employees.length}
                sellerCount={employees.filter(e => e.role === 'seller').length}
                restaurantCount={employees.filter(e => e.role !== 'seller').length}
                handlePrevWeek={handlePrevWeek}
                handleCurrentWeek={handleCurrentWeek}
                handleNextWeek={handleNextWeek}
                weekRangeTitle={weekRangeTitle}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                shiftFilter={shiftFilter}
                setShiftFilter={setShiftFilter}
            />

            {loading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3">
                    <svg className="w-8 h-8 text-orange-500 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 15H19" /></svg>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Đang tính toán lịch trình...</span>
                </div>
            ) : filteredSchedules.length > 0 ? (
                <>
                    <div className="hidden md:block">
                        <ScheduleDesktopGrid
                            filteredSchedules={filteredSchedules}
                            weekDates={weekDates}
                            getWeekdayLabel={getWeekdayLabel}
                            getShiftBadgeStyle={getShiftBadgeStyle}
                        />
                    </div>
                    <div className="block md:hidden">
                        <ScheduleMobileStack
                            weekDates={weekDates}
                            activeMobileDayIndex={activeMobileDayIndex}
                            setActiveMobileDayIndex={setActiveMobileDayIndex}
                            getWeekdayLabel={getWeekdayLabel}
                            filteredSchedules={filteredSchedules}
                            getShiftBadgeStyle={getShiftBadgeStyle}
                        />
                    </div>
                </>
            ) : (
                <div className="py-20 flex flex-col items-center justify-center gap-2 text-center bg-white rounded-3xl border border-slate-100">
                    <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    <h5 className="text-sm font-black text-slate-700 uppercase tracking-tight mt-1">Không tìm thấy kết quả</h5>
                    <p className="text-xs text-slate-400">Thử thay đổi bộ lọc tìm kiếm hoặc từ khóa khác.</p>
                </div>
            )}
        </div>
    );
}
