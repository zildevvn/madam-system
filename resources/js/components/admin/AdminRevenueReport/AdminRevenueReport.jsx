import React from 'react';
import { useRevenueReport } from '../../../hooks/useRevenueReport';
import RevenuePeriodSelector from './RevenuePeriodSelector';
import RevenueDateFilters from './RevenueDateFilters';
import RevenueStatsContent from './RevenueStatsContent';

/**
 * AdminRevenueReport Component
 * [WHY] Provides a dedicated interface for financial performance analysis.
 * [RULE] Adheres to Rule 118 by splitting logic into useRevenueReport hook 
 * and modular sub-components in the ./reporting directory.
 */
const AdminRevenueReport = () => {
    const {
        period,
        selectedDate,
        startDate,
        endDate,
        stats,
        loading,
        periods,
        setSelectedDate,
        setStartDate,
        setEndDate,
        handlePeriodChange,
        getWeekRange
    } = useRevenueReport();

    /**
     * Initial Load Shimmer
     * [WHY] Provides immediate feedback during the first data fetch.
     * [RULE] Minimalist loader to avoid layout shifts.
     */
    if (loading && !stats) {
        return (
            <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[16px] border border-slate-100 shadow-sm animate-pulse">
                <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-orange-500 animate-spin mb-4"></div>
                <p className="text-slate-400 font-bold text-[11px] tracking-widest uppercase">Đang tổng hợp báo cáo...</p>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Unified Revenue Report Card */}
            <div className={`bg-white rounded-[16px] shadow-sm border border-slate-100 transition-all duration-500 ${loading ? 'opacity-50' : 'opacity-100'}`}>
                
                {/* Header Section: Period Selection & Filters */}
                <div className="p-4 lg:p-6 border-b border-slate-50 bg-slate-50/30 rounded-t-[16px]">
                    <div className="flex flex-col md:flex-row items-center gap-4 justify-between">
                        <RevenuePeriodSelector 
                            periods={periods}
                            currentPeriod={period}
                            onPeriodChange={handlePeriodChange}
                        />

                        <RevenueDateFilters 
                            period={period}
                            selectedDate={selectedDate}
                            startDate={startDate}
                            endDate={endDate}
                            setSelectedDate={setSelectedDate}
                            setStartDate={setStartDate}
                            setEndDate={setEndDate}
                            getWeekRange={getWeekRange}
                        />
                    </div>
                </div>

                {/* Content Section: Metrics & Analytics */}
                <RevenueStatsContent 
                    stats={stats}
                    loading={loading}
                />
            </div>
        </div>
    );
};

export default AdminRevenueReport;
