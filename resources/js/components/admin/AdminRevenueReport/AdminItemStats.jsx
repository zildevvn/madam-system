import React, { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { formatPrice } from '../../../shared/utils/formatCurrency';

/**
 * ItemStatsModal
 * [WHY] Displays the full ranked list of products for the selected period.
 * [RULE] Fetches data independently to keep the main dashboard response small.
 */
const ItemStatsModal = ({ isOpen, onClose, filters, type, totalItemsCount }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchFullStats = useCallback(async () => {
        if (!filters) return;
        try {
            setLoading(true);
            let url = `/api/stats/item-stats?period=${filters.period}`;
            if (filters.period === 'week' && filters.startDate && filters.endDate) {
                url += `&start_date=${filters.startDate}&end_date=${filters.endDate}`;
            } else {
                url += `&date=${filters.selectedDate}`;
            }
            const res = await axios.get(url);
            let results = res.data.data;
            // For least-selling, we reverse the rank if the API returns most-sold first
            if (type === 'bottom') {
                results = [...results].reverse();
            }
            setData(results);
        } catch (error) {
            console.error('Failed to fetch full item stats:', error);
        } finally {
            setLoading(false);
        }
    }, [filters, type]);

    useEffect(() => {
        if (isOpen) {
            fetchFullStats();
        }
    }, [isOpen, fetchFullStats]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-[24px] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0 bg-white">
                    <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-[12px] text-white shadow-sm ${type === 'top' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                {type === 'top' ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                                )}
                            </svg>
                        </div>
                        <div>
                            <h5 className="text-slate-900 mb-0 font-black text-base uppercase tracking-widest leading-none mb-1">
                                {type === 'top' ? 'Toàn bộ Bán chạy' : 'Toàn bộ Bán ít'}
                            </h5>

                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                {type === 'top' ? 'Sắp xếp theo số lượng giảm dần' : 'Sắp xếp theo số lượng tăng dần'}
                            </span>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-all">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar bg-slate-50/30">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24">
                            <div className="w-12 h-12 border-4 border-slate-100 border-t-orange-500 rounded-full animate-spin mb-4"></div>
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Đang tải bảng xếp hạng...</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-[20px] border border-slate-100 overflow-hidden shadow-sm">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50/50">
                                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                        <th className="py-3 px-1 md:py-4 md:px-3 md:px-6">Sản phẩm</th>
                                        <th className="py-3 px-1 md:py-4 md:px-3 md:px-6 text-right">Số lượng</th>
                                        <th className="py-3 px-1 md:py-4 md:px-3 md:px-6 text-right">Doanh thu</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.map((item, idx) => (
                                        <tr key={idx} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors group">
                                            <td className="py-3 px-1 md:py-4 md:px-3 md:px-6">
                                                <div className="flex flex-col">
                                                    <span className="font-black text-slate-700 text-[13px]">{item.name}</span>
                                                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                                                        {type === 'top' ? `Hạng #${idx + 1}` : `Hạng #${totalItemsCount - idx}`}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className={`py-3 px-1 md:py-4 md:px-3 md:px-6 text-right font-black text-[16px] ${type === 'top' ? 'text-emerald-600' : 'text-rose-600'}`}>{item.total_quantity}</td>
                                            <td className="py-3 px-1 md:py-4 md:px-3 md:px-6 text-right font-bold text-slate-500 text-sm">{formatPrice(item.total_sales)}đ</td>
                                        </tr>
                                    ))}
                                    {data.length === 0 && (
                                        <tr>
                                            <td colSpan="3" className="py-20 text-center opacity-30 italic text-slate-400 text-sm">Không tìm thấy dữ liệu sản phẩm</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="p-6 bg-white border-t border-gray-100 flex justify-end">
                    <button onClick={onClose} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95">
                        Hoàn tất
                    </button>
                </div>
            </div>
        </div>
    );
};

/**
 * AdminItemStats
 * [WHY] Displays top-selling and least-selling items to provide product-level performance insights.
 * [RULE] Synchronizes with global admin filters (Day, Week, Month, Year).
 */
const AdminItemStats = ({ stats, loading, filters }) => {
    const [modalType, setModalType] = useState(null); // 'top' or 'bottom' or null

    if (loading && !stats) return null;

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
