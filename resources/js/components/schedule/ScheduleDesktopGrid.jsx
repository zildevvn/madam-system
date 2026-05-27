import React from 'react';

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
        <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-100 bg-white">
            <table className="w-full border-collapse min-w-[900px] text-left">
                <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="py-2.5 px-3 text-[10px] font-black text-slate-400 uppercase tracking-wider w-[180px]">Nhân viên</th>
                        {weekDates.map((date, idx) => {
                            const isDayToday = isToday(date);
                            return (
                                <th
                                    key={idx}
                                    className={`py-2 px-2 text-[10px] font-black uppercase tracking-wider text-center border-l border-slate-100 transition-all ${isDayToday ? 'bg-orange-500/5 text-orange-600 font-black' : 'text-slate-500 bg-slate-50'
                                        }`}
                                >
                                    <div className="flex flex-col items-center justify-center gap-0.5">
                                        <span>{getWeekdayLabel(date)}</span>
                                        <span className={`text-[9px] font-bold ${isDayToday ? 'text-orange-500' : 'text-slate-400'}`}>
                                            {date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                                        </span>
                                        {isDayToday && (
                                            <span className="mt-0.5 text-[8px] font-black uppercase tracking-widest text-orange-600 bg-orange-100 px-1 py-0.5 rounded-full leading-none">
                                                Hôm nay
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
                        <tr key={row.id} className="hover:bg-slate-50/40 transition-colors">
                            {/* Employee info column */}
                            <td className="py-2 px-3">
                                <div className="flex items-center gap-2">
                                    <div className="min-w-0">
                                        <h5 className="!text-[14px] font-black text-slate-800 truncate tracking-tight leading-none">{row.name}</h5>
                                        <span className="text-[8px] text-slate-400 font-bold bg-slate-100 px-1.5 py-0.5 rounded-full border border-slate-200/50 inline-block mt-1 leading-none">
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
                                        className={`py-2 px-1 border-l border-slate-100 text-center align-middle transition-all ${isDayToday ? 'bg-orange-500/[0.02]' : ''
                                            }`}
                                    >
                                        <div className={`mx-auto p-1.5 rounded-lg border transition-all flex flex-col items-center justify-center gap-1 w-[90px] h-[60px] shadow-sm ${styles.bg} ${isDayToday ? 'ring-2 ring-orange-400 border-orange-400/50 scale-[1.02] shadow-md shadow-orange-500/5' : ''
                                            }`}>
                                            {styles.icon}
                                            <span className="text-[9px] font-black tracking-tight uppercase block leading-none">
                                                {day.status}
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
