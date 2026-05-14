import React from 'react';
import { useRevenueReport } from '../../hooks/useRevenueReport';
import AdminRevenueReport from '../../components/admin/AdminRevenueReport/AdminRevenueReport';
import AdminProfitReport from '../../components/admin/AdminRevenueReport/AdminProfitReport';
import AdminExpenses from '../../components/admin/AdminRevenueReport/AdminExpenses';
import AdminPeriodSelector from '../../components/admin/shared/AdminPeriodSelector';
import AdminDateFilters from '../../components/admin/shared/AdminDateFilters';

/**
 * AdminContent Component
 * [WHY] Acts as the primary content container for administrative financial reports.
 * [RULE] Renders independent report modules (Revenue, Expenses, Profit) as siblings.
 * Now manages global filtering state to ensure consistency across all sections.
 */
const AdminContent = () => {
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

    return (
        <div className="admin-content flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            {/* ─── HEADER: Exact Match to Design ─── */}
            <div className="border-b border-slate-100 p-4 lg:px-8 lg:py-4 sticky top-0 z-[60] -mx-4 lg:-mx-8">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    <div>
                        <h1 className="h3">Quản trị Tài chính</h1>
                    </div>

                    <div className="flex items-center gap-3 w-full lg:w-auto">
                        <div className="flex-1 lg:flex-none">
                            <AdminPeriodSelector
                                periods={periods}
                                currentPeriod={period}
                                onPeriodChange={handlePeriodChange}
                            />
                        </div>

                        <div className="flex-1 lg:flex-none">
                            <AdminDateFilters
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
                </div>
            </div>

            {/* ─── TOP OVERVIEW: Profit + Quick Stats ─── */}
            <AdminProfitReport stats={stats} loading={loading} />

            {/* ─── REVENUE SECTION ─── */}
            <div className="space-y-4">
                <div className="flex items-center gap-3 px-2">
                    <div className="w-1 h-6 bg-blue-600 rounded-full" />
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em]">Phân tích doanh thu</h4>
                </div>
                <AdminRevenueReport stats={stats} loading={loading} />
            </div>

            {/* ─── EXPENSES SECTION ─── */}
            <div className="space-y-4">
                <div className="flex items-center gap-3 px-2">
                    <div className="w-1 h-6 bg-rose-600 rounded-full" />
                    <h4 className="tracking-[0.2em]">Chi phí vận hành</h4>
                </div>
                <AdminExpenses stats={stats} loading={loading} period={period} />
            </div>
        </div>
    );
};

export default AdminContent;
