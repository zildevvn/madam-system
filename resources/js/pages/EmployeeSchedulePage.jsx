import React, { useState, useMemo } from 'react';

// Custom Hook
import useEmployeeSchedule from '../hooks/useEmployeeSchedule.jsx';
import Icon from '../components/shared/Icon';
import { formatLocalDate } from '../shared/utils/formatLocalDate';

// Subcomponents
import TodayStats from '../components/schedule/TodayStats';
import ScheduleWeekNav from '../components/schedule/ScheduleWeekNav';
import ScheduleDesktopGrid from '../components/schedule/ScheduleDesktopGrid';

/**
 * EmployeeSchedulePage Component
 * [WHY] Serves strictly as a pure UI layout component.
 * [RULE] Adheres to standard UI-logic separation: 1 component = 1 responsibility.
 * [RULE] Fully abstracts all state and transformations into the useEmployeeSchedule custom hook.
 */
export default function EmployeeSchedulePage() {
    const {
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
    } = useEmployeeSchedule();

    const [selectedDate, setSelectedDate] = useState(() => formatLocalDate(new Date()));

    const { morningOff, eveningOff } = useMemo(() => {
        if (!leaves || !activeEmployees) {
            return { morningOff: 0, eveningOff: 0 };
        }

        let morning = 0;
        let evening = 0;

        leaves.forEach(leave => {
            const status = leave.status;
            if (status !== 'approved' && status !== 'pending' && status !== 'pending_cancel' && status !== 'rejected_cancel') {
                return;
            }

            const start = formatLocalDate(leave.start_date);
            const end = formatLocalDate(leave.end_date);
            if (selectedDate < start || selectedDate > end) {
                return;
            }

            const emp = activeEmployees.find(e => e.id === leave.user_id);
            if (!emp) return;

            if (emp.work_shift === 'Ca sáng') {
                morning++;
            } else if (emp.work_shift === 'Ca tối') {
                evening++;
            }
        });

        return { morningOff: morning, eveningOff: evening };
    }, [leaves, activeEmployees, selectedDate]);

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
                employeesCount={activeEmployees.length}
                roleCounts={roleCounts}
                handlePrevWeek={handlePrevWeek}
                handleCurrentWeek={handleCurrentWeek}
                handleNextWeek={handleNextWeek}
                weekRangeTitle={weekRangeTitle}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                shiftFilter={shiftFilter}
                setShiftFilter={setShiftFilter}
            />

            {
                loading ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-3">
                        <Icon name="spinner" size={32} className="w-8 h-8 text-orange-500 animate-spin" />
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Đang tính toán lịch trình...</span>
                    </div>
                ) : filteredSchedules.length > 0 ? (
                    <ScheduleDesktopGrid
                        filteredSchedules={filteredSchedules}
                        weekDates={weekDates}
                        getWeekdayLabel={getWeekdayLabel}
                        getShiftBadgeStyle={getShiftBadgeStyle}
                    />
                ) : (
                    <div className="py-20 flex flex-col items-center justify-center gap-2 text-center bg-white rounded-3xl border border-slate-100">
                        <Icon name="alert" size={40} className="w-10 h-10 text-slate-300" />
                        <h5 className="text-sm font-black text-slate-700 uppercase tracking-tight mt-1">Không tìm thấy kết quả</h5>
                        <p className="text-xs text-slate-400">Thử thay đổi bộ lọc tìm kiếm hoặc từ khóa khác.</p>
                    </div>
                )
            }
        </div >
    );
}
