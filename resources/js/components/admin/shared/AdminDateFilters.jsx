import React from 'react';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { Calendar } from '../../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover';
import { Button } from '../../ui/button';
import { cn } from '../../../lib/utils';

/**
 * AdminDateFilters
 * [WHY] Houses all popover selectors for specific report dates across the admin panel.
 * [RULE] Decoupled from state, communicates changes via callback props.
 * Reusable for any admin section requiring Date, Week, Month, Year filtering.
 */
const AdminDateFilters = ({
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

    // [WHY] Parsing once at the top level avoids repetitive splitting/parsing logic inside the JSX.
    const dateObj = parseISO(selectedDate);
    const currentYear = dateObj.getFullYear();
    const currentMonthIdx = dateObj.getMonth();

    return (
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            {period === 'day' && (
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="h-[42px] px-4 rounded-[18px] bg-gray-100/80 border-gray-200/50 shadow-inner flex items-center gap-2 transition-all group hover:bg-white hover:border-orange-200">
                            <CalendarIcon className="w-3.5 h-3.5 text-slate-400 group-hover:text-orange-500 transition-colors" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-orange-500">{format(dateObj, 'dd/MM/yyyy')}</span>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                        <Calendar
                            mode="single"
                            selected={dateObj}
                            onSelect={(date) => date && setSelectedDate(format(date, 'yyyy-MM-dd'))}
                            disabled={{ after: new Date() }}
                            weekStartsOn={1}
                            locale={vi}
                            initialFocus
                            className={cn("rounded-md border shadow")}
                            classNames={{
                                outside: "opacity-100 text-slate-900 hover:bg-slate-100 rounded-md aria-selected:bg-orange-600 aria-selected:text-white aria-selected:opacity-100"
                            }}
                        />
                    </PopoverContent>
                </Popover>
            )}

            {period === 'week' && (
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="h-[42px] px-4 rounded-[18px] bg-gray-100/80 border-gray-200/50 shadow-inner flex items-center gap-2 transition-all group hover:bg-white hover:border-orange-200">
                            <CalendarIcon className="w-3.5 h-3.5 text-slate-400 group-hover:text-orange-500 transition-colors" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-orange-500">
                                {format(parseISO(startDate), 'dd/MM', { locale: vi })} - {format(parseISO(endDate), 'dd/MM/yyyy', { locale: vi })}
                            </span>
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
                            className={cn("rounded-md border shadow")}
                            classNames={{
                                outside: "opacity-100 text-slate-900 hover:bg-slate-100 rounded-md aria-selected:bg-orange-600 aria-selected:text-white aria-selected:opacity-100"
                            }}
                        />
                    </PopoverContent>
                </Popover>
            )}

            {period === 'month' && (
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="h-[42px] px-4 rounded-[18px] bg-gray-100/80 border-gray-200/50 shadow-inner flex items-center gap-2 transition-all group hover:bg-white hover:border-orange-200">
                            <CalendarIcon className="w-3.5 h-3.5 text-slate-400 group-hover:text-orange-500 transition-colors" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-orange-500">
                                {format(dateObj, 'MMMM yyyy', { locale: vi })}
                            </span>
                            <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-orange-500 transition-colors" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-4 w-72" align="end">
                        <div className="flex items-center justify-between mb-4 px-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Năm {currentYear}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            {months.map((m, i) => {
                                const isFuture = currentYear === new Date().getFullYear() && i > new Date().getMonth();
                                const isActive = currentMonthIdx === i;

                                return (
                                    <button
                                        key={m}
                                        disabled={isFuture}
                                        onClick={() => {
                                            const newDate = new Date(currentYear, i, 1);
                                            setSelectedDate(format(newDate, 'yyyy-MM-dd'));
                                        }}
                                        className={cn(
                                            "px-2 py-3.5 text-[10px] font-black uppercase tracking-widest rounded-xl text-center transition-all border",
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
                        <Button variant="outline" className="h-[42px] px-4 rounded-[18px] bg-gray-100/80 border-gray-200/50 shadow-inner flex items-center gap-2 transition-all group hover:bg-white hover:border-orange-200">
                            <CalendarIcon className="w-3.5 h-3.5 text-slate-400 group-hover:text-orange-500 transition-colors" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-orange-500">Năm {currentYear}</span>
                            <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-orange-500 transition-colors" />
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
                                        "px-2 py-4 text-[10px] font-black uppercase tracking-widest rounded-xl text-center transition-all border",
                                        currentYear === year
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

export default AdminDateFilters;
