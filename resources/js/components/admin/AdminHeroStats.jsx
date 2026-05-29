import React from 'react';
import { formatPrice } from '../../shared/utils/formatCurrency';
import Icon from '../shared/Icon';

const AdminHeroStats = ({ users, revenue }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-8 mb-8 sm:mb-16">
            <div className="relative overflow-hidden bg-white p-6 sm:p-10 rounded-[32px] sm:rounded-[48px] shadow-sm border border-slate-100 group transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/10 active:scale-95 sm:hover:-translate-y-2">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                <div className="relative text-slate-400 text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-3 sm:mb-4 flex items-center gap-3">
                    <div className="p-2 sm:p-2.5 bg-blue-50 rounded-xl sm:rounded-2xl text-blue-500 ring-4 ring-blue-50/50">
                        <Icon name="users" size={16} className="w-4 h-4" />
                    </div>
                    Tổng nhân viên
                </div>
                <div className="relative text-4xl sm:text-5xl font-black text-slate-900 transition-all group-hover:text-blue-600">{users.length}</div>
            </div>

            <div className="relative overflow-hidden bg-[#0a0f1e] p-6 sm:p-10 rounded-[32px] sm:rounded-[48px] shadow-2xl group transition-all duration-500 active:scale-95 sm:hover:-translate-y-2">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full -mr-16 -mt-16 transition-transform duration-700 group-hover:scale-150"></div>
                <div className="relative text-orange-500/60 text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-3 sm:mb-4 flex items-center gap-3">
                    <div className="p-2 sm:p-2.5 bg-orange-500/10 rounded-xl sm:rounded-2xl text-orange-500 ring-4 ring-orange-500/10">
                        <Icon name="shield" size={16} className="w-4 h-4" />
                    </div>
                    Ban Quản trị
                </div>
                <div className="relative text-4xl sm:text-5xl font-black text-white group-hover:text-orange-500 transition-colors uppercase">{users.filter(u => u.role === 'admin').length}</div>
            </div>

            <div className="relative overflow-hidden bg-white p-6 sm:p-10 rounded-[32px] sm:rounded-[48px] shadow-sm border border-slate-100 group transition-all duration-500 hover:shadow-2xl hover:shadow-green-500/10 active:scale-95 sm:hover:-translate-y-2">
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-50/50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                <div className="relative text-slate-400 text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-3 sm:mb-4 flex items-center gap-3">
                    <div className="p-2 sm:p-2.5 bg-green-50 rounded-xl sm:rounded-2xl text-green-500 ring-4 ring-green-50/50">
                        <Icon name="dollarSign" size={16} className="w-4 h-4" />
                    </div>
                    Doanh thu ngày
                </div>
                <div className="relative text-3xl sm:text-4xl font-black text-green-600 transition-all group-hover:text-green-700">{formatPrice(revenue)} <span className="text-[14px] sm:text-[18px]">đ</span></div>
            </div>

            <div className="relative overflow-hidden bg-white p-6 sm:p-10 rounded-[32px] sm:rounded-[48px] shadow-sm border border-slate-100 group transition-all duration-500 hover:shadow-2xl hover:shadow-green-500/10 active:scale-95 sm:hover:-translate-y-2">
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-50/50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                <div className="relative text-slate-400 text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-3 sm:mb-4 flex items-center gap-3">
                    <div className="p-2 sm:p-2.5 bg-green-50 rounded-xl sm:rounded-2xl text-green-500 ring-4 ring-green-50/50">
                        <Icon name="zap" size={16} className="w-4 h-4" />
                    </div>
                    Trạng thái
                </div>
                <div className="relative text-4xl sm:text-5xl font-black text-green-500 transition-all uppercase">Active</div>
            </div>
        </div>
    );
};

export default AdminHeroStats;
