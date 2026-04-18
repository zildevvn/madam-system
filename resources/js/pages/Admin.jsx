import React, { useState } from 'react';
import { useAdminLogic } from '../hooks/useAdminLogic';
import TableManagement from '../components/admin/TableManagement';
import ProductManagement from '../components/admin/ProductManagement';
import { Link } from 'react-router-dom';

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
    const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

    return (
        <div className="flex min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-orange-100 selection:text-orange-900 overflow-hidden">
            {/* Sidebar Overlay (Mobile) */}
            {isMobileMenuOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[70] animate-in fade-in duration-300"
                    onClick={toggleMobileMenu}
                />
            )}

            {/* Sidebar Navigation (Desktop Drawer & Mobile Side Menu) */}
            <aside className={`fixed lg:sticky top-0 left-0 h-screen bg-[#0a0f1e] text-white flex flex-col shadow-2xl z-[80] transition-all duration-500 ease-out border-r border-white-[0.05] ${isMobileMenuOpen ? 'translate-x-0 w-80' :
                isSidebarCollapsed ? 'w-20 -translate-x-full lg:translate-x-0' : 'w-80 -translate-x-full lg:translate-x-0'
                }`}>
                {/* Brand */}
                <div className="h-24 flex items-center px-6 whitespace-nowrap overflow-hidden">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-orange-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xl shadow-orange-500/40 relative group-hover:scale-110 transition-transform">
                            <span className="text-xl font-black italic">M</span>
                            <div className="absolute inset-0 rounded-2xl bg-white/20 animate-pulse opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </div>
                        <div className={`flex flex-col transition-all duration-300 ${isSidebarCollapsed && !isMobileMenuOpen ? 'opacity-0 -translate-x-4 pointer-events-none' : 'opacity-100'}`}>
                            <span className="text-xl font-black tracking-tighter leading-none">MADAM POS</span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1.5">Admin Central</span>
                        </div>
                    </div>
                </div>

                {/* Sidebar Menu */}
                <nav className="flex-1 px-3 mt-4 space-y-1.5 overflow-y-auto custom-scrollbar">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                setActiveTab(tab.id);
                                setIsMobileMenuOpen(false);
                            }}
                            title={tab.label}
                            className={`w-full flex items-center rounded-2xl transition-all duration-300 group overflow-hidden ${isSidebarCollapsed && !isMobileMenuOpen ? 'justify-center p-3.5' : 'gap-4 px-5 py-4'
                                } ${activeTab === tab.id
                                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25 active:scale-95'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <span className={`transition-all duration-300 flex-shrink-0 ${activeTab === tab.id ? 'scale-110' : 'group-hover:scale-110'}`}>
                                {tab.icon}
                            </span>
                            <span className={`text-sm font-black transition-all duration-300 truncate ${isSidebarCollapsed && !isMobileMenuOpen ? 'w-0 opacity-0 -translate-x-4' : 'w-auto opacity-100'}`}>
                                {tab.label}
                            </span>
                        </button>
                    ))}
                </nav>

                {/* Collapse Toggle (Desktop only) */}
                <button
                    onClick={toggleSidebar}
                    className="hidden lg:flex absolute -right-3 top-32 h-6 w-6 bg-orange-500 rounded-full items-center justify-center border-2 border-[#0a0f1e] text-white hover:scale-110 transition-transform shadow-lg z-[90]"
                >
                    <svg className={`w-3 h-3 transition-transform duration-500 ${isSidebarCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                {/* Profile Section */}
                <div className="p-4 bg-black/20 border-t border-white/5">
                    <div className={`p-4 rounded-[28px] bg-white/5 border border-white/5 transition-all duration-300 overflow-hidden ${isSidebarCollapsed && !isMobileMenuOpen ? 'items-center justify-center' : ''}`}>
                        <div className={`flex items-center gap-4 transition-all duration-300 ${isSidebarCollapsed && !isMobileMenuOpen ? 'justify-center' : 'mb-5'}`}>
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center shadow-inner relative flex-shrink-0">
                                <span className="text-xs font-black ring-1 ring-white/10 uppercase">{currentUser?.name?.[0] || 'A'}</span>
                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#0a0f1e] rounded-full"></div>
                            </div>
                            <div className={`flex flex-col transition-all duration-300 ${isSidebarCollapsed && !isMobileMenuOpen ? 'hidden' : 'block'}`}>
                                <span className="text-sm font-black truncate max-w-[120px]">{currentUser?.name || 'Admin'}</span>
                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Administrator</span>
                            </div>
                        </div>
                        <Link
                            to="/cashier"
                            className={`flex items-center justify-center gap-2 w-full py-3 bg-white/5 hover:bg-orange-500 hover:text-white rounded-xl transition-all duration-300 border border-white/5 group overflow-hidden ${isSidebarCollapsed && !isMobileMenuOpen ? 'p-2.5' : 'px-4'}`}
                        >
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                            <span className={`text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all duration-300 ${isSidebarCollapsed && !isMobileMenuOpen ? 'w-0 opacity-0 hidden' : 'w-auto'}`}>Exit Admin</span>
                        </Link>
                    </div>
                </div>
            </aside>

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
                    <div className="w-10"></div> {/* Spacer for balance */}
                </header>

                {/* Content Workspace */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-10 lg:p-16 custom-scrollbar pb-32 lg:pb-16 bg-[#f0f4f8]">
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
                                {/* Dashboard Hero Stats - REUSED FROM PREVIOUS VERSION */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-8 mb-8 sm:mb-16">
                                    <div className="relative overflow-hidden bg-white p-6 sm:p-10 rounded-[32px] sm:rounded-[48px] shadow-sm border border-slate-100 group transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/10 active:scale-95 sm:hover:-translate-y-2">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                                        <div className="relative text-slate-400 text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-3 sm:mb-4 flex items-center gap-3">
                                            <div className="p-2 sm:p-2.5 bg-blue-50 rounded-xl sm:rounded-2xl text-blue-500 ring-4 ring-blue-50/50"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg></div>
                                            Tổng nhân viên
                                        </div>
                                        <div className="relative text-4xl sm:text-7xl font-black text-slate-900 transition-all group-hover:text-blue-600">{users.length}</div>
                                    </div>

                                    <div className="relative overflow-hidden bg-[#0a0f1e] p-6 sm:p-10 rounded-[32px] sm:rounded-[48px] shadow-2xl group transition-all duration-500 active:scale-95 sm:hover:-translate-y-2">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full -mr-16 -mt-16 transition-transform duration-700 group-hover:scale-150"></div>
                                        <div className="relative text-orange-500/60 text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-3 sm:mb-4 flex items-center gap-3">
                                            <div className="p-2 sm:p-2.5 bg-orange-500/10 rounded-xl sm:rounded-2xl text-orange-500 ring-4 ring-orange-500/10"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg></div>
                                            Ban Quản trị
                                        </div>
                                        <div className="relative text-4xl sm:text-7xl font-black text-white group-hover:text-orange-500 transition-colors uppercase">{users.filter(u => u.role === 'admin').length}</div>
                                    </div>

                                    <div className="relative overflow-hidden bg-white p-6 sm:p-10 rounded-[32px] sm:rounded-[48px] shadow-sm border border-slate-100 group transition-all duration-500 hover:shadow-2xl hover:shadow-green-500/10 active:scale-95 sm:hover:-translate-y-2 col-span-1 sm:col-span-2 xl:col-span-1">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-green-50/50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                                        <div className="relative text-slate-400 text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-3 sm:mb-4 flex items-center gap-3">
                                            <div className="p-2 sm:p-2.5 bg-green-50 rounded-xl sm:rounded-2xl text-green-500 ring-4 ring-green-50/50"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg></div>
                                            Trạng thái
                                        </div>
                                        <div className="relative text-4xl sm:text-7xl font-black text-green-500 transition-all uppercase">Active</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 2xl:grid-cols-5 gap-6 xl:gap-12">
                                    {/* Personnel Section - REUSED */}
                                    <div className="2xl:col-span-3 bg-white rounded-[40px] sm:rounded-[56px] shadow-sm border border-slate-100 overflow-hidden">
                                        <div className="p-6 sm:p-10 border-b border-slate-50 flex items-center justify-between gap-6">
                                            <div>
                                                <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">Danh sách Nhân sự</h2>
                                                <p className="text-slate-400 text-[10px] sm:text-xs mt-1 leading-relaxed">Phân quyền tài khoản.</p>
                                            </div>
                                            <button onClick={fetchUsers} className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 flex items-center justify-center rounded-xl sm:rounded-2xl bg-slate-50 text-orange-500 hover:bg-orange-500 hover:text-white transition-all shadow-sm border-none active:scale-90">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                            </button>
                                        </div>
                                        <div className="overflow-x-auto custom-scrollbar">
                                            <table className="w-full text-left min-w-[500px]">
                                                <thead>
                                                    <tr className="bg-slate-50/50">
                                                        <th className="px-6 sm:px-10 py-4 sm:py-6 text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest">Nhân viên</th>
                                                        <th className="px-6 sm:px-10 py-4 sm:py-6 text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Quyền truy cập</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50">
                                                    {users.map((u) => (
                                                        <tr key={u.id} className="group hover:bg-slate-50/40 transition-all">
                                                            <td className="px-6 sm:px-10 py-4 sm:py-6 whitespace-nowrap">
                                                                <div className="flex items-center gap-4 sm:gap-5">
                                                                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-[22px] bg-slate-100 flex items-center justify-center text-xs sm:text-sm font-black text-slate-500 uppercase ring-1 sm:ring-2 ring-slate-100 group-hover:ring-orange-200 transition-all flex-shrink-0 relative">
                                                                        {u.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                                                        <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border border-white scale-0 group-hover:scale-100 transition-transform duration-300"></div>
                                                                    </div>
                                                                    <div className="flex flex-col">
                                                                        <span className="text-sm sm:text-base font-black text-slate-900 group-hover:text-orange-600 transition-colors truncate max-w-[150px] sm:max-w-[200px]">{u.name}</span>
                                                                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 whitespace-nowrap">ID :: 0{u.id}</span>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 sm:px-10 py-4 sm:py-6 text-right whitespace-nowrap">
                                                                <div className="relative inline-block group/select">
                                                                    <select
                                                                        disabled={updating === u.id || u.id === currentUser?.id}
                                                                        className="bg-slate-100 border-none rounded-xl sm:rounded-2xl pl-4 pr-9 py-2.5 text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-slate-700 cursor-pointer focus:ring-4 focus:ring-orange-500/10 transition-all disabled:opacity-50 appearance-none min-w-[120px] sm:min-w-[140px]"
                                                                        value={u.role}
                                                                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                                                    >
                                                                        {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                                                    </select>
                                                                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Diagnostics Engine - REUSED */}
                                    <div className="2xl:col-span-2 flex flex-col gap-6 xl:gap-12 flex-1">
                                        <div className="bg-[#0a0f1e] rounded-[40px] sm:rounded-[56px] shadow-2xl overflow-hidden flex flex-col border border-white/5 flex-1 relative group">
                                            {/* Glow Effect */}
                                            <div className="absolute -top-24 -right-24 w-64 h-64 bg-orange-500/10 rounded-full blur-[100px] pointer-events-none"></div>

                                            <div className="p-8 sm:p-10 border-b border-white/5 bg-white/[0.02]">
                                                <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-4 tracking-tight">
                                                    <span className="relative flex h-3 w-3">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500/50 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.6)]"></span>
                                                    </span>
                                                    Node Telemetry
                                                </h2>
                                            </div>

                                            <div className="p-6 sm:p-10 space-y-6 sm:space-y-8 flex-1 font-mono leading-relaxed overflow-y-auto custom-scrollbar">
                                                <div className="space-y-4">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-[24px] sm:rounded-[32px] bg-white/[0.03] border border-white/5 group/link hover:bg-white/[0.06] hover:border-orange-500/30 transition-all duration-300 gap-4 shadow-inner">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-500 group-hover/link:animate-pulse shadow-sm">
                                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-[#475569] text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] mb-0.5">Terminal</span>
                                                                <span className="text-white text-[13px] font-bold tracking-tight">LAN_TX_01</span>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={testPrinter}
                                                            disabled={testingPrinter}
                                                            className="w-full sm:w-auto px-5 py-2.5 bg-orange-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 shadow-xl shadow-orange-500/20 border-none active:scale-95"
                                                        >
                                                            {testingPrinter ? 'Probing...' : 'Test Link'}
                                                        </button>
                                                    </div>

                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-[24px] sm:rounded-[32px] bg-white/[0.03] border border-white/5 group/link hover:bg-white/[0.06] hover:border-blue-500/30 transition-all duration-300 gap-4 shadow-inner">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 group-hover/link:animate-pulse shadow-sm">
                                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-[#475569] text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] mb-0.5">Broadcaster</span>
                                                                <span className="text-white text-[13px] font-bold tracking-tight">WS_PULSE_LIVE</span>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={testWebsocket}
                                                            disabled={testingWS}
                                                            className="w-full sm:w-auto px-5 py-2.5 bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 shadow-xl shadow-blue-500/20 border-none active:scale-95"
                                                        >
                                                            {testingWS ? 'Syncing...' : 'Live Test'}
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="mt-8">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <span className="text-slate-600 text-[9px] font-bold uppercase tracking-[0.3em]">Execution Stack</span>
                                                        <button onClick={() => setLogs([])} className="text-slate-500 hover:text-white text-[9px] font-black uppercase tracking-widest bg-transparent border-none p-0 cursor-pointer">Clear</button>
                                                    </div>
                                                    <div className="bg-black/60 rounded-[32px] p-6 sm:p-8 h-48 sm:h-64 overflow-y-auto space-y-3 shadow-inner border border-white/5 custom-scrollbar-hidden flex flex-col-reverse backdrop-blur-xl">
                                                        {logs.length === 0 && <div className="text-slate-700 italic text-[10px] h-full flex items-center justify-center">Null telemetry...</div>}
                                                        {logs.map((log, idx) => (
                                                            <div key={idx} className={`text-[10px] py-1 block leading-relaxed ${log.type === 'error' ? 'text-red-400' : log.type === 'success' ? 'text-green-400' : 'text-blue-400'}`}>
                                                                <span className="text-[#334155] font-black mr-3 tabular-nums">[{log.time}]</span>
                                                                <span className="font-bold opacity-80">{log.message}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
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

                {/* Hybrid Mobile Navigation (Fixed & Focused) */}
                <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-20 bg-[#0a0f1e]/98 backdrop-blur-2xl border-t border-white/5 z-[100] flex items-center justify-around px-10 rounded-t-[32px] shadow-[0_-15px_50px_rgba(0,0,0,0.6)] safe-area-inset-bottom animate-in slide-in-from-bottom-12 duration-700">
                    <button
                        onClick={() => setActiveTab('system')}
                        className={`flex flex-col items-center justify-center gap-1.5 transition-all duration-500 relative px-4 py-2 ${activeTab === 'system' ? 'text-white' : 'text-slate-600 active:text-white'}`}
                    >
                        <span className={`transition-all duration-500 ${activeTab === 'system' ? 'scale-110 text-orange-500 drop-shadow-[0_0_12px_rgba(249,115,22,0.6)]' : 'active:scale-95'}`}>
                            {tabs.find(t => t.id === 'system')?.icon}
                        </span>
                        <span className={`text-[9px] font-black uppercase tracking-widest transition-opacity duration-500 ${activeTab === 'system' ? 'opacity-100' : 'opacity-40'}`}>Tổng quan</span>
                        {activeTab === 'system' && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-orange-500 rounded-full blur-[1px]"></div>}
                    </button>

                    <button
                        onClick={() => setActiveTab('tables')}
                        className={`flex flex-col items-center justify-center gap-1.5 transition-all duration-500 relative px-4 py-2 ${activeTab === 'tables' ? 'text-white' : 'text-slate-600 active:text-white'}`}
                    >
                        <span className={`transition-all duration-500 ${activeTab === 'tables' ? 'scale-110 text-orange-500 drop-shadow-[0_0_12px_rgba(249,115,22,0.6)]' : 'active:scale-95'}`}>
                            {tabs.find(t => t.id === 'tables')?.icon}
                        </span>
                        <span className={`text-[9px] font-black uppercase tracking-widest transition-opacity duration-500 ${activeTab === 'tables' ? 'opacity-100' : 'opacity-40'}`}>Bàn</span>
                        {activeTab === 'tables' && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-orange-500 rounded-full blur-[1px]"></div>}
                    </button>

                    <button
                        onClick={() => setActiveTab('products')}
                        className={`flex flex-col items-center justify-center gap-1.5 transition-all duration-500 relative px-4 py-2 ${activeTab === 'products' ? 'text-white' : 'text-slate-600 active:text-white'}`}
                    >
                        <span className={`transition-all duration-500 ${activeTab === 'products' ? 'scale-110 text-orange-500 drop-shadow-[0_0_12px_rgba(249,115,22,0.6)]' : 'active:scale-95'}`}>
                            {tabs.find(t => t.id === 'products')?.icon}
                        </span>
                        <span className={`text-[9px] font-black uppercase tracking-widest transition-opacity duration-500 ${activeTab === 'products' ? 'opacity-100' : 'opacity-40'}`}>Menu</span>
                        {activeTab === 'products' && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-orange-500 rounded-full blur-[1px]"></div>}
                    </button>

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
