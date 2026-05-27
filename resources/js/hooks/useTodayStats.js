import { useMemo } from 'react';
import { formatLocalDate } from '../shared/utils/formatLocalDate';

/**
 * useTodayStats Micro-Hook
 * [WHY] Formulates today staffing statistics dynamically based on current local date and filtered list.
 * [RULE] Uses leavesByEmployee hash lookup map to guarantee optimal O(N) linear performance.
 */
export default function useTodayStats(roleFilteredEmployees, leavesByEmployee) {
    return useMemo(() => {
        const dateStr = formatLocalDate(new Date());

        let morningCount = 0;
        let eveningCount = 0;
        let fullTimeCount = 0;
        let offCount = 0;

        roleFilteredEmployees.forEach(emp => {
            const empLeaves = leavesByEmployee[emp.id] || [];
            const isOnLeave = empLeaves.some(l => dateStr >= l.start && dateStr <= l.end);

            if (isOnLeave) {
                offCount++;
            } else {
                let shift = emp.work_shift || 'Ca sáng';
                if (emp.flexible_shifts && typeof emp.flexible_shifts === 'object') {
                    if (emp.flexible_shifts[dateStr]) {
                        shift = emp.flexible_shifts[dateStr];
                    }
                }
                if (shift === 'Ca sáng') morningCount++;
                else if (shift === 'Ca tối') eveningCount++;
                else if (shift === 'Ca full time') fullTimeCount++;
                else offCount++;
            }
        });

        return { morning: morningCount, evening: eveningCount, fullTime: fullTimeCount, off: offCount };
    }, [roleFilteredEmployees, leavesByEmployee]);
}
