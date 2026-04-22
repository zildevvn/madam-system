import React from 'react';

/**
 * Expense Filter Header Component
 * WHY: Adheres to component rule (<200 lines) by extracting the top-row filter UI.
 * Contains search input and type selection toggle.
 */
const ExpenseFilterHeader = ({ searchTerm, setSearchTerm, typeFilter, setTypeFilter }) => {
    return (
        <div className="flex flex-col sm:flex-row flex-1 max-w-2xl gap-3">
            <div className="relative flex-1 group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-orange-500 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <input
                    type="text"
                    placeholder="Tìm kiếm chi tiêu..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="mdt-btn !text-[16px] !w-full !bg-white !pl-12 !pr-4 !py-3 placeholder:text-slate-300 focus:outline-none !text-slate-900 shadow-sm border border-slate-100"
                />
                {searchTerm && (
                    <button
                        onClick={() => setSearchTerm('')}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-300 hover:text-slate-500 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                )}
            </div>

            <div className="max-w-fit mx-auto md:mx-0 flex bg-slate-100 p-1 rounded-xl border border-slate-200/50 sm:w-auto h-[52px]">
                {['all', 'variable', 'fixed'].map((type) => (
                    <button
                        key={type}
                        onClick={() => setTypeFilter(type)}
                        className={`cursor-pointer px-4 rounded-[10px] text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${typeFilter === type
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        {type === 'all' ? 'Tất cả' : type === 'fixed' ? 'Cố định' : 'Biến đổi'}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default ExpenseFilterHeader;
