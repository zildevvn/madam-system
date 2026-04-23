import React from 'react';
import AdminRevenueReport from '../../components/admin/AdminRevenueReport/AdminRevenueReport';
import RevenueExpensesContent from '../../components/admin/AdminRevenueReport/RevenueExpensesContent';

/**
 * RevenuePage Component
 * [WHY] Acts as the parent layout for administrative financial reports.
 * [RULE] Renders independent report modules (Revenue, Expenses) as siblings.
 */
const RevenuePage = () => {
    return (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Revenue Report Section (Self-contained with its own filters) */}
            <AdminRevenueReport />

            {/* Expenses Report Section */}
            {/* <RevenueExpensesContent /> */}
        </div>
    );
};

export default RevenuePage;
