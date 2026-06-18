import React from 'react';
import Icon from '../shared/Icon';

/**
 * TodayStats Component
 * [WHY] Displays real-time today staffing stats cards in a 4-column responsive grid.
 * [RULE] Under 200 lines of code for clean responsibility segregation.
 */
export default function TodayStats({ todayStats }) {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Morning Shift Stat */}
            <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm flex items-center gap-3 hover:shadow-md transition-all">
                <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center flex-shrink-0 shadow-inner">
                    <Icon name="sun" className="w-5 h-5" size={20} strokeWidth={2.5} />
                </div>
                <div className="min-w-0">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Ca Sáng</span>
                    <h6 className="font-black text-slate-800 tracking-tight mt-0.5">{todayStats.morning} nhân sự</h6>
                </div>
            </div>

            {/* Evening Shift Stat */}
            <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm flex items-center gap-3 hover:shadow-md transition-all">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center flex-shrink-0 shadow-inner">
                    <Icon name="moon" className="w-5 h-5" size={20} strokeWidth={2.5} />
                </div>
                <div className="min-w-0">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Ca Tối</span>
                    <h6 className="font-black text-slate-800 tracking-tight mt-0.5">{todayStats.evening} nhân sự</h6>
                </div>
            </div>

            {/* Full-time Shift Stat */}
            <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm flex items-center gap-3 hover:shadow-md transition-all">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 shadow-inner">
                    <Icon name="briefcase" className="w-5 h-5" size={20} strokeWidth={2.5} />
                </div>
                <div className="min-w-0">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Full Time</span>
                    <h6 className="font-black text-slate-800 tracking-tight mt-0.5">{todayStats.fullTime} nhân sự</h6>
                </div>
            </div>

            {/* Off Today Stat */}
            <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm flex items-start gap-3 hover:shadow-md transition-all">
                <div className="w-9 h-9 rounded-xl bg-red-50 text-red-500 flex items-center justify-center flex-shrink-0 shadow-inner mt-0.5">
                    <Icon name="shield" className="w-5 h-5" size={20} strokeWidth={2.5} />
                </div>
                <div className="min-w-0 w-full" id="ff7d0f">
                    <span className="text-[14px] text-slate-800 font-bold uppercase tracking-wider block">Off Today</span>
                    <h6 className="text-[14px] font-black text-slate-800 tracking-tight mt-0.5">{todayStats.off}</h6>
                    <div className="mt-2 pt-2 border-t border-slate-100 space-y-1 text-[10px] sm:text-[12px] text-slate-700 font-bold">
                        <div className="flex gap-2 items-center">
                            <span>Ca Sáng:</span>
                            <span className="text-slate-800 font-black">{todayStats.morningOff || 0}</span>
                        </div>
                        <div className="flex gap-2 items-center">
                            <span>Ca Tối:</span>
                            <span className="text-slate-800 font-black">{todayStats.eveningOff || 0}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
