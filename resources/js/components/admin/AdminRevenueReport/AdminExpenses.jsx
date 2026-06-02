import React from 'react';
import { formatPrice } from '../../../shared/utils/formatCurrency';
import Icon from '../../shared/Icon';

/**
 * AdminExpenses
 * [WHY] Provides a standalone report card for operating expenses.
 * [RULE] Now supports dynamic filtering (Day, Week, Month, Year) passed from AdminContent.
 */
const AdminExpenses = ({ stats, loading, period }) => {

    // Period Label Mapping for Variable Expenses
    const getVariableLabel = () => {
        switch (period) {
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

    const ITEMS_PER_PAGE = 10;
    const [currentPageFixed, setCurrentPageFixed] = React.useState(1);
    const [currentPageVariable, setCurrentPageVariable] = React.useState(1);

    if (loading && !stats) {
        return (
            <div className="rounded-[12px] flex flex-col items-center justify-center py-20 bg-white border border-slate-100">
                <div className="w-10 h-10 rounded-full border-4 border-slate-100 border-t-rose-500 animate-spin mb-4"></div>
                <p className="text-slate-400 font-bold text-[10px] tracking-widest uppercase">Đang tải chi phí vận hành...</p>
            </div>
        );
    }

    // Pagination Logic
    const paginate = (items, page) => {
        const start = (page - 1) * ITEMS_PER_PAGE;
        return (items || []).slice(start, start + ITEMS_PER_PAGE);
    };

    const fixedItems = paginate(stats?.fixed_items, currentPageFixed);
    const variableItems = paginate(stats?.variable_items, currentPageVariable);

    const totalPagesFixed = Math.ceil((stats?.fixed_items?.length || 0) / ITEMS_PER_PAGE);
    const totalPagesVariable = Math.ceil((stats?.variable_items?.length || 0) / ITEMS_PER_PAGE);

    const Pagination = ({ current, total, onChange }) => {
        if (total <= 1) return null;
        return (
            <div className="flex items-center justify-center gap-2 mt-6">
                <button
                    onClick={() => onChange(Math.max(1, current - 1))}
                    disabled={current === 1}
                    className="p-2 rounded-lg border border-slate-100 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                >
                    <Icon name="chevronLeft" className="w-4 h-4" size={16} />
                </button>
                <div className="flex items-center gap-1">
                    {[...Array(total)].map((_, i) => (
                        <button
                            key={i}
                            onClick={() => onChange(i + 1)}
                            className={`w-8 h-8 rounded-lg text-[11px] font-black transition-all ${current === i + 1
                                ? 'mdt-bg-primary text-white shadow-sm'
                                : 'text-slate-400 hover:bg-slate-50'
                                }`}
                        >
                            {i + 1}
                        </button>
                    ))}
                </div>
                <button
                    onClick={() => onChange(Math.min(total, current + 1))}
                    disabled={current === total}
                    className="p-2 rounded-lg border border-slate-100 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                >
                    <Icon name="chevronRight" className="w-4 h-4" size={16} />
                </button>
            </div>
        );
    };

    return (
        <div className="bg-white rounded-[12px] border border-slate-100 shadow-sm p-4 md:p-10 lg:p-14">
            <div className="flex flex-col ">

                {/* ─── TOTAL EXPENSES SUMMARY ─── */}
                <div className="mb-6 pb-6 md:mb-12 md:pb-12 border-b border-slate-100 w-full flex flex-col items-center">
                    <span className="h6 uppercase">Tổng chi phí vận hành</span>
                    <div className="flex items-baseline gap-4 mt-1">
                        <span className="h1 mdt-text-primary tracking-tighter leading-none">{formatPrice(stats?.total_expenses || 0)}</span>
                        <span className="h5 text-slate-400 uppercase tracking-widest">VND</span>
                    </div>
                </div>

                {/* ─── IDENTIFICATION BADGE ─── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 md:gap-12 w-full max-w-7xl">
                    {/* ─── FIXED EXPENSES ─── */}
                    <div className="flex flex-col">
                        <div className="flex flex-col items-center mb-10">
                            <p className="text-[14px] text-rose-600 font-black uppercase tracking-widest mb-1">Cố định</p>
                            <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-4 italic">({getFixedLabel()})</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-[32px] md:text-[48px] font-black tracking-tighter leading-none">
                                    {formatPrice(stats?.fixed_expenses || 0)}
                                </span>
                                <span className="text-sm font-black text-slate-600 uppercase tracking-widest">vnd</span>
                            </div>
                        </div>

                        <div className="space-y-2 list-items">
                            {fixedItems.map((item, idx) => (
                                <div key={item.id || idx} className="flex justify-between items-center p-3 sm:p-4 bg-[#eff6ff] rounded-[10px] border border-blue-50/50 hover:bg-[#dbeafe] transition-all gap-4">
                                    <div className="flex flex-col gap-0.5 min-w-0">
                                        <span className="text-[13px] font-black text-slate-800 truncate">{item.category || item.description}</span>

                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.date}</span>
                                    </div>
                                    <span className="text-[15px] sm:text-[16px] font-black whitespace-nowrap">{formatPrice(item.amount)}</span>
                                </div>
                            ))}
                        </div>

                        <Pagination
                            current={currentPageFixed}
                            total={totalPagesFixed}
                            onChange={setCurrentPageFixed}
                        />
                    </div>

                    {/* ─── VARIABLE EXPENSES ─── */}
                    <div className="flex flex-col border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-12">
                        <div className="flex flex-col items-center mb-10">
                            <p className="text-[14px] font-black text-rose-600 uppercase tracking-widest mb-1">Biến đổi</p>
                            <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-4 italic">({getVariableLabel()})</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-[32px] md:text-[48px] font-black tracking-tighter leading-none">
                                    {formatPrice(stats?.variable_expenses || 0)}
                                </span>
                                <span className="text-sm font-black text-slate-600 uppercase tracking-widest">vnd</span>
                            </div>
                        </div>

                        <div className="space-y-2 list-items">
                            {variableItems.map((item, idx) => (
                                <div key={item.id || idx} className="flex justify-between items-center p-3 sm:p-4 bg-[#eff6ff] rounded-[10px] border border-blue-50/50 hover:bg-[#dbeafe] transition-all gap-4">
                                    <div className="flex flex-col gap-0.5 min-w-0">
                                        <span className="text-[13px] font-black text-slate-800 truncate">{item.category || item.description}</span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                            {item.date} {item.created_at ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                        </span>
                                    </div>
                                    <span className="text-[15px] sm:text-[16px] font-black whitespace-nowrap">{formatPrice(item.amount)}</span>
                                </div>
                            ))}
                        </div>

                        <Pagination
                            current={currentPageVariable}
                            total={totalPagesVariable}
                            onChange={setCurrentPageVariable}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminExpenses;
