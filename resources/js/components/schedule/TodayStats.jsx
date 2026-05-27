import React from 'react';

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
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 3v1m0 16v1m9-9h-1M4 9h-1m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" /></svg>
                </div>
                <div className="min-w-0">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Ca Sáng</span>
                    <h6 className="font-black text-slate-800 tracking-tight mt-0.5">{todayStats.morning} nhân sự</h6>
                </div>
            </div>

            {/* Evening Shift Stat */}
            <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm flex items-center gap-3 hover:shadow-md transition-all">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center flex-shrink-0 shadow-inner">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                </div>
                <div className="min-w-0">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Ca Tối</span>
                    <h6 className="font-black text-slate-800 tracking-tight mt-0.5">{todayStats.evening} nhân sự</h6>
                </div>
            </div>

            {/* Full-time Shift Stat */}
            <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm flex items-center gap-3 hover:shadow-md transition-all">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 shadow-inner">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
                <div className="min-w-0">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Full Time</span>
                    <h6 className="font-black text-slate-800 tracking-tight mt-0.5">{todayStats.fullTime} nhân sự</h6>
                </div>
            </div>

            {/* Off Today Stat */}
            <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm flex items-center gap-3 hover:shadow-md transition-all">
                <div className="w-9 h-9 rounded-xl bg-red-50 text-red-500 flex items-center justify-center flex-shrink-0 shadow-inner">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                </div>
                <div className="min-w-0">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Nghỉ Phép</span>
                    <h6 className="font-black text-slate-800 tracking-tight mt-0.5">{todayStats.off} nhân sự</h6>
                </div>
            </div>
        </div>
    );
}
