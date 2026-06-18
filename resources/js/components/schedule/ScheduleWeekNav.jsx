import React from 'react';
import Icon from '../shared/Icon';

const ROLE_LABELS = {
    all: 'Tất cả',
    admin: 'Admin',
    manager: 'Quản lý',
    order_staff: 'Nhân viên Order',
    cashier: 'Thu ngân',
    kitchen: 'Bếp',
    bar: 'Bar',
    bill: 'Đọc Bill',
    seller: 'Seller',
    accountant: 'Kế toán'
};

/**
 * ScheduleWeekNav Component
 * [WHY] Segregates control filters, navigation controls, and role-tabs.
 * [RULE] Maintains clean modularity under 200 lines.
 */
export default function ScheduleWeekNav({
    roleTab,
    setRoleTab,
    employeesCount,
    roleCounts = {},
    handlePrevWeek,
    handleCurrentWeek,
    handleNextWeek,
    weekRangeTitle,
    searchQuery,
    setSearchQuery,
    shiftFilter,
    setShiftFilter
}) {
    return (
        <div className="bg-white rounded-xl p-2 shadow-sm border border-slate-100 space-y-2">
            {/* Role Filter Tabs */}
            <div className="flex border-b border-slate-100 overflow-x-auto no-scrollbar scroll-smooth">
                {Object.entries(ROLE_LABELS).map(([roleKey, roleLabel]) => {
                    const count = roleKey === 'all' ? employeesCount : (roleCounts[roleKey] || 0);
                    // Only show tabs that have active employees (or show 'all' always)
                    if (roleKey !== 'all' && count === 0) return null;

                    return (
                        <button
                            key={roleKey}
                            onClick={() => setRoleTab(roleKey)}
                            className={`px-4 py-2 font-black text-[11px] md:text-xs uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${roleTab === roleKey
                                ? 'border-orange-500 text-orange-600 font-extrabold'
                                : 'border-transparent text-slate-400 hover:text-slate-600 font-bold'
                                }`}
                        >
                            {roleLabel} ({count})
                        </button>
                    );
                })}
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Week Selector buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={handlePrevWeek}
                        className="w-8 h-8 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/50 flex items-center justify-center transition-all cursor-pointer"
                        title="Tuần trước"
                    >
                        <Icon name="chevronLeft" className="w-3.5 h-3.5" size={14} strokeWidth={2.5} />
                    </button>

                    <button
                        onClick={handleCurrentWeek}
                        className="px-3 h-8 rounded-lg bg-slate-50 text-slate-700 font-bold hover:bg-slate-100 border border-slate-200/50 text-[10px] uppercase tracking-wider transition-all cursor-pointer"
                    >
                        Tuần này
                    </button>

                    <button
                        onClick={handleNextWeek}
                        className="w-8 h-8 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/50 flex items-center justify-center transition-all cursor-pointer"
                        title="Tuần sau"
                    >
                        <Icon name="chevronRight" className="w-3.5 h-3.5" size={14} strokeWidth={2.5} />
                    </button>

                    <span className="text-[11px] md:text-xs font-black text-slate-800 ml-2 tracking-tight">
                        {weekRangeTitle}
                    </span>
                </div>

                {/* Filters Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 lg:max-w-xl">
                    {/* Search input */}
                    <div className="relative flex-1">
                        <input
                            type="text"
                            placeholder="Tìm nhân viên..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="text-[11px] w-full bg-slate-50 border-none rounded-xl py-2 pl-9 pr-3 text-slate-900 font-medium placeholder:text-slate-400 focus:ring-4 focus:ring-orange-500/10 transition-all"
                        />
                        <Icon name="search" className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" size={14} strokeWidth={2.5} />
                    </div>

                    {/* Shift filter */}
                    <select
                        value={shiftFilter}
                        onChange={(e) => setShiftFilter(e.target.value)}
                        className="text-[11px] bg-slate-50 border-none rounded-xl py-2 px-3 text-slate-800 font-bold focus:ring-4 focus:ring-orange-500/10 transition-all cursor-pointer"
                    >
                        <option value="all">Tất cả ca làm</option>
                        <option value="ca sáng">Ca sáng</option>
                        <option value="ca tối">Ca tối</option>
                        <option value="ca full time">Ca full time</option>
                        <option value="off">Ngày nghỉ</option>
                    </select>
                </div>
            </div>
        </div>
    );
}
