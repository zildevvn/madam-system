import React from 'react';

const ExpenseTypeSelector = ({ currentType, onTypeChange }) => {
    return (
        <div className="space-y-3">
            <label className="block text-[11px] font-black text-gray-600 uppercase tracking-[0.2em] mb-2">Loại chi phí</label>
            <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-50 rounded-xl border border-slate-100">
                <button
                    type="button"
                    onClick={() => onTypeChange('variable')}
                    className={`cursor-pointer py-3 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${currentType === 'variable'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-400 hover:text-slate-600'}`}
                >
                    Biến đổi
                </button>
                <button
                    type="button"
                    onClick={() => onTypeChange('fixed')}
                    className={`cursor-pointer py-3 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${currentType === 'fixed'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-400 hover:text-slate-600'}`}
                >
                    Cố định
                </button>
            </div>
        </div>
    );
};

export default ExpenseTypeSelector;
