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
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className={`bg-white rounded-[16px] shadow-sm border border-slate-100 transition-all duration-500 p-6 lg:p-10 ${loading ? 'opacity-50' : 'opacity-100'}`}>
                <div className="flex flex-col items-center">
                    {/* Identification Header */}
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 text-red-600 rounded-full border border-red-100/50 mb-10">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-[10px] font-black uppercase tracking-widest">Báo cáo chi phí vận hành</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 w-full max-w-6xl">
                        {/* Fixed Expenses */}
                        <div className="flex flex-col">
                            <div className="flex flex-col items-center mb-6">
                                <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1">Cố định</p>
                                <p className="text-slate-300 text-[8px] font-bold uppercase tracking-widest mb-3 italic">({getFixedLabel()})</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-black text-rose-500 tracking-tighter">
                                        {formatPrice(stats?.fixed_expenses)}
                                    </span>
                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">vnd</span>
                                </div>
                            </div>

                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {stats?.fixed_items?.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-3 bg-slate-50/50 rounded-xl border border-slate-100/50 group hover:bg-white hover:border-rose-100 transition-all">
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-bold text-slate-800">{item.description || item.category}</span>
                                            <span className="text-[9px] font-medium text-slate-400 uppercase tracking-wider">{item.date}</span>
                                        </div>
                                        <span className="text-[11px] font-black text-rose-500">{formatPrice(item.amount)}</span>
                                    </div>
                                ))}
                                {(!stats?.fixed_items || stats.fixed_items.length === 0) && (
                                    <p className="text-center text-slate-300 text-[10px] font-bold py-10 uppercase tracking-widest italic">Trống</p>
                                )}
                            </div>
                        </div>

                        {/* Variable Expenses */}
                        <div className="flex flex-col border-t md:border-t-0 md:border-l border-slate-50 pt-8 md:pt-0 md:pl-16">
                            <div className="flex flex-col items-center mb-6">
                                <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1">Biến đổi</p>
                                <p className="text-slate-300 text-[8px] font-bold uppercase tracking-widest mb-3 italic">({getVariableLabel()})</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-black text-orange-500 tracking-tighter">
                                        {formatPrice(stats?.variable_expenses)}
                                    </span>
                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">vnd</span>
                                </div>
                            </div>

                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {stats?.variable_items?.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-3 bg-slate-50/50 rounded-xl border border-slate-100/50 group hover:bg-white hover:border-orange-100 transition-all">
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-bold text-slate-800">{item.description || item.category}</span>
                                            <span className="text-[9px] font-medium text-slate-400 uppercase tracking-wider">
                                                {new Date(item.created_at || item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <span className="text-[11px] font-black text-orange-500">{formatPrice(item.amount)}</span>
                                    </div>
                                ))}
                                {(!stats?.variable_items || stats.variable_items.length === 0) && (
                                    <p className="text-center text-slate-300 text-[10px] font-bold py-10 uppercase tracking-widest italic">Trống</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Total Expenses Summary */}
                    <div className="mt-12 pt-6 border-t border-slate-50 w-full flex flex-col items-center">
                        <span className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2 font-sans">Tổng chi phí vận hành</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-slate-900 tracking-tight">
                                {formatPrice((stats?.total_expenses || 0))}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">vnd</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminExpenses;
