import React from 'react';
import Icon from '../shared/Icon';

/**
 * ScheduleMobileStack Component
 * [WHY] Segregates swipeable day tabs and card stacking on smartphones.
 * [RULE] Maintains clean modularity under 200 lines.
 */
export default function ScheduleMobileStack({
    weekDates,
    activeMobileDayIndex,
    setActiveMobileDayIndex,
    getWeekdayLabel,
    filteredSchedules,
    getShiftBadgeStyle
}) {
    // [WHY] Helper to check if a specific date represents today in the local timezone.
    const isToday = (date) => {
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    };

    return (
        <div className="block md:hidden space-y-3">
            {/* Horizontal scrollable weekday tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar scroll-smooth">
                {weekDates.map((date, idx) => {
                    const isDayToday = isToday(date);
                    return (
                        <button
                            key={idx}
                            type="button"
                            onClick={() => setActiveMobileDayIndex(idx)}
                            className={`px-3 py-1.5 rounded-lg border text-center transition-all flex-shrink-0 cursor-pointer flex flex-col items-center min-w-[65px] relative ${
                                idx === activeMobileDayIndex
                                    ? 'bg-orange-50 border-orange-200 text-orange-600 font-extrabold shadow-sm'
                                    : 'bg-slate-50 border-slate-200/40 text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            <span className="text-[9px] font-black uppercase tracking-wider block">{getWeekdayLabel(date)}</span>
                            <span className={`text-[8px] font-bold mt-0.5 block ${
                                idx === activeMobileDayIndex 
                                    ? 'text-orange-400' 
                                    : 'text-slate-400'
                            }`}>
                                {date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Active Day Stack Header */}
            <div className="flex items-center justify-between bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                    Lịch: {getWeekdayLabel(weekDates[activeMobileDayIndex])} ({weekDates[activeMobileDayIndex].toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })})
                </span>
                <span className="text-[8px] font-bold text-slate-400">
                    {filteredSchedules.length} nhân sự
                </span>
            </div>

            {/* Shift Stack */}
            <div className="space-y-2">
                {filteredSchedules.map((row) => {
                    const daySchedule = row.dailySchedules[activeMobileDayIndex];
                    const styles = getShiftBadgeStyle(daySchedule.status);

                    return (
                        <div key={row.id} className="p-2.5 bg-slate-50/50 rounded-xl border border-slate-100 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="min-w-0">
                                    <h5 className="text-[11px] font-black text-slate-800 truncate uppercase tracking-tight leading-none">{row.name}</h5>
                                    <span className="text-[8px] text-slate-400 font-bold bg-slate-100 px-1.5 py-0.5 rounded-full border border-slate-200/50 inline-block mt-1 leading-none">
                                        {row.role}
                                    </span>
                                </div>
                            </div>

                            {/* Shift badge */}
                            <div className={`px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1.5 flex-shrink-0 shadow-sm ${styles.bg}`}>
                                <span className={styles.iconClass}>
                                    <Icon name={styles.iconName} className="w-3 h-3" size={12} strokeWidth={2.5} />
                                </span>
                                <span className="text-[9px] font-black tracking-tight uppercase leading-none">
                                    {daySchedule.status}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
