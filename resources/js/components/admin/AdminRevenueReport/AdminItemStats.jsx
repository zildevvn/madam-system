import React, { useState } from 'react';
import { formatPrice } from '../../../shared/utils/formatCurrency';
import ItemStatsModal from './ItemStatsModal';

/**
 * AdminItemStats
 * [WHY] Provides a summary view of product performance (Best/Least selling).
 * [RULE] Displays only top 10 items in each category; full lists are managed by ItemStatsModal.
 */
const AdminItemStats = ({ stats, loading, filters }) => {
    const [modalType, setModalType] = useState(null); // 'top' | 'bottom' | null

    const topItems = stats?.top_items || [];
    const bottomItems = stats?.bottom_items || [];
    const totalItemsCount = stats?.total_items_count || 0;

    return (
        <>
            <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 transition-all duration-500 ${loading ? 'opacity-50' : 'opacity-100'}`}>
                {/* ─── TOP SELLERS ─── */}
                <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden group">
                    <div className="p-4 md:p-6 border-b border-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-emerald-50/30 gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-emerald-500 text-white rounded-[12px] shadow-sm group-hover:scale-110 transition-transform">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                            </div>
                            <div>
                                <h5 className="text-sm font-black text-slate-800 uppercase tracking-widest leading-none mb-1">Bán chạy nhất</h5>
                                <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Top 10 Sản phẩm</span>
                            </div>
                        </div>
                        {totalItemsCount > 10 && (
                            <button
                                onClick={() => setModalType('top')}
                                className="text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:underline px-4 py-2 bg-white border border-emerald-100 rounded-full shadow-sm active:scale-95 transition-transform"
                            >
                                Xem tất cả
                            </button>
                        )}
                    </div>
                    <div className="p-4 md:p-6">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                        <th className="py-3 px-1 md:py-4 md:px-3">Tên sản phẩm</th>
                                        <th className="py-3 px-1 md:py-4 md:px-3 text-right">Số lượng</th>
                                        <th className="py-3 px-1 md:py-4 md:px-3 text-right">Doanh thu</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {topItems.map((item, idx) => (
                                        <tr key={idx} className="border-b border-slate-50 last:border-0 hover:bg-emerald-50/20 transition-colors group/row">
                                            <td className="py-3 px-1 md:py-4 md:px-3">
                                                <div className="flex flex-col">
                                                    <span className="font-black text-slate-700 text-[13px]">{item.name}</span>
                                                    <span className="text-[9px] text-slate-400 uppercase font-bold">Thứ hạng #{idx + 1}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-1 md:py-4 md:px-3 text-right font-black text-emerald-600 text-[15px]">{item.total_quantity}</td>
                                            <td className="py-3 px-1 md:py-4 md:px-3 text-right">
                                                <div className="font-bold text-slate-500 text-[12px]">{formatPrice(item.total_sales)}đ</div>
                                            </td>
                                        </tr>
                                    ))}
                                    {topItems.length === 0 && (
                                        <tr>
                                            <td colSpan="3" className="py-16 text-center">
                                                <div className="flex flex-col items-center opacity-20">
                                                    <svg className="w-12 h-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                                                    <p className="text-xs font-black uppercase tracking-widest">Chưa có dữ liệu bán hàng</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* ─── BOTTOM SELLERS ─── */}
                <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden group">
                    <div className="p-4 md:p-6 border-b border-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-rose-50/30 gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-rose-500 text-white rounded-[12px] shadow-sm group-hover:scale-110 transition-transform">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>
                            </div>
                            <div>
                                <h5 className="text-sm font-black text-slate-800 uppercase tracking-widest leading-none mb-1">Bán ít nhất</h5>
                                <span className="text-[10px] text-rose-600 font-bold uppercase tracking-wider">Top 10 Sản phẩm</span>
                            </div>
                        </div>
                        {totalItemsCount > 10 && (
                            <button
                                onClick={() => setModalType('bottom')}
                                className="text-[10px] font-black text-rose-600 uppercase tracking-widest hover:underline px-4 py-2 bg-white border border-rose-100 rounded-full shadow-sm active:scale-95 transition-transform"
                            >
                                Xem tất cả
                            </button>
                        )}
                    </div>
                    <div className="p-4 md:p-6">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                        <th className="py-3 px-1 md:py-4 md:px-3">Tên sản phẩm</th>
                                        <th className="py-3 px-1 md:py-4 md:px-3 text-right">Số lượng</th>
                                        <th className="py-3 px-1 md:py-4 md:px-3 text-right">Doanh thu</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bottomItems.map((item, idx) => (
                                        <tr key={idx} className="border-b border-slate-50 last:border-0 hover:bg-rose-50/20 transition-colors group/row">
                                            <td className="py-3 px-1 md:py-4 md:px-3">
                                                <div className="flex flex-col">
                                                    <span className="font-black text-slate-700 text-[13px]">{item.name}</span>
                                                    <span className="text-[9px] text-slate-400 uppercase font-bold">Thứ hạng #{totalItemsCount - idx}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-1 md:py-4 md:px-3 text-right font-black text-rose-600 text-[15px]">{item.total_quantity}</td>
                                            <td className="py-3 px-1 md:py-4 md:px-3 text-right">
                                                <div className="font-bold text-slate-500 text-[12px]">{formatPrice(item.total_sales)}đ</div>
                                            </td>
                                        </tr>
                                    ))}
                                    {bottomItems.length === 0 && (
                                        <tr>
                                            <td colSpan="3" className="py-16 text-center">
                                                <div className="flex flex-col items-center opacity-20">
                                                    <svg className="w-12 h-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                                                    <p className="text-xs font-black uppercase tracking-widest">Chưa có dữ liệu bán hàng</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── FULL STATS MODAL ─── */}
            <ItemStatsModal
                isOpen={modalType !== null}
                onClose={() => setModalType(null)}
                filters={filters}
                type={modalType}
                totalItemsCount={totalItemsCount}
            />
        </>
    );
};

export default AdminItemStats;
