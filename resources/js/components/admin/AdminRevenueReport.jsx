import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { formatPrice } from '../../shared/utils/formatCurrency';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, startOfWeek, endOfWeek, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react';

/**
 * Admin Revenue Report Component
 * WHY: Provides a dedicated interface for financial performance analysis without bloating the main dashboard.
 * RULE: Houses selection filters and metric cards in a single modular component.
 */
const AdminRevenueReport = () => {
    const [period, setPeriod] = useState('day');
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const getWeekRange = useCallback((date) => {
        const start = startOfWeek(date, { weekStartsOn: 1 });
        const end = endOfWeek(date, { weekStartsOn: 1 });
        return {
            start: format(start, 'yyyy-MM-dd'),
            end: format(end, 'yyyy-MM-dd')
        };
    }, []);

    const fetchReport = useCallback(async () => {
        try {
            setLoading(true);
            let url = `/api/stats/revenue-report?period=${period}`;

            if (period === 'week' && startDate && endDate) {
                url += `&start_date=${startDate}&end_date=${endDate}`;
            } else {
                url += `&date=${selectedDate}`;
            }

            const res = await axios.get(url);
            setStats(res.data.data);
        } catch (error) {
            console.error('Failed to fetch revenue report:', error);
        } finally {
            setLoading(false);
        }
    }, [period, selectedDate, startDate, endDate]);

    useEffect(() => {
        const handler = setTimeout(() => {
            fetchReport();
        }, 300);

        return () => clearTimeout(handler);
    }, [fetchReport]);

    const periods = [
        { id: 'day', label: 'Ngày' },
        { id: 'week', label: 'Tuần' },
        { id: 'month', label: 'Tháng' },
        { id: 'year', label: 'Năm' },
    ];

    const handlePeriodChange = (newPeriod) => {
        setPeriod(newPeriod);
        const today = new Date();
        setSelectedDate(format(today, 'yyyy-MM-dd'));

        if (newPeriod === 'week') {
            const range = getWeekRange(today);
            setStartDate(range.start);
            setEndDate(range.end);
        }
    };

    if (loading && !stats) {
        return (
            <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[16px] border border-slate-100 shadow-sm animate-pulse">
                <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-orange-500 animate-spin mb-4"></div>
                <p className="text-slate-400 font-bold text-[11px] tracking-widest uppercase">Đang tổng hợp báo cáo...</p>
            </div>
        );
    }

    const years = Array.from({ length: 12 }, (_, i) => new Date().getFullYear() - i);
    const months = [
        "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
        "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
    ];

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Unified Revenue Report Card */}
            <div className={`bg-white rounded-[16px] shadow-sm border border-slate-100 transition-all duration-500 ${loading ? 'opacity-50' : 'opacity-100'}`}>
                {/* Streamlined Controls Header */}
                <div className="p-4 lg:p-6 border-b border-slate-50 bg-slate-50/30 rounded-t-[16px]">
                    <div className="flex flex-col md:flex-row items-center gap-4 justify-between">
                        {/* Period Segmented Control */}
                        <div className="flex bg-slate-200/50 p-1 rounded-[14px] w-full md:w-auto overflow-x-auto no-scrollbar">
                            {periods.map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => handlePeriodChange(p.id)}
                                    className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap ${period === p.id
                                        ? 'bg-white text-orange-600 shadow-sm scale-[1.02]'
                                        : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>

                        {/* Integrated Shadcn Date Selection */}
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
                    </div>
                </div>

                {/* Main Metrics Area */}
                <div className="p-6 lg:p-10 lg:pt-0">
                    <div className="flex flex-col items-center">
                        <h3 className="mb-3 text-slate-400 text-[11px] font-black uppercase tracking-[0.25em]">Tổng doanh thu</h3>
                        <div className="flex items-baseline gap-2 mb-10">
                            <span className="h3 mdt-text-primary text-4xl lg:text-7xl tracking-tighter">{formatPrice(stats?.total_revenue)}</span>
                            <span className="text-xl lg:text-2xl font-black text-slate-400 tracking-widest uppercase">vnd</span>
                        </div>

                        <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-slate-100 to-transparent mb-10"></div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                            <div className="bg-blue-50/30 p-6 rounded-[20px] border border-blue-100/50 group transition-all hover:bg-blue-50">
                                <p className="text-blue-500/60 text-[9px] font-black uppercase tracking-widest mb-3">Tổng đơn</p>
                                <div className="flex items-center justify-between">
                                    <div className="text-3xl font-black text-slate-900 tracking-tight">{stats?.total_orders}</div>
                                    <div className="p-3 bg-white rounded-xl text-blue-500 shadow-sm group-hover:scale-110 transition-transform"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg></div>
                                </div>
                            </div>

                            <div className="bg-green-50/30 p-6 rounded-[20px] border border-green-100/50 group transition-all hover:bg-green-50">
                                <p className="text-green-600/60 text-[9px] font-black uppercase tracking-widest mb-3">Khách lẻ</p>
                                <div className="flex items-center justify-between">
                                    <div className="text-3xl font-black text-slate-900 tracking-tight">{stats?.individual_orders}</div>
                                    <div className="p-3 bg-white rounded-xl text-green-500 shadow-sm group-hover:scale-110 transition-transform"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg></div>
                                </div>
                            </div>

                            <div className="bg-purple-50/30 p-6 rounded-[20px] border border-purple-100/50 group transition-all hover:bg-purple-50">
                                <p className="text-purple-600/60 text-[9px] font-black uppercase tracking-widest mb-3">Khách đoàn</p>
                                <div className="flex items-center justify-between">
                                    <div className="text-3xl font-black text-slate-900 tracking-tight">{stats?.group_orders}</div>
                                    <div className="p-3 bg-white rounded-xl text-purple-600 shadow-sm group-hover:scale-110 transition-transform"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminRevenueReport;
