import React, { useState } from 'react';
import dayjs from 'dayjs';
import {
    formatToLocalDateStr,
    formatDateToVietnamese,
    getMonthYearHeading,
    getMonthDatesList,
    getMonthWeekdayPadding
} from '../../shared/utils/dateUtils';
import Icon from '../shared/Icon';

// [WHY] Component to render an interactive, beautiful monthly calendar for flexible daily shift assignments.
const FlexibleShiftCalendar = ({
    flexibleShifts,
    selectedCalendarDate,
    setSelectedCalendarDate,
    handleSelectDayShift,
    isDateOnLeave,
    isDateInPast
}) => {
    const [currentMonthDate, setCurrentMonthDate] = useState(new Date());

    const today = dayjs();
    const startOfCurrentMonth = today.startOf('month');
    const startOfNextMonth = today.add(1, 'month').startOf('month');

    const isNextMonth = dayjs(currentMonthDate).isSame(startOfNextMonth, 'month');

    const handlePrevMonth = () => {
        if (isNextMonth) {
            setCurrentMonthDate(startOfCurrentMonth.toDate());
        }
    };

    const handleNextMonth = () => {
        if (!isNextMonth) {
            setCurrentMonthDate(startOfNextMonth.toDate());
        }
    };

    return (
        <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-3 sm:p-4 space-y-4">
            
            {/* Calendar Navigation Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={handlePrevMonth}
                        disabled={!isNextMonth}
                        className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-all ${
                            isNextMonth 
                                ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-90 cursor-pointer shadow-sm' 
                                : 'bg-slate-100/50 border-slate-100 text-slate-300 cursor-not-allowed'
                        }`}
                        title="Tháng trước"
                    >
                        <Icon name="chevronLeft" className="w-4 h-4" size={16} strokeWidth={2.5} />
                    </button>
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wider select-none min-w-[100px] text-center">
                        Tháng {getMonthYearHeading(currentMonthDate)}
                    </span>
                    <button
                        type="button"
                        onClick={handleNextMonth}
                        disabled={isNextMonth}
                        className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-all ${
                            !isNextMonth 
                                ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-90 cursor-pointer shadow-sm' 
                                : 'bg-slate-100/50 border-slate-100 text-slate-300 cursor-not-allowed'
                        }`}
                        title="Tháng sau"
                    >
                        <Icon name="chevronRight" className="w-4 h-4" size={16} strokeWidth={2.5} />
                    </button>
                </div>
                <span className="text-[9px] text-slate-400 font-bold self-end sm:self-auto bg-slate-100/70 px-2.5 py-1 rounded-lg">
                    Đã đăng ký: {Object.keys(flexibleShifts).length} ngày
                </span>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 text-center">
                {/* Weekday headers */}
                {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => (
                    <span key={d} className="text-[9px] font-black text-slate-400 py-1 uppercase">{d}</span>
                ))}

                {/* Padding empty slots */}
                {Array.from({ length: getMonthWeekdayPadding(currentMonthDate) }).map((_, i) => (
                    <div key={`pad-${i}`} className="aspect-[1.4]"></div>
                ))}

                {/* Days of the month */}
                {getMonthDatesList(currentMonthDate).map((date, idx) => {
                    const dateStr = formatToLocalDateStr(date);
                    const isLeave = isDateOnLeave(dateStr);
                    const isPast = isDateInPast(dateStr);
                    const shift = flexibleShifts[dateStr];
                    const isSelected = selectedCalendarDate && formatToLocalDateStr(selectedCalendarDate) === dateStr;

                    let bgClass = 'bg-white hover:bg-slate-50 border-slate-200/50 text-slate-700';
                    let dotColor = '';

                    if (isLeave) {
                        bgClass = 'bg-red-50/70 border-red-100 text-red-500 cursor-not-allowed opacity-80';
                    } else if (isPast) {
                        // Past read-only dates styled cleanly with lower opacity & desaturation
                        if (shift === 'Ca sáng') {
                            bgClass = 'bg-orange-50/40 border-orange-200/40 text-orange-500/70 opacity-60';
                            dotColor = 'bg-orange-400/60';
                        } else if (shift === 'Ca tối') {
                            bgClass = 'bg-indigo-50/40 border-indigo-200/40 text-indigo-500/70 opacity-60';
                            dotColor = 'bg-indigo-400/60';
                        } else if (shift === 'Ca full time') {
                            bgClass = 'bg-emerald-50/40 border-emerald-200/40 text-emerald-500/70 opacity-60';
                            dotColor = 'bg-emerald-400/60';
                        } else {
                            bgClass = 'bg-slate-100/50 border-slate-200/30 text-slate-400/75 opacity-55';
                        }
                    } else if (shift === 'Ca sáng') {
                        bgClass = 'bg-orange-50 border-orange-200 text-orange-700 font-bold';
                        dotColor = 'bg-orange-500';
                    } else if (shift === 'Ca tối') {
                        bgClass = 'bg-indigo-50 border-indigo-200 text-indigo-700 font-bold';
                        dotColor = 'bg-indigo-500';
                    } else if (shift === 'Ca full time') {
                        bgClass = 'bg-emerald-50 border-emerald-200 text-emerald-700 font-bold';
                        dotColor = 'bg-emerald-500';
                    }

                    return (
                        <button
                            key={idx}
                            type="button"
                            disabled={isLeave}
                            onClick={() => setSelectedCalendarDate(date)}
                            className={`item-calendar aspect-[1.4] rounded-xl border flex flex-col items-center justify-between p-1 sm:p-1.5 transition-all relative cursor-pointer ${bgClass} ${isSelected ? 'ring-2 ring-orange-500/80 z-10 shadow-sm' : ''
                                }`}
                        >
                            <span className="text-[10px] font-black tracking-tight leading-none">
                                {date.getDate()}
                            </span>

                            {isLeave ? (
                                <span className="text-[6px] font-black text-red-500 uppercase tracking-tight scale-90 leading-none">OFF</span>
                            ) : dotColor ? (
                                <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
                            ) : isPast ? (
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-200/20"></span>
                            ) : (
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-200/40"></span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Selected Date Custom Shift Configuration Panel */}
            {selectedCalendarDate && (
                <div className="p-3 bg-white rounded-xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">

                    <h5 className="!text-[11px] font-black text-slate-800 uppercase mt-0.5 font-bold">
                        {formatDateToVietnamese(selectedCalendarDate)}
                        {isDateOnLeave(formatToLocalDateStr(selectedCalendarDate)) ? (
                            <span className="text-red-500 text-[9px] font-black uppercase tracking-wider ml-2 bg-red-50 px-1.5 py-0.5 rounded">Đang nghỉ phép</span>
                        ) : isDateInPast(formatToLocalDateStr(selectedCalendarDate)) ? (
                            <span className="text-slate-400 text-[9px] font-black uppercase tracking-wider ml-2 bg-slate-100 px-1.5 py-0.5 rounded">Lịch sử (Chỉ đọc)</span>
                        ) : null}
                    </h5>

                    {!isDateOnLeave(formatToLocalDateStr(selectedCalendarDate)) && (
                        isDateInPast(formatToLocalDateStr(selectedCalendarDate)) ? (
                            <div className="text-[9px] font-black uppercase tracking-wider text-slate-400 bg-slate-50 border border-slate-100 px-2.5 py-1.5 rounded-lg">
                                {flexibleShifts[formatToLocalDateStr(selectedCalendarDate)]
                                    ? `Đã làm: ${flexibleShifts[formatToLocalDateStr(selectedCalendarDate)]}`
                                    : 'Không đăng ký ca'}
                            </div>
                        ) : (
                            <div className="flex gap-1">
                                {['Ca sáng', 'Ca tối', 'Ca full time'].map(sh => {
                                    const isAct = flexibleShifts[formatToLocalDateStr(selectedCalendarDate)] === sh;
                                    let btnColor = 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50';
                                    if (isAct) {
                                        if (sh === 'Ca sáng') btnColor = 'bg-orange-500 border-orange-500 text-white shadow-sm shadow-orange-500/10';
                                        if (sh === 'Ca tối') btnColor = 'bg-indigo-500 border-indigo-500 text-white shadow-sm shadow-indigo-500/10';
                                        if (sh === 'Ca full time') btnColor = 'bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-500/10';
                                    }
                                    return (
                                        <button
                                            key={sh}
                                            type="button"
                                            onClick={() => handleSelectDayShift(formatToLocalDateStr(selectedCalendarDate), sh)}
                                            className={`px-1.5 md:px-2.5 py-1.5 rounded-sm text-[9px] font-black uppercase tracking-wider transition-all border cursor-pointer ${btnColor}`}
                                        >
                                            {sh.replace('Ca ', '')}
                                        </button>
                                    );
                                })}
                                {flexibleShifts[formatToLocalDateStr(selectedCalendarDate)] && (
                                    <button
                                        type="button"
                                        onClick={() => handleSelectDayShift(formatToLocalDateStr(selectedCalendarDate), null)}
                                        className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-500 border border-red-100 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer"
                                    >
                                        Xóa ca
                                    </button>
                                )}
                            </div>
                        )
                    )}
                </div>
            )}
        </div>
    );
};

export default FlexibleShiftCalendar;
