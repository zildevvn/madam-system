import React from 'react';
import { formatPrice } from '../../../shared/utils/formatCurrency';
import Icon from '../../shared/Icon';

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
                        <div className="p-2 bg-white text-blue-600 rounded-lg shadow-sm group-hover:scale-110 transition-transform flex items-center justify-center">
                            <Icon name="shoppingBag" className="w-5 h-5" size={20} />
                        </div>
                    </div>
                    <div className="text-[32px] sm:text-[36px] md:text-[42px] font-black text-slate-900 tracking-tight leading-none">{stats?.total_orders || 0}</div>
                </div>

                {/* Individual Orders */}
                <div className="col-span-1 bg-[#eff6ff] px-2 py-2 md:p-6 rounded-[16px] border border-blue-50/50 flex flex-col justify-between min-h-[130px] md:min-h-[150px] group hover:bg-[#dbeafe] transition-all">
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-[9px] md:text-[10px] font-black text-blue-600 uppercase tracking-widest">Khách lẻ</span>
                        <div className="p-2 bg-white text-blue-600 rounded-lg shadow-sm group-hover:scale-110 transition-transform flex items-center justify-center">
                            <Icon name="user" className="w-3 h-3 md:w-5 md:h-5" size={20} />
                        </div>
                    </div>
                    <div className="text-[28px] sm:text-[36px] md:text-[42px] font-black text-slate-900 tracking-tight leading-none">{stats?.individual_orders || 0}</div>
                </div>

                {/* Group Orders */}
                <div className="col-span-1 bg-[#eff6ff] px-2 py-2 md:p-6 rounded-[16px] border border-blue-50/50 flex flex-col justify-between min-h-[130px] md:min-h-[150px] group hover:bg-[#dbeafe] transition-all">
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-[9px] md:text-[10px] font-black text-blue-600 uppercase tracking-widest">Khách đoàn</span>
                        <div className="p-2 bg-white text-blue-600 rounded-lg shadow-sm group-hover:scale-110 transition-transform flex items-center justify-center">
                            <Icon name="users" className="w-3 h-3 md:w-5 md:h-5" size={20} />
                        </div>
                    </div>

                    <div className="text-[28px] sm:text-[36px] md:text-[42px] font-black text-slate-900 tracking-tight leading-none">{stats?.group_orders || 0}</div>
                </div>
            </div>

            {/* ─── PAYMENT BREAKDOWN ROW ─── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Tiền mặt', val: stats?.cash_revenue, icon: 'dollarSign' },
                    { label: 'Chuyển khoản', val: stats?.bank_revenue, icon: 'qrCode' },
                    { label: 'Cà thẻ', val: stats?.card_revenue, icon: 'creditCard' },
                    { label: 'Công nợ', val: stats?.debt_revenue, icon: 'clipboardList' }
                ].map((item, idx) => (
                    <div key={idx} className="bg-[#f0f9ff] px-2 py-3 md:p-5 rounded-[12px] border border-blue-50/50 flex flex-col gap-3 group hover:bg-[#e0f2fe] transition-all">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg text-blue-600 shadow-sm border border-blue-100/20 flex items-center justify-center">
                                <Icon name={item.icon} className="w-4.5 h-4.5" size={18} />
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
