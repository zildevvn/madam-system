import React, { useState } from 'react';
import { useAdminLogic } from '../hooks/useAdminLogic';
import TableManagement from '../components/admin/TableManagement';
import ProductManagement from '../components/admin/ProductManagement';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminHeroStats from '../components/admin/AdminHeroStats';
import AdminPersonnelList from '../components/admin/AdminPersonnelList';
import AdminTelemetry from '../components/admin/AdminTelemetry';

// [WHY] Main layout for the Admin section.
// [RULE] High-level container, logic delegated to sub-components and hooks.
export default function Admin() {
    const [activeTab, setActiveTab] = useState('system'); // 'system' or 'tables'
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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
        { id: 'system', label: 'Hệ thống', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg> },
        { id: 'tables', label: 'Quản lý Bàn', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" /></svg> },
        { id: 'products', label: 'Quản lý Menu', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5s3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg> },
    ];

    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

    return (
        <div className="flex min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-orange-100 selection:text-orange-900 overflow-hidden">
            <AdminSidebar 
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                isMobileMenuOpen={isMobileMenuOpen}
                setIsMobileMenuOpen={setIsMobileMenuOpen}
                isSidebarCollapsed={isSidebarCollapsed}
                setIsSidebarCollapsed={setIsSidebarCollapsed}
                currentUser={currentUser}
                tabs={tabs}
            />

            {/* Sidebar Overlay (Mobile) */}
            {isMobileMenuOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[70] animate-in fade-in duration-300"
                    onClick={toggleMobileMenu}
                />
            )}

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                {/* Modern Header / Branding (Mobile) */}
                <header className="lg:hidden h-16 bg-[#0a0f1e]/95 backdrop-blur-xl text-white flex items-center justify-between px-6 flex-shrink-0 border-b border-white/5 z-[60]">
                    <button
                        onClick={toggleMobileMenu}
                        className="w-10 h-10 -ml-2 flex items-center justify-center rounded-xl bg-white/5 text-slate-400 active:scale-90 transition-all"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16m-7 6h7" /></svg>
                    </button>
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center shadow-lg shadow-orange-500/20">
                            <span className="text-sm font-black italic">M</span>
                        </div>
                        <span className="text-base font-black tracking-tight">MADAM <span className="text-orange-500 italic">POS</span></span>
                    </div>
                    <div className="w-10"></div>
                </header>

                <div className="flex-1 overflow-y-auto p-4 sm:p-10 lg:p-16 custom-scrollbar pb-33 lg:pb-16 bg-[#f0f4f8]">
                    <div className="max-w-7xl mx-auto">
                        <header className="mb-8 sm:mb-16">
                            <div className="flex items-center gap-3 mb-4 group">
                                <span className="h-1 w-10 bg-orange-500 rounded-full group-hover:w-14 transition-all duration-500"></span>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                                    {activeTab === 'system' ? 'Master Overview' : tabs.find(t => t.id === activeTab)?.label || 'Management'}
                                </span>
                            </div>
                        </header>

                        {activeTab === 'system' ? (
                            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                                <AdminHeroStats users={users} />
                                <div className="grid grid-cols-1 2xl:grid-cols-5 gap-6 xl:gap-12">
                                    <AdminPersonnelList 
                                        users={users} 
                                        fetchUsers={fetchUsers} 
                                        updating={updating} 
                                        currentUser={currentUser} 
                                        roles={roles} 
                                        handleRoleChange={handleRoleChange} 
                                    />
                                    <div className="2xl:col-span-2 flex flex-col gap-6 xl:gap-12 flex-1">
                                        <AdminTelemetry 
                                            testPrinter={testPrinter} 
                                            testingPrinter={testingPrinter} 
                                            testWebsocket={testWebsocket} 
                                            testingWS={testingWS} 
                                            setLogs={setLogs} 
                                            logs={logs} 
                                        />
                                    </div>
                                </div>
                            </div>
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

                {/* Hybrid Mobile Navigation */}
                <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-20 bg-[#0a0f1e]/98 backdrop-blur-2xl border-t border-white/5 z-[100] flex items-center justify-around px-10 rounded-t-[32px] shadow-[0_-15px_50px_rgba(0,0,0,0.6)] safe-area-inset-bottom animate-in slide-in-from-bottom-12 duration-700">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex flex-col items-center justify-center gap-1.5 transition-all duration-500 relative px-4 py-2 ${activeTab === tab.id ? 'text-white' : 'text-slate-600 active:text-white'}`}
                        >
                            <span className={`transition-all duration-500 ${activeTab === tab.id ? 'scale-110 text-orange-500 drop-shadow-[0_0_12px_rgba(249,115,22,0.6)]' : 'active:scale-95'}`}>
                                {tab.icon}
                            </span>
                            <span className={`text-[9px] font-black uppercase tracking-widest transition-opacity duration-500 ${activeTab === tab.id ? 'opacity-100' : 'opacity-40'}`}>{tab.label}</span>
                            {activeTab === tab.id && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-orange-500 rounded-full blur-[1px]"></div>}
                        </button>
                    ))}
                    <button
                        onClick={toggleMobileMenu}
                        className={`flex flex-col items-center justify-center gap-1.5 transition-all duration-500 relative px-4 py-2 ${isMobileMenuOpen ? 'text-orange-500' : 'text-slate-600 active:text-white'}`}
                    >
                        <span className={`transition-all duration-500 ${isMobileMenuOpen ? 'scale-110 drop-shadow-[0_0_12px_rgba(249,115,22,0.6)]' : 'active:scale-95'}`}>
                            <svg className="w-5 h-5 font-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16m-7 6h7" /></svg>
                        </span>
                        <span className={`text-[9px] font-black uppercase tracking-widest transition-opacity duration-500 ${isMobileMenuOpen ? 'opacity-100' : 'opacity-40'}`}>Danh mục</span>
                    </button>
                </nav>
            </main>
        </div>
    );
}
