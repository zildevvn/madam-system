import React from 'react';
import { formatPrice } from '../../../shared/utils/formatCurrency';

/**
 * AdminProfitReport Component
 * [WHY] Displays the final profit calculation: Revenue - (Fixed Costs + Variable Costs).
 * [RULE] Reuses existing stats and formatting for consistency.
 */
const AdminProfitReport = ({ stats, loading }) => {
    // [WHY] These values are now period-accurate from the StatsService backend.
    const revenue = stats?.total_revenue || 0;
    const fixedCosts = stats?.fixed_expenses || 0;
    const variableCosts = stats?.variable_expenses || 0;

    // [FORMULA] Profit = Revenue - (Fixed Costs + Variable Costs)
    const profit = revenue - (fixedCosts + variableCosts);

    const isPositive = profit >= 0;

    if (loading && !stats) return null;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ─── LỢI NHUẬN RÒNG CARD ─── */}
            <div className="lg:col-span-2 bg-white rounded-[12px] border border-slate-100 shadow-sm p-4 md:p-8 flex flex-col justify-between ">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 text-slate-600 rounded-full border border-slate-100 mb-8">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-[10px] font-black uppercase tracking-widest leading-none">Lợi nhuận ròng ước tính</span>
                    </div>

                    <div className="flex flex-wrap items-baseline gap-4 mb-8">
                        <span className={`text-[42px] md:text-[64px] lg:text-[72px] font-black tracking-tighter leading-none ${isPositive ? 'mdt-text-primary' : 'text-emerald-500'}`}>
                            {profit < 0 ? '-' : ''}{formatPrice(Math.abs(profit))}
                        </span>
                        <span className="h5 text-slate-400 uppercase tracking-widest">VND</span>
                    </div>
                </div>

                <p className="text-[11px] font-bold text-slate-600 italic">
                    * Công thức: Doanh thu - (Chi phí cố định + Chi phí biến đổi)
                </p>
            </div>

            {/* ─── QUICK METRICS SIDEBAR ─── */}
            <div className="flex flex-col gap-6">
                {/* Revenue Quick Card */}
                <div className="flex-1 bg-white rounded-[12px] border border-slate-100 shadow-sm p-3 md:p-6 flex flex-col justify-between relative overflow-hidden group">
                    <div className="flex justify-between items-start relative z-10">
                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Doanh thu</span>
                        <div className="w-10 h-10 flex items-center justify-center bg-blue-50 text-blue-600 rounded-full group-hover:scale-110 transition-transform">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                        </div>
                    </div>
                    <div className="text-[28px] md:text-[32px] font-black text-slate-900 tracking-tight leading-none mt-2 md:mt-4">
                        {formatPrice(revenue)}đ
                    </div>
                    {/* Background Accent */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/20 rounded-full translate-x-16 -translate-y-16" />
                </div>

                {/* Costs Breakdown Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="item-costs-breakdown bg-white rounded-[12px] border border-slate-100 shadow-sm px-2 py-4 flex flex-row items-center justify-between gap-2">
                        <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest whitespace-nowrap">CP Cố định</span>
                        <div className="text-[16px] font-black text-slate-900 leading-none whitespace-nowrap">
                            {formatPrice(fixedCosts)}đ
                        </div>
                    </div>
                    <div className="item-costs-breakdown bg-white rounded-[12px] border border-slate-100 shadow-sm px-2 py-4 flex flex-row items-center justify-between gap-2">
                        <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest whitespace-nowrap">CP Biến đổi</span>
                        <div className="text-[16px] font-black text-slate-900 leading-none whitespace-nowrap">
                            {formatPrice(variableCosts)}đ
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminProfitReport;
