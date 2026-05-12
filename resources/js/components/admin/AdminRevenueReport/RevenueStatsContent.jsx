import React from 'react';
import { formatPrice } from '../../../shared/utils/formatCurrency';

/**
 * RevenueStatsContent
 * [WHY] Visualizes the core report metrics (Total Revenue, Orders, Segments).
 * [RULE] Displays state-driven content with smooth transitions.
 */
const RevenueStatsContent = ({ stats, loading }) => {
    return (
        <div className="p-6 lg:p-10 lg:pt-0">
            <div className="flex flex-col items-center">
                <h3 className="mb-3 text-slate-400 text-[11px] font-black uppercase tracking-[0.25em]">Tổng doanh thu</h3>
                <div className="flex items-baseline gap-2 mb-3 md:mb-6">
                    <span className="h3 mdt-text-primary text-4xl lg:text-7xl tracking-tighter">
                        {formatPrice(stats?.total_revenue)}
                    </span>
                    <span className="h4 !font-black !text-slate-400 tracking-widest uppercase">vnd</span>
                </div>

                <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-slate-100 to-transparent mb-3 md:mb-6"></div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 w-full">
                    {/* Orders Metric */}
                    <div className="bg-blue-50/30 p-3 md:p-6 rounded-[10px] border border-blue-100/50 group transition-all hover:bg-blue-50">
                        <p className="text-blue-500/60 text-[9px] font-black uppercase tracking-widest mb-3">Tổng đơn</p>
                        <div className="flex items-center justify-between">
                            <div className="text-3xl font-black text-slate-900 tracking-tight">{stats?.total_orders}</div>
                            <div className="p-3 bg-white rounded-xl text-blue-500 shadow-sm group-hover:scale-110 transition-transform">
                                <svg className="w-4 h-4 md:w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Individual Orders Metric */}
                    <div className="bg-green-50/30 p-3 md:p-6 rounded-[10px] border border-green-100/50 group transition-all hover:bg-green-50">
                        <p className="text-green-600/60 text-[9px] font-black uppercase tracking-widest mb-3">Khách lẻ</p>
                        <div className="flex items-center justify-between">
                            <div className="text-3xl font-black text-slate-900 tracking-tight">{stats?.individual_orders}</div>
                            <div className="p-3 bg-white rounded-xl text-green-500 shadow-sm group-hover:scale-110 transition-transform">
                                <svg className="w-4 h-4 md:w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Group Orders Metric */}
                    <div className="bg-purple-50/30 p-3 md:p-6 rounded-[10px] border border-purple-100/50 group transition-all hover:bg-purple-50">
                        <p className="text-purple-600/60 text-[9px] font-black uppercase tracking-widest mb-3">Khách đoàn</p>
                        <div className="flex items-center justify-between">
                            <div className="text-3xl font-black text-slate-900 tracking-tight">{stats?.group_orders}</div>
                            <div className="p-3 bg-white rounded-xl text-purple-600 shadow-sm group-hover:scale-110 transition-transform">
                                <svg className="w-4 h-4 md:w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-slate-100 to-transparent mb-3 md:mb-6"></div>
                
                <p className="w-full text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 text-center">Phân loại thanh toán</p>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                    {/* Cash */}
                    <div className="bg-emerald-50/40 p-4 rounded-2xl border border-emerald-100/50 group transition-all hover:bg-emerald-50">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-white rounded-lg text-emerald-600 shadow-sm">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Tiền mặt</span>
                        </div>
                        <div className="text-xl font-black text-slate-900">{formatPrice(stats?.cash_revenue)}đ</div>
                    </div>

                    {/* Bank */}
                    <div className="bg-blue-50/40 p-4 rounded-2xl border border-blue-100/50 group transition-all hover:bg-blue-50">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-white rounded-lg text-blue-600 shadow-sm">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                </svg>
                            </div>
                            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Chuyển khoản</span>
                        </div>
                        <div className="text-xl font-black text-slate-900">{formatPrice(stats?.bank_revenue)}đ</div>
                    </div>

                    {/* Card */}
                    <div className="bg-orange-50/40 p-4 rounded-2xl border border-orange-100/50 group transition-all hover:bg-orange-50">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-white rounded-lg text-orange-600 shadow-sm">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6" />
                                </svg>
                            </div>
                            <span className="text-[10px] font-bold text-orange-700 uppercase tracking-wider">Cà thẻ</span>
                        </div>
                        <div className="text-xl font-black text-slate-900">{formatPrice(stats?.card_revenue)}đ</div>
                    </div>

                    {/* Debt */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 group transition-all hover:bg-slate-100">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-white rounded-lg text-slate-600 shadow-sm border border-slate-100">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                </svg>
                            </div>
                            <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Công nợ</span>
                        </div>
                        <div className="text-xl font-black text-slate-900">{formatPrice(stats?.debt_revenue)}đ</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RevenueStatsContent;
