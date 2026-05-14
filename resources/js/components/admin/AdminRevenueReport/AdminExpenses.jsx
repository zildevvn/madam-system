import React from 'react';
import { formatPrice } from '../../../shared/utils/formatCurrency';

/**
 * AdminExpenses
 * [WHY] Provides a standalone report card for operating expenses.
 * [RULE] Now supports dynamic filtering (Day, Week, Month, Year) passed from AdminContent.
 */
const AdminExpenses = ({ stats, loading, period }) => {
    
    // Period Label Mapping for Variable Expenses
    const getVariableLabel = () => {
        switch(period) {
            case 'day': return 'Hôm nay';
            case 'week': return 'Trong tuần';
            case 'month': return 'Trong tháng';
            case 'year': return 'Trong năm';
            default: return 'Giai đoạn này';
        }
    };

    // Period Label Mapping for Fixed Expenses (Only Month/Year)
    const getFixedLabel = () => {
        if (period === 'year') return 'Trong năm';
        return 'Trong tháng';
    };

    if (loading && !stats) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[16px] border border-slate-100 shadow-sm animate-pulse">
                <div className="w-10 h-10 rounded-full border-4 border-slate-100 border-t-rose-500 animate-spin mb-4"></div>
                <p className="text-slate-400 font-bold text-[10px] tracking-widest uppercase">Đang tải chi phí vận hành...</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-[12px] border border-slate-100 shadow-sm p-8 lg:p-14">
            <div className="flex flex-col items-center">
                {/* ─── IDENTIFICATION BADGE ─── */}
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-full border border-red-100 mb-16">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-[11px] font-black uppercase tracking-widest leading-none">Báo cáo chi phí vận hành</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 w-full max-w-7xl">
                    {/* ─── FIXED EXPENSES ─── */}
                    <div className="flex flex-col">
                        <div className="flex flex-col items-center mb-10">
                            <p className="text-slate-900 text-[14px] font-black uppercase tracking-widest mb-1">Cố định</p>
                            <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-4 italic">({getFixedLabel()})</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-[48px] font-black text-rose-600 tracking-tighter leading-none">
                                    {formatPrice(stats?.fixed_expenses || 0)}
                                </span>
                                <span className="text-sm font-black text-slate-300 uppercase tracking-widest">vnd</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {stats?.fixed_items?.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center p-4 bg-[#eff6ff] rounded-[10px] border border-blue-50/50 hover:bg-[#dbeafe] transition-all">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[13px] font-black text-slate-800">{item.description || item.category}</span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.date}</span>
                                    </div>
                                    <span className="text-[16px] font-black text-rose-600">{formatPrice(item.amount)}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ─── VARIABLE EXPENSES ─── */}
                    <div className="flex flex-col border-t md:border-t-0 md:border-l border-slate-50 pt-12 md:pt-0 md:pl-20">
                        <div className="flex flex-col items-center mb-10">
                            <p className="text-slate-900 text-[14px] font-black uppercase tracking-widest mb-1">Biến đổi</p>
                            <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-4 italic">({getVariableLabel()})</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-[48px] font-black text-rose-600 tracking-tighter leading-none">
                                    {formatPrice(stats?.variable_expenses || 0)}
                                </span>
                                <span className="text-sm font-black text-slate-300 uppercase tracking-widest">vnd</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {stats?.variable_items?.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center p-4 bg-[#eff6ff] rounded-[10px] border border-blue-50/50 hover:bg-[#dbeafe] transition-all">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[13px] font-black text-slate-800">{item.description || item.category}</span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                            {item.date} {item.created_at ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                        </span>
                                    </div>
                                    <span className="text-[16px] font-black text-rose-600">{formatPrice(item.amount)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ─── TOTAL EXPENSES SUMMARY ─── */}
                <div className="mt-20 pt-12 border-t border-slate-100 w-full flex flex-col items-center">
                    <span className="text-slate-400 text-[13px] font-black uppercase tracking-[0.4em] mb-4">Tổng chi phí vận hành</span>
                    <div className="flex items-baseline gap-4">
                        <span className="text-[54px] font-black text-slate-900 tracking-tight leading-none">
                            {formatPrice(stats?.total_expenses || 0)}
                        </span>
                        <span className="text-2xl font-black text-slate-300 uppercase tracking-widest">vnd</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminExpenses;
