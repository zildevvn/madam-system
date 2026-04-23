import React, { useMemo } from 'react';
import { Calendar as CalendarIcon, FilterX, Clock, ChevronDown } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Calendar } from '../../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover';
import { Button } from '../../ui/button';

/**
 * Expense Advanced Filters Component
 * WHY: Adheres to component rule (<200 lines) by extracting advanced filtering logic.
 * Redesigned with premium UI components for a modern, clean look.
 */
const ExpenseAdvancedFilters = ({
    yearFilter, setYearFilter,
    monthFilter, setMonthFilter,
    dateFilter, setDateFilter
}) => {
    const currentYearStr = useMemo(() => new Date().getFullYear().toString(), []);

    const yearRange = useMemo(() => {
        const currentYear = new Date().getFullYear();
        const startYear = currentYear - 5;
        const years = [];
        for (let y = currentYear + 1; y >= startYear; y--) {
            years.push(y);
        }
        return years;
    }, []);

    const isFilterDirty = useMemo(() => {
        return monthFilter !== '' || dateFilter !== '' || yearFilter !== currentYearStr;
    }, [monthFilter, dateFilter, yearFilter, currentYearStr]);

    return (
        <div className="mt-6 flex flex-wrap items-center gap-2.5 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="flex items-center gap-2.5 w-full md:w-auto">
                {/* Month/Year Selection Group */}
                <div className="flex items-center bg-white rounded-md border border-slate-100 shadow-sm transition-all group overflow-hidden h-[46px] flex-1 md:flex-none min-w-0">
                <div className="flex items-center pl-3 pr-2 border-r border-slate-50 bg-slate-50/50 transition-colors h-full">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                </div>



                <div className="flex items-center px-2 flex-1 gap-1">
                    <div className="relative flex-1">
                        <select
                            value={monthFilter}
                            onChange={(e) => {
                                const val = e.target.value;
                                setMonthFilter(val);
                                setDateFilter('');
                                if (val && !yearFilter) {
                                    setYearFilter(currentYearStr);
                                }
                            }}
                            className="w-full bg-transparent border-none text-[13px] font-bold text-slate-800 focus:ring-0 p-0 cursor-pointer appearance-none text-center"
                        >
                            <option value="">Tất cả tháng</option>
                            {Array.from({ length: 12 }, (_, i) => {
                                const m = (i + 1).toString().padStart(2, '0');
                                return <option key={m} value={m}>Tháng {m}</option>;
                            })}
                        </select>
                    </div>

                    <span className="text-slate-300 font-light">/</span>

                    <div className="relative w-[60px]">
                        <select
                            value={yearFilter}
                            onChange={(e) => {
                                const val = e.target.value;
                                setYearFilter(val);
                                setDateFilter('');
                                if (!val) setMonthFilter('');
                            }}
                            className="w-full bg-transparent border-none text-[13px] font-bold text-slate-800 focus:ring-0 p-0 cursor-pointer appearance-none text-center"
                        >
                            <option value="">Năm</option>
                            {yearRange.map(y => (
                                <option key={y} value={y.toString()}>{y}</option>
                            ))}
                        </select>
                    </div>
                    <ChevronDown className="w-3 h-3 text-slate-300 group-hover:text-orange-400" />
                </div>
            </div>

            {/* Specific Date Picker */}
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        className="h-[46px] cursor-pointer px-3 rounded-lg bg-white border-slate-100 shadow-sm flex items-center gap-2 flex-1 md:flex-none transition-all group min-w-0"
                    >
                        <div className="flex items-center gap-2">
                            <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-[13px] font-bold text-slate-800">
                                {dateFilter ? format(parseISO(dateFilter), 'dd/MM/yyyy') : 'dd/MM/yyyy'}
                            </span>
                        </div>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={dateFilter ? parseISO(dateFilter) : undefined}
                        onSelect={(date) => {
                            if (date) {
                                const val = format(date, 'yyyy-MM-dd');
                                setDateFilter(val);
                                setMonthFilter('');
                                setYearFilter('');
                            }
                        }}
                        disabled={{ after: new Date() }}
                        locale={vi}
                        initialFocus
                    />
                </PopoverContent>
            </Popover>
        </div>

            {/* Clear Action */}
            {isFilterDirty && (
                <button
                    onClick={() => {
                        setMonthFilter('');
                        setYearFilter(currentYearStr);
                        setDateFilter('');
                    }}
                    className="h-[46px] px-5 w-full sm:w-auto rounded-lg bg-orange-50/50 text-orange-600 border border-orange-100/50 hover:bg-orange-50 hover:border-orange-200 transition-all active:scale-95 flex items-center justify-center gap-2 group sm:flex-none"
                    title="Xóa bộ lọc"
                >
                    <FilterX className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Xóa bộ lọc</span>
                </button>
            )}
        </div>
    );
};

export default ExpenseAdvancedFilters;
