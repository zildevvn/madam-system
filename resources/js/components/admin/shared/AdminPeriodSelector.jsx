import React from 'react';

/**
 * AdminPeriodSelector
 * [WHY] Provides a clean segmented control for switching report scope across the admin panel.
 * [RULE] Minimal UI component, logic is passed down via props.
 */
const AdminPeriodSelector = ({ periods, currentPeriod, onPeriodChange }) => {
    return (
        <div className="flex bg-[#f1f5f9] p-1 rounded-full w-full lg:w-auto overflow-x-auto no-scrollbar">
            {periods.map((p) => (
                <button
                    key={p.id}
                    onClick={() => onPeriodChange(p.id)}
                    className={`flex-1 lg:flex-none px-3 sm:px-6 py-2 rounded-full text-[11px] font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap ${currentPeriod === p.id
                        ? 'bg-white text-[#1e293b] shadow-[0_2px_8px_rgba(0,0,0,0.08)] scale-[1.02]'
                        : 'text-slate-400 hover:text-slate-600'}`}
                >
                    {p.label}
                </button>
            ))}
        </div>
    );
};

export default AdminPeriodSelector;
