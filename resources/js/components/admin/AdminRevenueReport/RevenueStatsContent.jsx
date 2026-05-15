import React from 'react';
import { formatPrice } from '../../../shared/utils/formatCurrency';

/**
 * RevenueStatsContent
 * [WHY] Visualizes the core report metrics (Total Revenue, Orders, Segments).
 * [RULE] Displays state-driven content with smooth transitions.
 */
const RevenueStatsContent = ({ stats, loading }) => {
    return (
        <div className="p-4 md:p-8 lg:p-14">
            {/* ─── CENTERED REVENUE OVERVIEW ─── */}
            <div className="flex flex-col items-center mb-10 md:mb-16">
                <h5 className="mb-4 uppercase tracking-[0.01em] text-center">Tổng doanh thu</h5>
                <div className="flex flex-wrap justify-center items-baseline gap-4">
                    <span className="text-[42px] md:text-[64px] lg:text-[88px] font-black mdt-text-primary tracking-tighter leading-none">
                        {formatPrice(stats?.total_revenue || 0)}
                    </span>

                    <span className="h5 text-slate-400 uppercase tracking-widest">VND</span>
                </div>
            </div>

            {/* ─── ORDER METRICS GRID ─── */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-10">
                {/* Total Orders */}
                <div className="col-span-2 md:col-span-1 bg-[#eff6ff] p-5 md:p-6 rounded-[16px] border border-blue-50/50 flex flex-col justify-between min-h-[130px] md:min-h-[150px] group hover:bg-[#dbeafe] transition-all">
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Tổng đơn</span>
                        <div className="p-2 bg-white text-blue-600 rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                        </div>
                    </div>
                    <div className="text-[32px] sm:text-[36px] md:text-[42px] font-black text-slate-900 tracking-tight leading-none">{stats?.total_orders || 0}</div>
                </div>

                {/* Individual Orders */}
                <div className="col-span-1 bg-[#eff6ff] px-2 py-2 md:p-6 rounded-[16px] border border-blue-50/50 flex flex-col justify-between min-h-[130px] md:min-h-[150px] group hover:bg-[#dbeafe] transition-all">
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-[9px] md:text-[10px] font-black text-blue-600 uppercase tracking-widest">Khách lẻ</span>
                        <div className="p-2 bg-white text-blue-600 rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                            <svg className="w-3 h-3 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        </div>
                    </div>
                    <div className="text-[28px] sm:text-[36px] md:text-[42px] font-black text-slate-900 tracking-tight leading-none">{stats?.individual_orders || 0}</div>
                </div>

                {/* Group Orders */}
                <div className="col-span-1 bg-[#eff6ff] px-2 py-2 md:p-6 rounded-[16px] border border-blue-50/50 flex flex-col justify-between min-h-[130px] md:min-h-[150px] group hover:bg-[#dbeafe] transition-all">
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-[9px] md:text-[10px] font-black text-blue-600 uppercase tracking-widest">Khách đoàn</span>
                        <div className="p-2 bg-white text-blue-600 rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                            <svg className="w-3 h-3 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                        </div>
                    </div>

                    <div className="text-[28px] sm:text-[36px] md:text-[42px] font-black text-slate-900 tracking-tight leading-none">{stats?.group_orders || 0}</div>
                </div>
            </div>

            {/* ─── PAYMENT BREAKDOWN ROW ─── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Tiền mặt', val: stats?.cash_revenue, icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' },
                    { label: 'Chuyển khoản', val: stats?.bank_revenue, icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
                    { label: 'Cà thẻ', val: stats?.card_revenue, icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z M9 12h6' },
                    { label: 'Công nợ', val: stats?.debt_revenue, icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' }
                ].map((item, idx) => (
                    <div key={idx} className="bg-[#f0f9ff] px-2 py-3 md:p-5 rounded-[12px] border border-blue-50/50 flex flex-col gap-3 group hover:bg-[#e0f2fe] transition-all">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg text-blue-600 shadow-sm border border-blue-100/20">
                                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} /></svg>
                            </div>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{item.label}</span>
                        </div>
                        <div className="text-[16px] md:text-[22px] font-black text-slate-900">{formatPrice(item.val || 0)}đ</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RevenueStatsContent;
