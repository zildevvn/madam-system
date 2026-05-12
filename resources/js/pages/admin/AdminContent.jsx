import React from 'react';
import { useRevenueReport } from '../../hooks/useRevenueReport';
import AdminRevenueReport from '../../components/admin/AdminRevenueReport/AdminRevenueReport';
import AdminExpenses from '../../components/admin/AdminRevenueReport/AdminExpenses';
import AdminPeriodSelector from '../../components/admin/shared/AdminPeriodSelector';
import AdminDateFilters from '../../components/admin/shared/AdminDateFilters';

/**
 * AdminContent Component
 * [WHY] Acts as the primary content container for administrative financial reports.
 * [RULE] Renders independent report modules (Revenue, Expenses) as siblings.
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
        <div className="admin-content flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Global Admin Filter Header */}
            <div className="bg-white rounded-[16px] shadow-sm border border-slate-100 p-4 lg:p-6">
                <div className="flex flex-col md:flex-row items-center gap-4 justify-between">
                    <div className="flex flex-col md:flex-row items-center gap-4">
                        <AdminPeriodSelector
                            periods={periods}
                            currentPeriod={period}
                            onPeriodChange={handlePeriodChange}
                        />

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

            {/* Revenue Report Section */}
            <AdminRevenueReport stats={stats} loading={loading} />

            {/* Expenses Report Section */}
            <AdminExpenses stats={stats} loading={loading} period={period} />
        </div>
    );
};

export default AdminContent;
