import React from 'react';

/**
 * RevenuePeriodSelector
 * [WHY] Provides a clean segmented control for switching report scope.
 * [RULE] Minimal UI component, logic is passed down via props.
 */
const RevenuePeriodSelector = ({ periods, currentPeriod, onPeriodChange }) => {
    return (
        <div className="flex bg-slate-200/50 p-1 rounded-[14px] w-full md:w-auto overflow-x-auto no-scrollbar">
            {periods.map((p) => (
                <button
                    key={p.id}
                    onClick={() => onPeriodChange(p.id)}
                    className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap ${currentPeriod === p.id
                        ? 'bg-white text-orange-600 shadow-sm scale-[1.02]'
                        : 'text-slate-500 hover:text-slate-700'}`}
                >
                    {p.label}
                </button>
            ))}
        </div>
    );
};

export default RevenuePeriodSelector;
