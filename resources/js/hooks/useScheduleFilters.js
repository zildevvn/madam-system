import { useState, useMemo } from 'react';
import { formatLocalDate } from '../shared/utils/formatLocalDate';

/**
 * useScheduleFilters Micro-Hook
 * [WHY] Handles the role filters, searches, index hash mapping, and compiling schedules arrays.
 * [RULE] Adheres strictly to linear O(N+L) optimized scheduling computations.
 */
export default function useScheduleFilters(employees, leaves, weekDates) {
    const [searchQuery, setSearchQuery] = useState('');
    const [shiftFilter, setShiftFilter] = useState('all');
    const [roleTab, setRoleTab] = useState('all');

    // [WHY] Pre-maps leaves by employee ID in O(L) time.
    // [RULE] Transforms complex O(N*L) checks into extremely fast O(1) hash maps for peak performance.
    const leavesByEmployee = useMemo(() => {
        const map = {};
        leaves.forEach(leave => {
            if (leave.status !== 'approved' && leave.status !== 'pending_cancel' && leave.status !== 'rejected_cancel') return;
            const empId = leave.user_id;
            if (!map[empId]) {
                map[empId] = [];
            }
            map[empId].push({
                start: formatLocalDate(leave.start_date),
                end: formatLocalDate(leave.end_date)
            });
        });
        return map;
    }, [leaves]);

    // Filter out inactive employees first
    const activeEmployees = useMemo(() => {
        return employees.filter(emp => emp.status === 'active');
    }, [employees]);

    // [WHY] Filters employees array based on active role tab selector.
    const roleFilteredEmployees = useMemo(() => {
        return activeEmployees.filter(emp => {
            if (roleTab === 'all') return true;
            return emp.role === roleTab;
        });
    }, [activeEmployees, roleTab]);

    // [WHY] Compiles count of active employees in each role.
    const roleCounts = useMemo(() => {
        const counts = { all: activeEmployees.length };
        activeEmployees.forEach(emp => {
            if (emp.role) {
                counts[emp.role] = (counts[emp.role] || 0) + 1;
            }
        });
        return counts;
    }, [activeEmployees]);

    // [WHY] Processed weekly schedule grid for the active role selection.
    // [RULE] Uses indexed leavesByEmployee hash lookup to achieve O(N * 7) linear scale performance.
    const schedulesList = useMemo(() => {
        // Pre-format weekDates once to avoid formatting them repeatedly in the nested loop
        const formattedWeekDates = weekDates.map(date => ({
            date,
            dateStr: formatLocalDate(date)
        }));

        return roleFilteredEmployees.map(emp => {
            const empLeaves = leavesByEmployee[emp.id] || [];
            const dailySchedules = formattedWeekDates.map(({ date, dateStr }) => {
                const isOnLeave = empLeaves.some(l => dateStr >= l.start && dateStr <= l.end);
                
                // Resolve shift: check flexible shifts first, otherwise fallback to default fixed shift
                let shift = emp.work_shift || 'Ca sáng';
                if (emp.flexible_shifts && typeof emp.flexible_shifts === 'object') {
                    if (emp.flexible_shifts[dateStr]) {
                        shift = emp.flexible_shifts[dateStr];
                    }
                }

                return {
                    date,
                    status: isOnLeave ? 'Off day' : shift
                };
            });
            return {
                id: emp.id,
                name: emp.name,
                photo: emp.photo,
                role: emp.role,
                work_shift: emp.work_shift,
                flexible_shifts: emp.flexible_shifts,
                dailySchedules
            };
        });
    }, [roleFilteredEmployees, leavesByEmployee, weekDates]);

    // [WHY] Applies search terms and shift queries against processed schedules.
    const filteredSchedules = useMemo(() => {
        return schedulesList.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
            if (shiftFilter === 'all') return matchesSearch;
            const matchesShift = item.dailySchedules.some(s => {
                if (shiftFilter === 'off') return s.status === 'Off day';
                const statusLower = s.status.toLowerCase();
                if (shiftFilter === 'ca sáng') {
                    return statusLower === 'ca sáng' || statusLower === 'ca full time';
                }
                if (shiftFilter === 'ca tối') {
                    return statusLower === 'ca tối' || statusLower === 'ca full time';
                }
                return statusLower === shiftFilter.toLowerCase();
            });
            return matchesSearch && matchesShift;
        });
    }, [schedulesList, searchQuery, shiftFilter]);

    return {
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
    };
}
