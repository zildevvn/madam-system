import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAdminLogic } from '../hooks/useAdminLogic';
import TableManagement from '../components/admin/TableManagement';
import ProductManagement from '../components/admin/ProductManagement';
import UserManagement from '../components/admin/UserManagement';
import AdminRevenueReport from '../components/admin/AdminRevenueReport';

// [WHY] Main layout for the Admin section.
// [RULE] High-level container, logic delegated to sub-components and hooks.
export default function Admin() {
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'system';

    const setActiveTab = (tabId) => {
        setSearchParams({ tab: tabId });
    };

    const {
        users,
        loading,
        updating,
        currentUser,
        testingPrinter,
        testingWS,
        logs,
        setLogs,
        testPrinter,
        testWebsocket,
        fetchUsers,
        handleRoleChange,
        roles
    } = useAdminLogic();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#0a0f1e]">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-4 border-white/5 border-t-orange-500 animate-spin"></div>
                </div>
            </div>
        );
    }

    const tabs = [
        { id: 'system', label: 'Hệ thống' },
        { id: 'personnel', label: 'Nhân sự' },
        { id: 'tables', label: 'Quản lý Bàn' },
        { id: 'products', label: 'Quản lý Menu' },
    ];

    return (
        <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-orange-100 selection:text-orange-900">
            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0">
                <div className="flex-1 p-4 lg:p-6 custom-scrollbar pb-33 lg:pb-16 bg-[#f0f4f8]">
                    <div className="max-w-7xl mx-auto">
                        {activeTab === 'system' ? (
                            <AdminRevenueReport />
                        ) : activeTab === 'personnel' ? (
                            <UserManagement currentUser={currentUser} />
                        ) : activeTab === 'tables' ? (
                            <TableManagement />
                        ) : activeTab === 'products' ? (
                            <ProductManagement />
                        ) : (
                            <div className="flex items-center justify-center h-64 text-slate-400 italic font-medium bg-white rounded-[32px] border border-slate-100 shadow-sm animate-in fade-in duration-500">
                                Section "{tabs.find(t => t.id === activeTab)?.label}" is coming soon...
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
