import React, { useState, useMemo, useCallback } from 'react';
import { useReservationStats } from '../../hooks/useReservationStats';
import Icon from '../../components/shared/Icon';
import { format, parse, subMonths, addMonths } from 'date-fns';
import { formatVND } from '../../shared/utils/formatCurrency';

/**
 * SummaryCard Component
 * [WHY] Standardizes the design of statistical dashboard indicator cards to ensure DRY compliance.
 */
const SummaryCard = React.memo(({ title, value, subtitle, iconName, bgVariant, comparison }) => {
    const bgClasses = {
        orange: 'bg-orange-50 text-orange-600',
        blue: 'bg-blue-50 text-blue-600',
        emerald: 'bg-emerald-50 text-emerald-600',
        purple: 'bg-purple-50 text-purple-600',
        teal: 'bg-teal-50 text-teal-600'
    };

    const gradientClasses = {
        orange: 'bg-orange-50',
        blue: 'bg-blue-50',
        emerald: 'bg-emerald-50',
        purple: 'bg-purple-50',
        teal: 'bg-teal-50'
    };

    return (
        <div className="bg-white rounded-md px-1.5 py-2 md:p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className={`absolute -right-4 -bottom-4 w-20 h-20 ${gradientClasses[bgVariant]} rounded-full group-hover:scale-110 transition-transform duration-500 -z-0 opacity-40`}></div>
            <div className="flex items-center justify-between mb-2.5 relative z-10">
                <span className="text-[9px] md:text-[10px] font-black text-slate-400 tracking-widest leading-tight pr-1.5">{title}</span>
                <div className={`w-6 h-6 md:w-10 md:h-10 shrink-0 rounded-md ${bgClasses[bgVariant]} flex items-center justify-center`}>
                    <Icon name={iconName} size={14} />
                </div>
            </div>
            <div className="relative z-10 flex flex-col gap-1">
                <h6 className="text-slate-900 leading-none tracking-tight break-all">
                    {value}
                </h6>
                {comparison && (
                    <div className="flex flex-col items-start gap-0.5 mt-0.5 sm:flex-row sm:items-center sm:gap-1.5 flex-wrap">
                        <span className={`inline-flex items-center gap-0.5 px-1 py-0.25 rounded-md text-[8px] md:text-[9px] font-black ${comparison.growthPercentage > 0
                            ? 'bg-emerald-50 text-emerald-600'
                            : comparison.growthPercentage < 0
                                ? 'bg-red-50 text-red-600'
                                : 'bg-slate-100 text-slate-500'
                            }`}>
                            {comparison.growthPercentage > 0 && <Icon name="trendingUp" size={7} strokeWidth={3} />}
                            {comparison.growthPercentage < 0 && <Icon name="trendingDown" size={7} strokeWidth={3} />}
                            {comparison.growthPercentage > 0 ? `+${comparison.growthPercentage}%` : `${comparison.growthPercentage}%`}
                        </span>
                        <span className="text-[8px] md:text-[9px] text-slate-400 font-bold tracking-tight">
                            MoM ({comparison.formattedPrevValue})
                        </span>
                    </div>
                )}
                <p className="text-[8px] md:text-[10px] text-slate-400 font-bold  tracking-wider mt-0.5">
                    {subtitle}
                </p>
            </div>
        </div>
    );
});

/**
 * ReservationStatsPage Component
 * [WHY] Visualizes monthly reservation revenue, top-performing companies, and month-over-month comparisons.
 * [RULE] Adheres to high-fidelity warm orange branding, HSL accents, and sleek responsive design.
 */
const ReservationStatsPage = () => {
    const {
        selectedMonth,
        setSelectedMonth,
        stats,
        loading,
        error,
        refetch
    } = useReservationStats();

    const [searchQuery, setSearchQuery] = useState('');

    const summaryCards = useMemo(() => [
        {
            title: 'Doanh thu đặt chỗ',
            value: formatVND.format(stats.summary?.total_revenue || 0),
            subtitle: 'Doanh thu tích lũy tháng',
            iconName: 'coins',
            bgVariant: 'orange'
        },
        {
            title: 'Tổng lượt đặt chỗ',
            value: stats.summary?.total_reservations || 0,
            subtitle: 'Lượt đặt chỗ được xác nhận',
            iconName: 'calendar',
            bgVariant: 'blue'
        },
        {
            title: 'Tổng số lượng khách',
            value: stats.summary?.total_guests || 0,
            subtitle: 'Khách hàng đặt trước',
            iconName: 'users',
            bgVariant: 'emerald'
        },
        {
            title: 'Đối tác phát sinh doanh thu',
            value: stats.summary?.active_companies_count || 0,
            subtitle: 'Công ty hoạt động trong tháng',
            iconName: 'briefcase',
            bgVariant: 'purple'
        }
    ], [stats.summary]);

    const groupSummaryCards = useMemo(() => [
        {
            title: 'Tổng khách đoàn',
            value: `${stats.group_summary?.guests?.current ?? 0} khách`,
            subtitle: 'Khách hàng theo đoàn',
            iconName: 'users',
            bgVariant: 'emerald',
            comparison: stats.group_summary?.guests ? {
                difference: stats.group_summary.guests.difference,
                growthPercentage: stats.group_summary.guests.growth_percentage,
                formattedPrevValue: `${stats.group_summary.guests.previous} khách`
            } : null
        },
        {
            title: 'Tổng khách lẻ',
            value: `${stats.group_summary?.individual_guests?.current ?? 0} khách`,
            subtitle: 'Khách lẻ ngoài công ty',
            iconName: 'user',
            bgVariant: 'teal',
            comparison: stats.group_summary?.individual_guests ? {
                difference: stats.group_summary.individual_guests.difference,
                growthPercentage: stats.group_summary.individual_guests.growth_percentage,
                formattedPrevValue: `${stats.group_summary.individual_guests.previous} khách`
            } : null
        },
        {
            title: 'Doanh thu Khách đoàn',
            value: formatVND.format(stats.group_summary?.revenue?.current ?? 0),
            subtitle: 'Doanh thu đoàn trong tháng',
            iconName: 'coins',
            bgVariant: 'orange',
            comparison: stats.group_summary?.revenue ? {
                difference: stats.group_summary.revenue.difference,
                growthPercentage: stats.group_summary.revenue.growth_percentage,
                formattedPrevValue: formatVND.format(stats.group_summary.revenue.previous)
            } : null
        },
        {
            title: 'Đối tác đoàn hoạt động',
            value: `${stats.group_summary?.active_companies?.current ?? 0} đối tác`,
            subtitle: 'Công ty gửi đoàn hoạt động',
            iconName: 'briefcase',
            bgVariant: 'purple',
            comparison: stats.group_summary?.active_companies ? {
                difference: stats.group_summary.active_companies.difference,
                growthPercentage: stats.group_summary.active_companies.growth_percentage,
                formattedPrevValue: `${stats.group_summary.active_companies.previous} đối tác`
            } : null
        },
        {
            title: 'Top đối tác đoàn',
            value: stats.group_summary?.top_company?.company_name || 'Không có',
            subtitle: stats.group_summary?.top_company
                ? `${formatVND.format(stats.group_summary.top_company.revenue)} (${stats.group_summary.top_company.reservations_count} booking)`
                : 'Chưa phát sinh doanh thu',
            iconName: 'trophy',
            bgVariant: 'blue'
        }
    ], [stats.group_summary]);

    // Month Navigation helpers
    const changeMonth = useCallback((offset) => {
        const currentDate = parse(selectedMonth, 'yyyy-MM', new Date());
        const newMonthDate = offset === 1 ? addMonths(currentDate, 1) : subMonths(currentDate, 1);
        setSelectedMonth(format(newMonthDate, 'yyyy-MM'));
    }, [selectedMonth, setSelectedMonth]);

    const handlePrevMonth = useCallback(() => {
        changeMonth(-1);
    }, [changeMonth]);

    const handleNextMonth = useCallback(() => {
        changeMonth(1);
    }, [changeMonth]);

    // Search and filter comparisons
    const filteredComparison = useMemo(() => {
        if (!stats.company_comparison) return [];
        return stats.company_comparison.filter(c =>
            c.company_name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [stats.company_comparison, searchQuery]);

    // Format Month for UI header
    const formattedMonthHeader = useMemo(() => {
        try {
            const date = parse(selectedMonth, 'yyyy-MM', new Date());
            return `Tháng ${format(date, 'MM/yyyy')}`;
        } catch {
            return selectedMonth;
        }
    }, [selectedMonth]);

    return (
        <div className='max-w-7xl mx-auto p-4 lg:p-8'>
            <div className="space-y-4 md:space-y-6 max-w-7xl mx-auto pb-16 md:pb-20">
                {/* Header / Month Switcher */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                    <h4 className="text-slate-900 tracking-tight uppercase">
                        Báo cáo Thống kê Đặt chỗ
                    </h4>

                    {/* Month selection controls */}
                    <div className="flex items-center gap-2 bg-white border border-slate-200 p-1.5 rounded-2xl shadow-sm self-start md:self-auto">
                        <button
                            onClick={handlePrevMonth}
                            className="p-2 hover:bg-slate-100 active:scale-95 rounded-xl text-slate-500 hover:text-slate-900 transition-all border-none bg-transparent cursor-pointer flex items-center justify-center"
                            title="Tháng trước"
                        >
                            <Icon name="chevronLeft" size={18} />
                        </button>

                        <div className="relative flex items-center">
                            <input
                                type="month"
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            />
                            <div className="px-3 py-1.5 bg-slate-50 rounded-xl text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2 pointer-events-none border border-slate-100">
                                <Icon name="calendar" size={14} className="text-orange-500" />
                                <span>{formattedMonthHeader}</span>
                                <Icon name="chevronDown" size={12} className="text-slate-400" />
                            </div>
                        </div>

                        <button
                            onClick={handleNextMonth}
                            className="p-2 hover:bg-slate-100 active:scale-95 rounded-xl text-slate-500 hover:text-slate-900 transition-all border-none bg-transparent cursor-pointer flex items-center justify-center"
                            title="Tháng sau"
                        >
                            <Icon name="chevronRight" size={18} />
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[40px] border border-slate-100 shadow-sm animate-pulse">
                        <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-orange-500 animate-spin mb-4"></div>
                        <p className="text-slate-400 font-bold text-[11px] tracking-widest uppercase">Đang đồng bộ báo cáo đặt chỗ...</p>
                    </div>
                ) : error ? (
                    <div className="py-16 px-6 flex flex-col items-center justify-center bg-white rounded-[32px] border border-red-100 shadow-sm text-center max-w-xl mx-auto animate-in fade-in duration-300">
                        <div className="w-16 h-16 bg-red-50 rounded-[24px] flex items-center justify-center text-red-500 mb-4 shadow-sm">
                            <Icon name="alert" size={28} />
                        </div>
                        <h4 className="text-slate-900 font-black text-xs uppercase tracking-wider mb-2">Đã xảy ra sự cố tải dữ liệu</h4>
                        <p className="text-slate-500 text-xs mb-6 max-w-md leading-relaxed">{error}</p>
                        <button
                            onClick={refetch}
                            className="px-6 py-3 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-[10px]  md:text-[10px]  md:text-[11px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-orange-500/20 cursor-pointer border-none"
                        >
                            Thử lại ngay
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4 md:space-y-6 animate-in fade-in duration-300">
                        {/* Group Customer Summary Cards */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <div className="w-1 h-4 bg-orange-500 rounded-full" />
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Thống kê Khách đoàn / Doanh nghiệp</span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
                                {groupSummaryCards.map((card) => (
                                    <SummaryCard key={card.title} {...card} />
                                ))}
                            </div>
                        </div>

                        {/* Top Companies List & Comparison Table */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">

                            {/* Top Companies ranked */}
                            <div className="bg-white rounded-2xl p-4 md:p-6 border border-slate-100 shadow-sm flex flex-col gap-3 md:gap-4">
                                <div className="flex items-center justify-between pb-2 border-b border-slate-50">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1 h-5 bg-orange-500 rounded-full" />
                                        <h6 className="text-slate-800 uppercase tracking-wider">Top doanh thu trong tháng</h6>
                                    </div>
                                </div>

                                {!stats.top_companies?.length ? (
                                    <div className="py-12 text-center flex flex-col items-center justify-center text-slate-400">
                                        <Icon name="briefcase" size={24} className="text-slate-300 mb-2" />
                                        <p className="text-[10px] font-black uppercase tracking-wider">Không có dữ liệu trong tháng này</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-0.5">
                                        {stats.top_companies?.map((company, index) => (
                                            <div key={company.company_name} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100/70 transition-all border border-slate-100/50">
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <div className={`w-7 h-7 shrink-0 rounded-lg flex items-center justify-center text-xs font-black ${index === 0
                                                        ? 'bg-amber-100 text-amber-700'
                                                        : index === 1
                                                            ? 'bg-slate-200 text-slate-700'
                                                            : index === 2
                                                                ? 'bg-orange-100 text-orange-700'
                                                                : 'bg-slate-100 text-slate-500'
                                                        }`}>
                                                        {index + 1}
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-[10px]  md:text-[10px]  md:text-[11px] font-black text-slate-900 truncate uppercase tracking-tight">{company.company_name}</span>
                                                        <span className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">
                                                            {company.reservations_count} book • {company.guests_count} khách
                                                        </span>
                                                    </div>
                                                </div>
                                                <span className="text-[10px]  md:text-[10px]  md:text-[11px] font-black text-slate-900 bg-white px-2 py-1 rounded-lg border border-slate-100 shrink-0 ml-2">
                                                    {formatVND.format(company.revenue)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* MoM Company comparison */}
                            <div className="bg-white rounded-2xl p-4 md:p-6 border border-slate-100 shadow-sm lg:col-span-2 flex flex-col gap-3 md:gap-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-50">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1 h-5 bg-orange-500 rounded-full" />
                                        <h6 className="text-slate-800 uppercase tracking-wider">So sánh hiệu suất với tháng trước</h6>
                                    </div>

                                    {/* Search partner */}
                                    <div className="relative max-w-xs w-full">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                            <Icon name="search" size={14} />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Tìm công ty..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="text-xs w-full bg-slate-50 border border-slate-100 rounded-xl pl-9 pr-4 py-2 text-slate-900 font-bold focus:ring-4 focus:ring-orange-500/10 focus:bg-white transition-all shadow-sm"
                                        />
                                    </div>
                                </div>

                                {!filteredComparison.length ? (
                                    <div className="py-20 text-center flex flex-col items-center justify-center text-slate-400">
                                        <Icon name="briefcase" size={24} className="text-slate-300 mb-2" />
                                        <p className="text-[10px] font-black uppercase tracking-wider">Không tìm thấy đối tác phù hợp</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto -mx-4 md:mx-0">
                                        <table className="w-full text-left" style={{ minWidth: '560px' }}>
                                            <thead>
                                                <tr className="bg-slate-50/50">
                                                    <th className="px-3 py-2.5 md:px-4 md:py-3.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Công ty</th>
                                                    <th className="px-3 py-2.5 md:px-4 md:py-3.5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Tháng này</th>
                                                    <th className="px-3 py-2.5 md:px-4 md:py-3.5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Tháng trước</th>
                                                    <th className="px-3 py-2.5 md:px-4 md:py-3.5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">MoM</th>
                                                    <th className="px-3 py-2.5 md:px-4 md:py-3.5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Book / Khách</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {filteredComparison.map((comp) => {
                                                    const isGrowthPositive = comp.growth_percentage > 0;
                                                    const isGrowthNegative = comp.growth_percentage < 0;

                                                    const resDiffText = comp.reservation_count_difference > 0 ? `+${comp.reservation_count_difference}` : comp.reservation_count_difference;
                                                    const guestDiffText = comp.guest_count_difference > 0 ? `+${comp.guest_count_difference}` : comp.guest_count_difference;

                                                    return (
                                                        <tr key={comp.company_name} className="group hover:bg-slate-50/40 transition-all">
                                                            <td className="px-3 py-2.5 md:px-4 md:py-3.5 whitespace-nowrap max-w-[140px]">
                                                                <span className="text-[10px]  md:text-[10px]  md:text-[11px] font-black text-slate-900 uppercase tracking-tight block truncate">{comp.company_name}</span>
                                                            </td>
                                                            <td className="px-3 py-2.5 md:px-4 md:py-3.5 text-right whitespace-nowrap">
                                                                <span className="text-[10px]  md:text-[10px]  md:text-[11px] font-black text-slate-900">{formatVND.format(comp.revenue_this_month)}</span>
                                                            </td>
                                                            <td className="px-3 py-2.5 md:px-4 md:py-3.5 text-right whitespace-nowrap">
                                                                <span className="text-[11px] font-bold text-slate-400">{formatVND.format(comp.revenue_last_month)}</span>
                                                            </td>
                                                            <td className="px-3 py-2.5 md:px-4 md:py-3.5 text-right whitespace-nowrap">
                                                                <div className="flex flex-col items-end">
                                                                    <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-[10px] font-black ${isGrowthPositive
                                                                        ? 'bg-emerald-50 text-emerald-600'
                                                                        : isGrowthNegative
                                                                            ? 'bg-red-50 text-red-600'
                                                                            : 'bg-slate-100 text-slate-500'
                                                                        }`}>
                                                                        {isGrowthPositive && <Icon name="trendingUp" size={9} strokeWidth={3} />}
                                                                        {isGrowthNegative && <Icon name="trendingDown" size={9} strokeWidth={3} />}
                                                                        {comp.growth_percentage > 0 ? `+${comp.growth_percentage}%` : `${comp.growth_percentage}%`}
                                                                    </span>
                                                                    {comp.revenue_difference !== 0 && (
                                                                        <span className={`text-[9px] font-bold mt-0.5 ${comp.revenue_difference > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                                                            {comp.revenue_difference > 0 ? '+' : ''}{formatVND.format(comp.revenue_difference)}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-3 py-2.5 md:px-4 md:py-3.5 text-center whitespace-nowrap">
                                                                <div className="flex items-center justify-center gap-1 text-[10px] font-black">
                                                                    <span className={`px-1.5 py-0.5 rounded-md ${comp.reservation_count_difference > 0 ? 'bg-emerald-50 text-emerald-600' : comp.reservation_count_difference < 0 ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-400'}`}>
                                                                        {resDiffText}B
                                                                    </span>
                                                                    <span className={`px-1.5 py-0.5 rounded-md ${comp.guest_count_difference > 0 ? 'bg-blue-50 text-blue-600' : comp.guest_count_difference < 0 ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-400'}`}>
                                                                        {guestDiffText}K
                                                                    </span>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReservationStatsPage;
