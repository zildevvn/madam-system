import React from 'react';
import AdminRevenueReport from '../components/admin/AdminRevenueReport';

/**
 * Admin Page Component
 * WHY: Main layout for the Admin section, now focused exclusively on Revenue Reporting.
 * RULE: Delegated logic to AdminRevenueReport specialized component.
 */
export default function Admin() {
    return (
        <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-orange-100 selection:text-orange-900">
            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0">
                <div className="flex-1 p-4 lg:p-6 custom-scrollbar pb-33 lg:pb-16 bg-[#f0f4f8]">
                    <div className="max-w-7xl mx-auto">
                        <AdminRevenueReport />
                    </div>
                </div>
            </main>
        </div>
    );
}

