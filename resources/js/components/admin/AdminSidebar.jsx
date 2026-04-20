import React from 'react';
import { Link } from 'react-router-dom';

const AdminSidebar = ({ 
    activeTab, 
    setActiveTab, 
    isMobileMenuOpen, 
    setIsMobileMenuOpen, 
    isSidebarCollapsed, 
    setIsSidebarCollapsed, 
    currentUser, 
    tabs 
}) => {
    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
    const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

    return (
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
    );
};

export default AdminSidebar;
