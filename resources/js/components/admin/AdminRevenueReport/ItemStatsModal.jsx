import React, { useState, useEffect, useCallback } from 'react';
import { formatPrice } from '../../../shared/utils/formatCurrency';
import statsApi from '../../../services/statsApi';
import Icon from '../../shared/Icon';

/**
 * ItemStatsModal
 * [WHY] Displays the full ranked list of products for deeper performance analysis.
 * [RULE] Decoupled from the summary card to handle its own data fetching for the full list.
 * [NOTE] Supports sorting by Best Selling (Top) or Least Selling (Bottom).
 */
const ItemStatsModal = ({ isOpen, onClose, filters, type, totalItemsCount }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchFullStats = useCallback(async () => {
        try {
            setLoading(true);
            const { period, selectedDate, startDate, endDate } = filters;
            const params = { period, type };
            
            if (period === 'week' && startDate && endDate) {
                params.start_date = startDate;
                params.end_date = endDate;
            } else {
                params.date = selectedDate;
            }

            const res = await statsApi.getItemStats(params);
            setData(res.data);
        } catch (error) {
            console.error('Failed to fetch item stats:', error);
        } finally {
            setLoading(false);
        }
    }, [filters, type]);

    useEffect(() => {
        if (isOpen && type) {
            fetchFullStats();
        }
    }, [isOpen, type, fetchFullStats]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-[24px] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                {/* ─── MODAL HEADER ─── */}
                <div className="px-4 md:px-6 py-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0 bg-white">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-[12px] text-white shadow-md ${type === 'top' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                            <Icon name={type === 'top' ? 'trendingUp' : 'trendingDown'} className="w-6 h-6" size={24} />
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
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-slate-400">
                        <Icon name="close" className="w-6 h-6" size={24} />
                    </button>
                </div>

                {/* ─── TABLE CONTENT ─── */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar bg-slate-50/30">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24">
                            <div className="w-12 h-12 border-4 border-slate-100 border-t-orange-500 rounded-full animate-spin mb-4"></div>
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Đang tải bảng xếp hạng...</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-[20px] shadow-sm border border-slate-100 overflow-hidden">
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
                                            <td className={`py-3 px-1 md:py-4 md:px-3 md:px-6 text-right font-bold text-slate-500 text-sm`}>{formatPrice(item.total_sales)}đ</td>
                                        </tr>
                                    ))}
                                    {data.length === 0 && (
                                        <tr>
                                            <td colSpan="3" className="py-24 text-center">
                                                <p className="text-sm font-black text-slate-300 uppercase tracking-widest">Không tìm thấy dữ liệu</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* ─── MODAL FOOTER ─── */}
                <div className="p-6 bg-white border-t border-gray-100 flex justify-end">
                    <button onClick={onClose} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95">
                        Hoàn tất
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ItemStatsModal;
