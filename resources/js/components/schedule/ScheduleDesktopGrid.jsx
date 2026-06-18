import React from 'react';
import Icon from '../shared/Icon';

/**
 * ScheduleDesktopGrid Component
 * [WHY] Segregates the Y-axis (personnel) and X-axis (days of week) complex table rendering.
 * [RULE] Maintains clean modularity under 200 lines.
 */
export default function ScheduleDesktopGrid({
    filteredSchedules,
    weekDates,
    getWeekdayLabel,
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
        <div className="w-full overflow-x-auto rounded-xl border border-slate-100 bg-white shadow-sm custom-scrollbar">
            <table className="w-full border-collapse min-w-[550px] sm:min-w-[750px] text-left">
                <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="sticky left-0 bg-slate-50 z-20 py-2 px-2 text-[10px] font-black text-slate-400 uppercase tracking-wider w-[100px] sm:w-[160px] max-w-[100px] sm:max-w-[160px] border-r border-slate-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] overflow-hidden text-ellipsis">Nhân viên</th>
                        {weekDates.map((date, idx) => {
                            const isDayToday = isToday(date);
                            return (
                                <th
                                    key={idx}
                                    className={`py-2 px-1 text-[10px] font-black uppercase tracking-wider text-center border-l border-slate-100 transition-all ${isDayToday ? 'bg-orange-500/5 text-orange-600 font-black' : 'text-slate-500 bg-slate-50'
                                        } w-[58px] sm:w-[95px] max-w-[58px] sm:max-w-[95px]`}
                                >
                                    <div className="flex flex-col items-center justify-center gap-0.5">
                                        <span className="text-[8.5px] sm:text-[10px]">{getWeekdayLabel(date)}</span>
                                        <span className={`text-[7.5px] sm:text-[9px] font-bold ${isDayToday ? 'text-orange-500' : 'text-slate-400'}`}>
                                            {date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                                        </span>
                                        {isDayToday && (
                                            <span className="mt-0.5 text-[6.5px] sm:text-[8px] font-black uppercase tracking-widest text-orange-600 bg-orange-100 px-1 py-0.5 rounded-full leading-none scale-90 sm:scale-100">
                                                Nay
                                            </span>
                                        )}
                                    </div>
                                </th>
                            );
                        })}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {filteredSchedules.map((row) => (
                        <tr key={row.id} className="transition-colors hover:bg-slate-50/20">
                            {/* Employee info column - Sticky Left Optimized Width */}
                            <td className="sticky left-0 bg-white z-10 py-2 px-2 border-r border-slate-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] w-[100px] sm:w-[160px] max-w-[100px] sm:max-w-[160px] overflow-hidden">
                                <div className="flex items-center gap-1.5 min-w-0">
                                    <div className="min-w-0 w-full">
                                        <h5 className="!text-[10px] sm:!text-[12px] md:!text-[14px] font-black text-slate-800 truncate tracking-tight leading-none uppercase" title={row.name}>{row.name}</h5>
                                        <span className="text-[7.5px] sm:text-[8px] text-slate-400 font-bold bg-slate-100 px-1.5 py-0.5 rounded-full border border-slate-200/50 inline-block mt-1 leading-none truncate max-w-full">
                                            {row.role}
                                        </span>
                                    </div>
                                </div>
                            </td>

                            {/* Daily schedule columns */}
                            {row.dailySchedules.map((day, idx) => {
                                const styles = getShiftBadgeStyle(day.status);
                                const isDayToday = isToday(day.date);

                                return (
                                    <td
                                        key={idx}
                                        className={`py-2 px-0.5 sm:px-1 border-l border-slate-100 text-center align-middle transition-all ${isDayToday ? 'bg-orange-500/[0.02]' : ''
                                            }`}
                                    >
                                        <div className={`mx-auto p-0.5 sm:p-1.5 rounded-lg border transition-all flex flex-col items-center justify-center gap-0.5 sm:gap-1 w-[50px] sm:w-[85px] h-[48px] sm:h-[58px] ${styles.bg} ${isDayToday ? 'ring-2 ring-orange-400 border-orange-400/50 scale-[1.02] shadow-md shadow-orange-500/5' : ''
                                            }`}>
                                            <div className="scale-75 sm:scale-100 flex-shrink-0">
                                                <span className={styles.iconClass}>
                                                    <Icon name={styles.iconName} className="w-3 h-3" size={12} strokeWidth={2.5} />
                                                </span>
                                            </div>
                                            <span className="text-[7.5px] sm:text-[9px] font-black tracking-tight uppercase block leading-none w-full truncate text-center">
                                                {day.status.replace('Ca ', '')}
                                            </span>
                                        </div>
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
