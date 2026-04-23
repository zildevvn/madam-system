import React from 'react';
import AdminRevenueReport from '../../components/admin/AdminRevenueReport/AdminRevenueReport';
import AdminExpenses from '../../components/admin/AdminRevenueReport/AdminExpenses';

/**
 * AdminContent Component
 * [WHY] Acts as the primary content container for administrative financial reports.
 * [RULE] Renders independent report modules (Revenue, Expenses) as siblings.
 */
const AdminContent = () => {
    return (
        <div className="admin-content flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Revenue Report Section (Self-contained with its own filters) */}
            <AdminRevenueReport />

            {/* Expenses Report Section */}
            <AdminExpenses />
        </div>
    );
};

export default AdminContent;
