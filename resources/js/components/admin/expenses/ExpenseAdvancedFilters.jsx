import React from 'react';

/**
 * Expense Advanced Filters Component
 * WHY: Adheres to component rule (<200 lines) by extracting advanced filtering logic.
 * Contains month/year selection, date picker, and reset button.
 */
const ExpenseAdvancedFilters = ({ 
    yearFilter, setYearFilter, 
    monthFilter, setMonthFilter, 
    dateFilter, setDateFilter 
}) => {
    return (
        <div className="mt-4 flex flex-wrap items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-500">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm min-w-[280px] flex-1 sm:flex-none h-[52px]">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">Tháng/Năm:</span>
                <div className="flex items-center flex-1">
                    <select 
                        value={monthFilter}
                        onChange={(e) => {
                            setMonthFilter(e.target.value);
                            if (e.target.value) setDateFilter('');
                        }}
                        className="bg-transparent border-none text-[13px] font-black uppercase text-slate-800 focus:ring-0 p-0 cursor-pointer flex-1 text-center sm:text-left appearance-none"
                    >
                        <option value="">Tất cả tháng</option>
                        {Array.from({ length: 12 }, (_, i) => {
                            const m = (i + 1).toString().padStart(2, '0');
                            return <option key={m} value={m}>Tháng {m}</option>;
                        })}
                    </select>
                    <span className="text-slate-300 mx-1">/</span>
                    <select 
                        value={yearFilter}
                        onChange={(e) => {
                            setYearFilter(e.target.value);
                            if (e.target.value) setDateFilter('');
                        }}
                        className="bg-transparent border-none text-[13px] font-black uppercase text-slate-800 focus:ring-0 p-0 cursor-pointer w-[60px] text-center sm:text-left appearance-none"
                    >
                        <option value="">Năm</option>
                        {[2024, 2025, 2026].map(y => (
                            <option key={y} value={y.toString()}>{y}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm min-w-[200px] flex-1 sm:flex-none h-[52px]">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">Ngày:</span>
                <input 
                    type="date" 
                    value={dateFilter}
                    onChange={(e) => {
                        setDateFilter(e.target.value);
                        if (e.target.value) {
                            setMonthFilter(''); 
                            setYearFilter('');
                        }
                    }}
                    className="bg-transparent border-none text-[13px] font-black uppercase text-slate-800 focus:ring-0 p-0 cursor-pointer w-full text-center sm:text-left"
                />
            </div>

            {/* WHY: Clear Filters button only appears when date/month filters are applied as requested */}
            {(monthFilter || dateFilter || (yearFilter !== new Date().getFullYear().toString() && yearFilter !== '')) && (
                <button 
                    onClick={() => {
                        setMonthFilter('');
                        setYearFilter(new Date().getFullYear().toString());
                        setDateFilter('');
                    }}
                    className="text-[9px] h-[52px] font-black text-orange-500 uppercase tracking-widest hover:text-orange-600 transition-all flex items-center justify-center gap-1.5 px-6 bg-orange-50 rounded-xl border border-orange-100/50 flex-1 sm:flex-none active:scale-95"
                >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                    Xóa bộ lọc
                </button>
            )}
        </div>
    );
};

export default ExpenseAdvancedFilters;
