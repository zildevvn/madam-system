import React from 'react';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { Calendar } from '../../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover';
import { Button } from '../../ui/button';
import { cn } from '../../../lib/utils';

/**
 * RevenueDateFilters
 * [WHY] Houses all popover selectors for specific report dates.
 * [RULE] Decoupled from state, communicates changes via callback props.
 */
const RevenueDateFilters = ({
    period,
    selectedDate,
    startDate,
    endDate,
    setSelectedDate,
    setStartDate,
    setEndDate,
    getWeekRange
}) => {
    const years = Array.from({ length: 12 }, (_, i) => new Date().getFullYear() - i);
    const months = [
        "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
        "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
    ];

    return (
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            {period === 'day' && (
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="h-auto px-4 py-2 rounded-[14px] flex flex-col items-start bg-white border-slate-100 shadow-sm hover:border-orange-200 transition-all">
                            <span className="text-[6px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">Chọn ngày</span>
                            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-800">
                                <CalendarIcon className="w-3 h-3 text-orange-500" />
                                {format(parseISO(selectedDate), 'dd/MM/yyyy')}
                            </div>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                        <Calendar
                            mode="single"
                            selected={parseISO(selectedDate)}
                            onSelect={(date) => date && setSelectedDate(format(date, 'yyyy-MM-dd'))}
                            disabled={{ after: new Date() }}
                            weekStartsOn={1}
                            locale={vi}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
            )}

            {period === 'week' && (
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="h-auto px-4 py-2 rounded-[14px] flex flex-col items-start bg-white border-slate-100 shadow-sm hover:border-orange-200 transition-all">
                            <span className="text-[6px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">Chọn tuần</span>
                            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-800">
                                <CalendarIcon className="w-3 h-3 text-orange-500" />
                                {format(parseISO(startDate), 'dd/MM', { locale: vi })} - {format(parseISO(endDate), 'dd/MM/yyyy', { locale: vi })}
                            </div>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                        <Calendar
                            mode="single"
                            selected={parseISO(startDate)}
                            onSelect={(date) => {
                                if (date) {
                                    const weekRange = getWeekRange(date);
                                    setStartDate(weekRange.start);
                                    setEndDate(weekRange.end);
                                }
                            }}
                            modifiers={{
                                selectedWeek: {
                                    from: parseISO(startDate),
                                    to: parseISO(endDate)
                                }
                            }}
                            modifiersClassNames={{
                                selectedWeek: "bg-orange-100 text-orange-900 rounded-none first:rounded-l-md last:rounded-r-md opacity-100"
                            }}
                            disabled={{ after: new Date() }}
                            weekStartsOn={1}
                            locale={vi}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
            )}

            {period === 'month' && (
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="h-auto px-4 py-2 rounded-[14px] flex flex-col items-start bg-white border-slate-100 shadow-sm hover:border-orange-200">
                            <span className="text-[6px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">Chọn tháng</span>
                            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-800 uppercase">
                                {format(parseISO(selectedDate), 'MMMM yyyy', { locale: vi })}
                                <ChevronDown className="w-3 h-3 text-slate-400" />
                            </div>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-4 w-72" align="end">
                        <div className="flex items-center justify-between mb-4 px-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Năm {selectedDate.split('-')[0]}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            {months.map((m, i) => {
                                const isFuture = parseInt(selectedDate.split('-')[0]) === new Date().getFullYear() && i > new Date().getMonth();
                                const isActive = parseInt(selectedDate.split('-')[1]) === i + 1;

                                return (
                                    <button
                                        key={m}
                                        disabled={isFuture}
                                        onClick={() => {
                                            const currentYear = selectedDate.split('-')[0];
                                            setSelectedDate(`${currentYear}-${(i + 1).toString().padStart(2, '0')}-01`);
                                        }}
                                        className={cn(
                                            "px-2 py-3.5 text-[10px] font-bold rounded-xl text-center transition-all border",
                                            isActive
                                                ? "bg-orange-600 text-white border-orange-600 shadow-md scale-105"
                                                : "text-slate-600 border-transparent hover:border-slate-100 hover:bg-slate-50",
                                            isFuture
                                                ? "opacity-20 cursor-not-allowed grayscale border-transparent"
                                                : ""
                                        )}
                                    >
                                        {m.replace('Tháng ', 'T')}
                                    </button>
                                );
                            })}
                        </div>
                    </PopoverContent>
                </Popover>
            )}

            {period === 'year' && (
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="h-auto px-4 py-2 rounded-[14px] flex flex-col items-start bg-white border-slate-100 shadow-sm hover:border-orange-200">
                            <span className="text-[6px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">Chọn năm</span>
                            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-800">
                                {selectedDate.split('-')[0]}
                                <ChevronDown className="w-3 h-3 text-slate-400" />
                            </div>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-4 w-72" align="end">
                        <div className="mb-4 px-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Lịch sử {years[years.length - 1]} - {years[0]}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            {years.map(year => (
                                <button
                                    key={year}
                                    onClick={() => setSelectedDate(`${year}-01-01`)}
                                    className={cn(
                                        "px-2 py-4 text-[11px] font-bold rounded-xl text-center transition-all border",
                                        selectedDate.startsWith(year.toString())
                                            ? "bg-orange-600 text-white border-orange-600 shadow-md scale-105"
                                            : "text-slate-600 border-transparent hover:border-slate-100 hover:bg-slate-50"
                                    )}
                                >
                                    {year}
                                </button>
                            ))}
                        </div>
                    </PopoverContent>
                </Popover>
            )}
        </div>
    );
};

export default RevenueDateFilters;
