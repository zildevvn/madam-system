import React, { useState } from 'react';
import { useEmployeePerformance } from '../../hooks/useEmployeePerformance';

/**
 * EmployeePerformancePage Component
 * [WHY] Visualizes key performance indicators (KPIs) for restaurant staff and tour sellers.
 * [RULE] Adheres to high-fidelity aesthetic standards: sleek dark mode shadows, vibrant accents, 
 * dot-separators for cash fields, and completely responsive layouts.
 */
const EmployeePerformancePage = () => {
    const {
        period,
        startDate,
        endDate,
        setStartDate,
        setEndDate,
        stats,
        loading,
        error,
        handlePeriodChange,
        fetchPerformance
    } = useEmployeePerformance();

    const [activeTab, setActiveTab] = useState('restaurant'); // restaurant, seller

    // Currency Formatter
    const formatCurrency = (val) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
    };

    // Role Labels Mapping
    const getRoleLabel = (role) => {
        const labels = {
            admin: 'Quản trị viên',
            manager: 'Quản lý',
            order_staff: 'Nhân viên Order',
            kitchen: 'Bếp',
            bar: 'Bar',
            cashier: 'Thu ngân',
            bill: 'Nhân viên đọc Bill',
            seller: 'Seller'
        };
        return labels[role] || role;
    };

    const tabs = [
        { id: 'restaurant', label: 'Hiệu suất Nhà hàng', icon: '🍳' },
        { id: 'seller', label: 'Hiệu suất Seller', icon: '💼' }
    ];

    const periods = [
        { id: 'today', label: 'Hôm nay' },
        { id: 'week', label: 'Tuần này' },
        { id: 'month', label: 'Tháng này' },
        { id: 'custom', label: 'Tùy chỉnh' }
    ];

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-20">
            {/* Header Title Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">
                        Báo cáo hiệu suất nhân sự
                    </h3>
                    <p className="text-xs text-slate-400 font-bold tracking-wide uppercase mt-1">
                        Theo dõi năng suất làm việc của nhân sự & seller dựa trên dữ liệu thực tế
                    </p>
                </div>

                {/* Period Filter Buttons */}
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl w-fit self-start md:self-auto">
                    {periods.map(p => (
                        <button
                            key={p.id}
                            onClick={() => handlePeriodChange(p.id)}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border-none cursor-pointer ${
                                period === p.id
                                    ? 'bg-white text-orange-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 bg-transparent'
                            }`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Custom Date Filters Block */}
            {period === 'custom' && (
                <div className="bg-orange-50/40 border border-orange-100/50 p-4 rounded-3xl grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl animate-in slide-in-from-top-3 duration-300">
                    <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Từ ngày</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="text-sm w-full bg-white border-none rounded-xl p-3 text-slate-900 font-bold focus:ring-4 focus:ring-orange-500/10 transition-all shadow-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Đến ngày</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="text-sm w-full bg-white border-none rounded-xl p-3 text-slate-900 font-bold focus:ring-4 focus:ring-orange-500/10 transition-all shadow-sm"
                        />
                    </div>
                </div>
            )}

            {/* Elegant Tab Switcher */}
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                {tabs.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setActiveTab(t.id)}
                        className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all border-none cursor-pointer flex items-center gap-2 ${
                            activeTab === t.id
                                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                                : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                        }`}
                    >
                        <span>{t.icon}</span>
                        <span>{t.label}</span>
                    </button>
                ))}
            </div>

            {/* Table or Cards Layout */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[40px] border border-slate-100 shadow-sm animate-pulse">
                    <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-orange-500 animate-spin mb-4"></div>
                    <p className="text-slate-400 font-bold text-[11px] tracking-widest uppercase">Đang đồng bộ dữ liệu hiệu suất...</p>
                </div>
            ) : error ? (
                <div className="py-16 px-6 flex flex-col items-center justify-center bg-white rounded-[32px] border border-red-100 shadow-sm text-center max-w-xl mx-auto animate-in fade-in duration-300">
                    <div className="w-16 h-16 bg-red-50 rounded-[24px] flex items-center justify-center text-red-500 text-2xl mb-4 shadow-sm">⚠️</div>
                    <h4 className="text-slate-900 font-black text-xs uppercase tracking-wider mb-2">Đã xảy ra sự cố tải dữ liệu</h4>
                    <p className="text-slate-500 text-xs mb-6 max-w-md leading-relaxed">{error}</p>
                    <button
                        onClick={fetchPerformance}
                        className="px-6 py-3 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-[11px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-orange-500/20 cursor-pointer border-none"
                    >
                        Thử lại ngay
                    </button>
                </div>
            ) : (
                <div className="animate-in fade-in duration-300">
                    {activeTab === 'restaurant' ? (
                        stats.restaurant.length === 0 ? (
                            <div className="py-20 flex flex-col items-center justify-center bg-white rounded-[32px] border border-slate-100 shadow-sm text-center">
                                <div className="w-16 h-16 bg-slate-50 rounded-[24px] flex items-center justify-center text-slate-200 mb-4">🍳</div>
                                <p className="text-slate-400 font-black text-[11px] uppercase tracking-[0.2em]">Chưa có dữ liệu phục vụ trong khoảng thời gian này</p>
                            </div>
                        ) : (
                            <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-slate-50/50">
                                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Thông tin nhân sự</th>
                                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Số bàn/Đơn phục vụ</th>
                                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Số khách phục vụ</th>
                                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Doanh thu phục vụ</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {stats.restaurant.map((emp) => (
                                                <tr key={emp.id} className="group hover:bg-slate-50/40 transition-all">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-[18px] bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center text-xs font-black text-slate-500 uppercase ring-1 ring-slate-100 overflow-hidden">
                                                                {emp.photo ? (
                                                                    <img src={`/storage/${emp.photo}`} alt="avatar" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    emp.name.split(' ').map(n => n[0]).join('').slice(0, 2)
                                                                )}
                                                            </div>
                                                            <div className="flex flex-col min-w-0">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-sm font-black text-slate-900 group-hover:text-orange-600 transition-colors uppercase tracking-tight">{emp.name}</span>
                                                                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[8px] font-black uppercase tracking-wider">{getRoleLabel(emp.role)}</span>
                                                                </div>
                                                                <span className="text-[10px] text-slate-400 font-bold tracking-wide mt-0.5">{emp.email}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center whitespace-nowrap">
                                                        <span className="text-sm font-black text-slate-950 bg-slate-100 px-3 py-1.5 rounded-xl">{emp.orders_count}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center whitespace-nowrap">
                                                        <span className="text-sm font-black text-slate-800">{emp.total_guests} khách</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right whitespace-nowrap">
                                                        <span className="text-sm font-black text-emerald-600 bg-emerald-50 px-3.5 py-1.5 rounded-xl">{formatCurrency(emp.total_revenue)}</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )
                    ) : (
                        stats.seller.length === 0 ? (
                            <div className="py-20 flex flex-col items-center justify-center bg-white rounded-[32px] border border-slate-100 shadow-sm text-center">
                                <div className="w-16 h-16 bg-slate-50 rounded-[24px] flex items-center justify-center text-slate-200 mb-4">💼</div>
                                <p className="text-slate-400 font-black text-[11px] uppercase tracking-[0.2em]">Chưa có dữ liệu đặt bàn / booking từ seller nào</p>
                            </div>
                        ) : (
                            <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-slate-50/50">
                                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Thông tin Seller</th>
                                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Số booking mang về</th>
                                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Số lượng khách hàng</th>
                                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Doanh số đặt trước (Pre-order)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {stats.seller.map((emp) => (
                                                <tr key={emp.id} className="group hover:bg-slate-50/40 transition-all">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-[18px] bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center text-xs font-black text-slate-500 uppercase ring-1 ring-slate-100 overflow-hidden">
                                                                {emp.photo ? (
                                                                    <img src={`/storage/${emp.photo}`} alt="avatar" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    emp.name.split(' ').map(n => n[0]).join('').slice(0, 2)
                                                                )}
                                                            </div>
                                                            <div className="flex flex-col min-w-0">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-sm font-black text-slate-900 group-hover:text-orange-600 transition-colors uppercase tracking-tight">{emp.name}</span>
                                                                    <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 text-[8px] font-black uppercase tracking-wider">{getRoleLabel(emp.role)}</span>
                                                                </div>
                                                                <span className="text-[10px] text-slate-400 font-bold tracking-wide mt-0.5">{emp.email}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center whitespace-nowrap">
                                                        <span className="text-sm font-black text-slate-950 bg-slate-100 px-3 py-1.5 rounded-xl">{emp.reservations_count} booking</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center whitespace-nowrap">
                                                        <span className="text-sm font-black text-slate-800">{emp.total_guests} khách</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right whitespace-nowrap">
                                                        <span className="text-sm font-black text-orange-600 bg-orange-50 px-3.5 py-1.5 rounded-xl">{formatCurrency(emp.total_revenue)}</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )
                    )}
                </div>
            )}
        </div>
    );
};

export default EmployeePerformancePage;
