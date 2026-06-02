import React from 'react';

/**
 * AttendanceStats Component
 * [WHY] Displays key KPI metric cards for checking daily stats.
 */
export default function AttendanceStats({ stats }) {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 animate-in fade-in slide-in-from-bottom-3 duration-300">
            <div className="bg-white p-4 rounded-md border border-slate-100 shadow-sm flex flex-col justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Tổng nhân viên</span>
                <span className="text-2xl font-black text-slate-800 mt-2 block">{stats.total}</span>
            </div>
            <div className="bg-amber-50/50 p-4 rounded-md border border-amber-100 shadow-sm flex flex-col justify-between">
                <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest leading-none">Đang làm việc</span>
                <span className="text-2xl font-black text-amber-600 mt-2 block">{stats.working}</span>
            </div>
            <div className="bg-emerald-50/50 p-4 rounded-md border border-emerald-100 shadow-sm flex flex-col justify-between">
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-none">Đã check-out</span>
                <span className="text-2xl font-black text-emerald-600 mt-2 block">{stats.checkedOut}</span>
            </div>
            <div className="bg-red-50/50 p-4 rounded-md border border-red-100 shadow-sm flex flex-col justify-between">
                <span className="text-[10px] font-black text-red-500 uppercase tracking-widest leading-none">Thiếu checkout</span>
                <span className="text-2xl font-black text-red-600 mt-2 block">{stats.missing}</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-md border border-slate-200/50 shadow-sm col-span-2 lg:col-span-1 flex flex-col justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Nghỉ phép/Off</span>
                <span className="text-2xl font-black text-slate-600 mt-2 block">{stats.off}</span>
            </div>
        </div>
    );
}
