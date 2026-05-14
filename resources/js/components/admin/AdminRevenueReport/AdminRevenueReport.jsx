import React from 'react';
import RevenueStatsContent from './RevenueStatsContent';

/**
 * AdminRevenueReport Component
 * [WHY] Provides a dedicated interface for financial performance analysis.
 * [RULE] Now respects global filters managed by its parent (AdminContent).
 */
const AdminRevenueReport = ({ stats, loading }) => {
    /**
     * Initial Load Shimmer
     * [WHY] Provides immediate feedback during the first data fetch.
     * [RULE] Minimalist loader to avoid layout shifts.
     */
    if (loading && !stats) {
        return (
            <div className="flex flex-col rounded-[24px items-center justify-center py-32 bg-white ] border border-slate-100 shadow-sm">
                <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-orange-500 animate-spin mb-4"></div>
                <p className="text-slate-400 font-bold text-[11px] tracking-widest uppercase">Đang tổng hợp báo cáo doanh thu...</p>
            </div>
        );
    }

    return (
        <div className="">
            {/* Unified Revenue Report Card */}
            <div className={`bg-white rounded-[24px] shadow-sm border border-slate-100 transition-all duration-500 ${loading ? 'opacity-50' : 'opacity-100'}`}>

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
