import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserManagement } from '../../hooks/useUserManagement';

// ─── STYLING HELPERS FOR PREMIUM ROLES ───
export const getRoleStyle = (role) => {
    switch (role) {
        case 'admin':
            return {
                bg: 'bg-purple-50 hover:bg-purple-100/80 border-purple-200/50',
                text: 'text-purple-700',
                label: 'Admin',
                color: 'purple',
                gradient: 'from-purple-500 to-indigo-600 shadow-purple-500/20',
                icon: (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                )
            };
        case 'manager':
            return {
                bg: 'bg-blue-50 hover:bg-blue-100/80 border-blue-200/50',
                text: 'text-blue-700',
                label: 'Quản lý',
                color: 'blue',
                gradient: 'from-blue-500 to-cyan-600 shadow-blue-500/20',
                icon: (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                )
            };
        case 'order_staff':
            return {
                bg: 'bg-orange-50 hover:bg-orange-100/80 border-orange-200/50',
                text: 'text-orange-700',
                label: 'Nhân viên Order',
                color: 'orange',
                gradient: 'from-orange-400 to-amber-500 shadow-orange-500/20',
                icon: (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                )
            };
        case 'kitchen':
            return {
                bg: 'bg-emerald-50 hover:bg-emerald-100/80 border-emerald-200/50',
                text: 'text-emerald-700',
                label: 'Bếp',
                color: 'emerald',
                gradient: 'from-emerald-400 to-teal-500 shadow-emerald-500/20',
                icon: (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                    </svg>
                )
            };
        case 'bar':
            return {
                bg: 'bg-pink-50 hover:bg-pink-100/80 border-pink-200/50',
                text: 'text-pink-700',
                label: 'Quầy Bar',
                color: 'pink',
                gradient: 'from-pink-400 to-rose-500 shadow-pink-500/20',
                icon: (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707m-9.9-9.9l.707-.707" />
                    </svg>
                )
            };
        case 'cashier':
            return {
                bg: 'bg-teal-50 hover:bg-teal-100/80 border-teal-200/50',
                text: 'text-teal-700',
                label: 'Thu ngân',
                color: 'teal',
                gradient: 'from-teal-400 to-emerald-500 shadow-teal-500/20',
                icon: (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                )
            };
        case 'bill':
            return {
                bg: 'bg-cyan-50 hover:bg-cyan-100/80 border-cyan-200/50',
                text: 'text-cyan-700',
                label: 'Nhân viên Bill',
                color: 'cyan',
                gradient: 'from-cyan-400 to-blue-500 shadow-cyan-500/20',
                icon: (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                )
            };
        case 'seller':
            return {
                bg: 'bg-rose-50 hover:bg-rose-100/80 border-rose-200/50',
                text: 'text-rose-700',
                label: 'Bán hàng',
                color: 'rose',
                gradient: 'from-rose-400 to-pink-500 shadow-rose-500/20',
                icon: (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                )
            };
        default:
            return {
                bg: 'bg-slate-50 hover:bg-slate-100/80 border-slate-200/50',
                text: 'text-slate-700',
                label: 'Nhân sự',
                color: 'slate',
                gradient: 'from-slate-400 to-slate-500 shadow-slate-500/20',
                icon: (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                )
            };
    }
};

const getAvatarGradient = (name) => {
    const hash = (name || 'Staff').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const gradients = [
        'from-purple-500 to-indigo-500 shadow-purple-500/20',
        'from-blue-500 to-sky-500 shadow-blue-500/20',
        'from-emerald-500 to-teal-500 shadow-emerald-500/20',
        'from-orange-500 to-amber-500 shadow-orange-500/20',
        'from-rose-500 to-pink-500 shadow-rose-500/20',
        'from-violet-500 to-fuchsia-500 shadow-violet-500/20',
        'from-sky-500 to-blue-600 shadow-sky-500/20',
        'from-red-500 to-rose-500 shadow-red-500/20'
    ];
    return gradients[hash % gradients.length];
};

const UserManagement = ({ currentUser }) => {
    const navigate = useNavigate();
    const {
        users,
        loading,
        processing,
        error,
        deleteUser,
        changeRole,
        roles
    } = useUserManagement();

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRoleFilter, setSelectedRoleFilter] = useState('all');
    const [userToDelete, setUserToDelete] = useState(null);

    const handleAddUser = () => {
        navigate('/admin/personnel/create');
    };

    const handleEditUser = (e, user) => {
        e.stopPropagation(); // Avoid triggering row navigations
        navigate(`/admin/personnel/edit/${user.id}`);
    };

    const handleRowClick = (userId) => {
        navigate(`/admin/personnel/${userId}`);
    };

    const handleDeleteClick = (e, user) => {
        e.stopPropagation(); // Avoid triggering row navigations
        setUserToDelete(user);
    };

    const confirmDelete = async () => {
        if (!userToDelete) return;
        const success = await deleteUser(userToDelete.id, true); // skip native window.confirm
        if (success) {
            setUserToDelete(null);
        }
    };

    // Calculate Hero Metrics
    const metrics = useMemo(() => {
        const total = users.length;
        const admins = users.filter(u => u.role === 'admin').length;
        const managers = users.filter(u => u.role === 'manager').length;
        const operations = total - admins - managers;
        return { total, admins, managers, operations };
    }, [users]);

    // Role Counts for filtering indicators
    const roleCounts = useMemo(() => {
        const counts = { all: users.length };
        roles.forEach(role => {
            counts[role.value] = users.filter(u => u.role === role.value).length;
        });
        return counts;
    }, [users, roles]);

    // Filters & Sorting logic
    const filteredUsers = useMemo(() => {
        return users.filter(u => {
            const matchesSearch = 
                (u.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                (u.email?.toLowerCase() || '').includes(searchTerm.toLowerCase());
            
            const matchesRole = 
                selectedRoleFilter === 'all' || u.role === selectedRoleFilter;

            return matchesSearch && matchesRole;
        });
    }, [users, searchTerm, selectedRoleFilter]);

    if (loading && users.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[40px] border border-slate-100 shadow-sm animate-pulse">
                <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-orange-500 animate-spin mb-4"></div>
                <p className="text-slate-400 font-bold text-[11px] tracking-widest uppercase">Đang tải danh sách nhân sự...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 lg:space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 font-sans pb-16">
            
            {/* ─── TITLE & DESCRIPTION ─── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-none uppercase">Quản trị Nhân sự</h1>
                    <p className="text-slate-500 text-sm mt-2 leading-relaxed">Quản lý tài khoản, thay đổi quyền truy cập và phân bổ vai trò cho toàn bộ nhân viên nhà hàng.</p>
                </div>
                <button
                    onClick={handleAddUser}
                    className="mdt-btn flex items-center justify-center gap-2 group self-stretch md:self-auto shadow-lg shadow-orange-500/20 active:scale-95 transition-all duration-300 font-black text-[12px] uppercase tracking-wider"
                >
                    <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Thêm nhân sự mới</span>
                </button>
            </div>

            {/* ─── HERO STATS PANEL ─── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Stat 1: Total Employees */}
                <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-4 transition-all hover:shadow-md group">
                    <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center transition-transform group-hover:scale-110 duration-300">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Tổng nhân sự</p>
                        <p className="text-2xl font-black text-slate-800 mt-0.5">{metrics.total}</p>
                    </div>
                </div>

                {/* Stat 2: Admins */}
                <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-4 transition-all hover:shadow-md group">
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-500 flex items-center justify-center transition-transform group-hover:scale-110 duration-300">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Quản trị viên</p>
                        <p className="text-2xl font-black text-slate-800 mt-0.5">{metrics.admins}</p>
                    </div>
                </div>

                {/* Stat 3: Managers */}
                <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-4 transition-all hover:shadow-md group">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-50 flex items-center justify-center transition-transform group-hover:scale-110 duration-300">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Cấp Quản lý</p>
                        <p className="text-2xl font-black text-slate-800 mt-0.5">{metrics.managers}</p>
                    </div>
                </div>

                {/* Stat 4: Operation Staff */}
                <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-4 transition-all hover:shadow-md group">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center transition-transform group-hover:scale-110 duration-300">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13a9.001 9.001 0 01-9 9 9.001 9.001 0 01-9-9m18 0a9 9 0 10-18 0m18 0H3m9-10v10m-5-5h10" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Bộ phận Vận hành</p>
                        <p className="text-2xl font-black text-slate-800 mt-0.5">{metrics.operations}</p>
                    </div>
                </div>
            </div>

            {/* ─── ADVANCED SEARCH & FILTERS PANEL ─── */}
            <div className="bg-white p-4 rounded-[28px] border border-slate-100 shadow-sm space-y-4">
                <div className="flex flex-col lg:flex-row items-center gap-4">
                    {/* Search Field */}
                    <div className="relative w-full lg:max-w-md group flex-shrink-0">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-orange-500 transition-colors duration-200">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Tìm nhân sự theo tên hoặc email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-50 border border-transparent rounded-[16px] pl-12 pr-10 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-orange-500/30 focus:ring-4 focus:ring-orange-500/10 transition-all duration-300"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-300 hover:text-slate-500 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>

                    <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest self-center text-center w-full lg:w-auto lg:text-left">
                        Bộ lọc vai trò:
                    </div>
                </div>

                {/* Horizontal Role Filters Scrolling container */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-2 px-2 scroll-smooth">
                    <button
                        onClick={() => setSelectedRoleFilter('all')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer whitespace-nowrap border ${selectedRoleFilter === 'all'
                            ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                            : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                            }`}
                    >
                        <span>Tất cả</span>
                        <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${selectedRoleFilter === 'all' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>{roleCounts.all}</span>
                    </button>

                    {roles.map(role => {
                        const style = getRoleStyle(role.value);
                        const isActive = selectedRoleFilter === role.value;
                        return (
                            <button
                                key={role.value}
                                onClick={() => setSelectedRoleFilter(role.value)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer whitespace-nowrap border ${isActive
                                    ? `bg-${style.color}-500 border-${style.color}-500 text-white shadow-sm ${style.color === 'purple' ? 'bg-purple-600' : style.color === 'blue' ? 'bg-blue-600' : style.color === 'orange' ? 'bg-orange-500' : style.color === 'emerald' ? 'bg-emerald-600' : style.color === 'pink' ? 'bg-pink-600' : style.color === 'teal' ? 'bg-teal-600' : style.color === 'cyan' ? 'bg-cyan-600' : 'bg-rose-600'}`
                                    : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                                    }`}
                            >
                                <span className={isActive ? 'text-white' : style.text}>{style.icon}</span>
                                <span>{role.label}</span>
                                <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>{roleCounts[role.value]}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-5 rounded-3xl text-[11px] font-black uppercase tracking-widest border border-red-100 flex items-center gap-4 animate-in shake duration-500">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>{error}</span>
                </div>
            )}

            {/* ─── DESKTOP TABLE VIEW ─── */}
            <div className="hidden md:block bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">Thông tin nhân sự</th>
                                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">Quyền hạn truy cập</th>
                                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none text-right">Lựa chọn</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredUsers.map((u) => {
                                const roleStyle = getRoleStyle(u.role);
                                const isSelf = u.id === currentUser?.id;
                                return (
                                    <tr 
                                        key={u.id} 
                                        onClick={() => handleRowClick(u.id)}
                                        className="group hover:bg-slate-50/40 transition-all duration-300 cursor-pointer border-l-4 border-l-transparent hover:border-l-orange-500"
                                    >
                                        <td className="px-8 py-5 whitespace-nowrap">
                                            <div className="flex items-center gap-4">
                                                {/* Gradient Initial Avatar */}
                                                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${getAvatarGradient(u.name)} text-white flex items-center justify-center text-sm font-black uppercase transition-all duration-300 group-hover:scale-105 group-hover:rotate-3 shadow-md relative`}>
                                                    {u.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                                    {/* Status indicator pulse */}
                                                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full shadow-sm shadow-emerald-500/50"></span>
                                                </div>
                                                <div className="flex items-center min-w-0">
                                                    <div className="flex flex-col min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-base font-bold text-slate-900 group-hover:text-orange-600 transition-colors truncate max-w-[200px] uppercase tracking-tight">{u.name}</span>
                                                            {isSelf && (
                                                                <span className="bg-orange-50 text-orange-600 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border border-orange-200/50">Bạn</span>
                                                            )}
                                                        </div>
                                                        <span className="text-[11px] text-slate-400 font-bold tracking-wide transition-colors group-hover:text-slate-500 truncate max-w-[220px]">{u.email || 'Chưa cung cấp email'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                            <div className="relative inline-block group/select">
                                                <select
                                                    disabled={processing || isSelf}
                                                    className={`border border-transparent rounded-[14px] pl-4 pr-10 py-2.5 text-[11px] font-black uppercase tracking-widest cursor-pointer focus:ring-4 focus:ring-orange-500/10 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed appearance-none min-w-[190px] shadow-sm ${roleStyle.bg} ${roleStyle.text} border-slate-200/30 hover:shadow-md`}
                                                    value={u.role}
                                                    onChange={(e) => changeRole(u.id, e.target.value)}
                                                >
                                                    {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                                </select>
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover/select:text-orange-500 transition-colors duration-200">
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-end gap-3">
                                                <button
                                                    onClick={(e) => handleEditUser(e, u)}
                                                    className="w-10 h-10 flex items-center justify-center rounded-[14px] bg-slate-50 text-slate-500 hover:text-orange-500 hover:bg-orange-50 hover:shadow-md hover:border-orange-200/50 border border-transparent transition-all duration-200 active:scale-90"
                                                    title="Chỉnh sửa thông tin"
                                                >
                                                    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={(e) => handleDeleteClick(e, u)}
                                                    disabled={isSelf}
                                                    className="w-10 h-10 flex items-center justify-center rounded-[14px] bg-slate-50 text-slate-500 hover:text-red-500 hover:bg-red-50 hover:shadow-md hover:border-red-200/50 border border-transparent transition-all duration-200 active:scale-90 disabled:opacity-30 disabled:hover:bg-slate-50 disabled:hover:text-slate-400 disabled:cursor-not-allowed"
                                                    title={isSelf ? 'Không thể tự xóa bản thân' : 'Xóa tài khoản'}
                                                >
                                                    {isSelf ? (
                                                        <svg className="w-4.5 h-4.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                        </svg>
                                                    ) : (
                                                        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    )}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ─── MOBILE CARD VIEW ─── */}
            <div className="md:hidden space-y-4">
                {filteredUsers.map((u) => {
                    const roleStyle = getRoleStyle(u.role);
                    const isSelf = u.id === currentUser?.id;
                    return (
                        <div 
                            key={u.id} 
                            onClick={() => handleRowClick(u.id)}
                            className="bg-white p-5 rounded-[24px] shadow-sm border border-slate-100 flex flex-col gap-4 active:scale-[0.98] transition-all duration-200 cursor-pointer"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${getAvatarGradient(u.name)} text-white flex items-center justify-center text-base font-black uppercase shadow-md relative`}>
                                    {u.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full shadow-sm"></span>
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg font-bold text-slate-900 truncate uppercase tracking-tight">{u.name}</span>
                                        {isSelf && (
                                            <span className="bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider">Bạn</span>
                                        )}
                                    </div>
                                    <span className="text-xs text-slate-400 font-medium truncate">{u.email || 'Chưa có email'}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 pt-2 border-t border-slate-50" onClick={(e) => e.stopPropagation()}>
                                <div className="flex-1 relative group/select">
                                    <select
                                        disabled={processing || isSelf}
                                        className={`w-full border border-slate-200/50 rounded-[14px] pl-4 pr-9 py-3 text-[10px] font-black uppercase tracking-widest appearance-none focus:ring-4 focus:ring-orange-500/10 transition-all ${roleStyle.bg} ${roleStyle.text}`}
                                        value={u.role}
                                        onChange={(e) => changeRole(u.id, e.target.value)}
                                    >
                                        {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                    </select>
                                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={(e) => handleEditUser(e, u)}
                                        className="w-11 h-11 flex items-center justify-center rounded-[14px] bg-slate-50 text-slate-500 active:scale-95 transition-all duration-200 border border-slate-200/40 cursor-pointer"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={(e) => handleDeleteClick(e, u)}
                                        disabled={isSelf}
                                        className="w-11 h-11 flex items-center justify-center rounded-[14px] bg-slate-50 text-slate-400 active:scale-95 transition-all duration-200 border border-slate-200/40 disabled:opacity-30 cursor-pointer"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ─── EMPTY STATE ─── */}
            {filteredUsers.length === 0 && (
                <div className="py-20 flex flex-col items-center justify-center bg-white rounded-[32px] border border-slate-100 shadow-sm animate-in zoom-in-95 duration-500">
                    <div className="w-20 h-20 bg-slate-50 rounded-[28px] flex items-center justify-center text-slate-300 mb-6 border border-slate-100 shadow-inner">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                    </div>
                    <h3 className="text-base font-black text-slate-800 uppercase tracking-wider">Không tìm thấy kết quả</h3>
                    <p className="text-slate-400 text-xs mt-1 max-w-xs text-center leading-relaxed">Hãy thử tìm với từ khóa khác hoặc xóa bộ lọc vai trò hiện tại.</p>
                </div>
            )}

            {/* ─── CUSTOM DELETE CONFIRMATION MODAL ─── */}
            {userToDelete && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[28px] w-full max-w-md shadow-2xl p-6 text-center animate-in zoom-in-95 duration-300 border border-slate-100 flex flex-col items-center">
                        <div className="w-16 h-16 rounded-[22px] bg-red-50 text-red-500 flex items-center justify-center mb-4 border border-red-100 shadow-sm animate-bounce">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>

                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Xác nhận xóa nhân sự</h3>
                        <p className="text-sm text-slate-500 mt-3 leading-relaxed">
                            Bạn có chắc chắn muốn xóa tài khoản của nhân viên <strong className="text-slate-800 uppercase tracking-tight">"{userToDelete.name}"</strong>?
                        </p>
                        <div className="bg-red-50/50 p-4 rounded-2xl border border-red-100/50 text-[11px] text-red-600 font-bold uppercase tracking-wider text-center mt-4 w-full">
                            Lưu ý: Hành động này không thể hoàn tác và dữ liệu sẽ bị xóa hoàn toàn khỏi hệ thống.
                        </div>

                        <div className="flex gap-4 w-full mt-6">
                            <button
                                onClick={() => setUserToDelete(null)}
                                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl font-black text-[11px] uppercase tracking-wider cursor-pointer active:scale-95 transition-all"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={processing}
                                className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-black text-[11px] uppercase tracking-wider cursor-pointer active:scale-95 transition-all shadow-lg shadow-red-500/20 disabled:opacity-50"
                            >
                                {processing ? 'Đang xóa...' : 'Xác nhận xóa'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default UserManagement;
