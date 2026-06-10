import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import axios from 'axios';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { useAppSelector } from '../../store/hooks';
import { ROLES } from '../../shared/constants/roles';
import { formatPrice } from '../../shared/utils/formatCurrency';
import orderExportApi from '../../services/orderExportApi';
import Icon from '../../components/shared/Icon';
import AdminPeriodSelector from '../../components/admin/shared/AdminPeriodSelector';
import AdminDateFilters from '../../components/admin/shared/AdminDateFilters';

/**
 * OrderExportPage
 * [WHY] Dedicated page for Admin/Accountant to filter, preview, and export order data.
 * [RULE] Only Admin and Accountant roles can access this page.
 * [RULE] Export uses native browser download — supports large datasets without memory issues.
 */

const formatDatetime = (str) => {
    if (!str) return '—';
    try {
        return new Date(str).toLocaleString('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    } catch {
        return str;
    }
};

const PERIODS = [
    { id: 'day', label: 'Ngày' },
    { id: 'week', label: 'Tuần' },
    { id: 'month', label: 'Tháng' },
    { id: 'year', label: 'Năm' },
];

// ── Main Component ─────────────────────────────────────────────────────────────

export default function OrderExportPage() {
    const user = useAppSelector(state => state.auth.user);

    // ── State ──────────────────────────────────────────────────────────────────
    // Period selector (mirrors Financial Management pattern)
    const [period, setPeriod] = useState('day');
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [fetched, setFetched] = useState(false);
    const [error, setError] = useState(null);

    // ── Period helpers ─────────────────────────────────────────────────────────
    const getWeekRange = useCallback((date) => ({
        start: format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
        end: format(endOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
    }), []);

    // Compute date_from / date_to from the current period selection
    const dateRange = useMemo(() => {
        const d = new Date(selectedDate);
        switch (period) {
            case 'week':
                return {
                    date_from: startDate || format(startOfWeek(d, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
                    date_to: endDate || format(endOfWeek(d, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
                };
            case 'month':
                return { date_from: format(startOfMonth(d), 'yyyy-MM-dd'), date_to: format(endOfMonth(d), 'yyyy-MM-dd') };
            case 'year':
                return { date_from: format(startOfYear(d), 'yyyy-MM-dd'), date_to: format(endOfYear(d), 'yyyy-MM-dd') };
            default:
                return { date_from: selectedDate, date_to: selectedDate };
        }
    }, [period, selectedDate, startDate, endDate]);

    const handlePeriodChange = (newPeriod) => {
        setPeriod(newPeriod);
        const now = new Date();
        setSelectedDate(format(now, 'yyyy-MM-dd'));
        if (newPeriod === 'week') {
            const r = getWeekRange(now);
            setStartDate(r.start);
            setEndDate(r.end);
        } else {
            setStartDate('');
            setEndDate('');
        }
    };


    // ── Query ──────────────────────────────────────────────────────────────────
    const handleResetFilters = useCallback(() => {
        setPeriod('day');
        setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
        setStartDate('');
        setEndDate('');
        setOrders([]);
        setFetched(false);
        setError(null);
    }, []);

    const handleFetch = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await orderExportApi.getOrders(dateRange);
            setOrders(res.data || []);
            setFetched(true);
        } catch (e) {
            setError('Không thể tải dữ liệu. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    }, [dateRange]);

    // Automatically load data on initial page load
    useEffect(() => {
        handleFetch();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Export ─────────────────────────────────────────────────────────────────
    const handleExport = useCallback(async () => {
        setExporting(true);
        setError(null);
        try {
            const url = orderExportApi.buildExportUrl(dateRange);
            const response = await axios.get(url, { responseType: 'blob' });

            const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv;charset=utf-8;' }));
            const a = document.createElement('a');
            a.href = blobUrl;

            // Extract filename from response headers or fall back to default
            const contentDisposition = response.headers['content-disposition'];
            let filename = `orders_export_${new Date().toISOString().slice(0, 10)}.csv`;
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
                if (filenameMatch && filenameMatch[1]) {
                    filename = filenameMatch[1];
                }
            }
            a.download = filename;

            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(blobUrl);
        } catch (err) {
            console.error(err);
            setError('Không thể xuất file. Vui lòng thử lại.');
        } finally {
            setExporting(false);
        }
    }, [dateRange]);

    // ── Derived: expand orders → per-item rows ─────────────────────────────────
    const rows = useMemo(() => {
        const result = [];
        let stt = 1;
        orders.forEach(order => {
            const items = order.items || [];
            const crossTotalQty = items.reduce((s, i) => s + (i.quantity || 0), 0);
            const crossTotalAmount = items.reduce((s, i) => s + ((i.price || 0) * (i.quantity || 0)), 0);
            const totalDue = Number(order.total_price || 0);
            const tableName = order.table?.name || order.merged_tables || '—';
            const cashierName = order.cashier?.name || 'Admin';

            const orderStt = stt++;

            if (items.length === 0) {
                result.push({
                    stt: orderStt,
                    order,
                    item: null,
                    crossTotalQty,
                    crossTotalAmount,
                    totalDue,
                    tableName,
                    cashierName,
                    isFirstItem: true
                });
                return;
            }
            items.forEach((item, itemIdx) => {
                result.push({
                    stt: orderStt,
                    order,
                    item,
                    crossTotalQty,
                    crossTotalAmount,
                    totalDue,
                    tableName,
                    cashierName,
                    isFirstItem: itemIdx === 0
                });
            });
        });
        return result;
    }, [orders]);

    const summary = useMemo(() => ({
        orderCount: orders.length,
        itemCount: rows.length,
        totalDue: orders.reduce((s, o) => s + Number(o.total_price || 0), 0),
    }), [orders, rows]);

    // Guard: only admin / accountant
    if (!user || (user.role !== ROLES.ADMIN && user.role !== ROLES.ACCOUNTANT)) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="bg-red-50 border border-red-100 rounded-2xl p-8 text-center max-w-sm">
                    <Icon name="close" size={32} className="text-red-400 mx-auto mb-3" />
                    <h3 className="font-black text-red-800 text-lg mb-2">Không có quyền truy cập</h3>
                    <p className="text-red-500 text-sm">Chỉ Admin và Kế toán mới có thể truy cập trang này.</p>
                </div>
            </div>
        );
    }

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col gap-6 pb-20">

            {/* ── Page Header ────────────────────────────────────────────────── */}
            <div className="bg-white border-b border-slate-100 p-4 lg:px-6 lg:py-4 sticky top-15 md:top-20 z-[10] -mx-4 lg:-mx-6">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <h5 className=" text-slate-900  tracking-tight">
                        Xuất Dữ Liệu Đơn Hàng
                    </h5>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleFetch}
                            disabled={loading}
                            id="btn-fetch-orders"
                            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-700 transition-colors disabled:opacity-50 cursor-pointer border-none"
                        >
                            <Icon name="search" size={14} />
                            {loading ? 'Đang tải...' : 'Xem Dữ Liệu'}
                        </button>
                        <button
                            onClick={handleExport}
                            disabled={exporting || !fetched}
                            id="btn-export-orders"
                            className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border-none"
                        >
                            <Icon name="download" size={14} />
                            {exporting ? 'Đang xuất...' : 'Xuất Excel'}
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Filters ────────────────────────────────────────────────────── */}
            <div className="bg-white rounded-[10px] border border-slate-100 p-5 md:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">

                <h6 className="text-slate-900 ">Khoảng thời gian</h6>

                {/* Period selector + Date picker + Reset button aligned nicely */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                    <div className="flex-1 lg:flex-none">
                        <AdminPeriodSelector
                            periods={PERIODS}
                            currentPeriod={period}
                            onPeriodChange={handlePeriodChange}
                        />
                    </div>
                    <div className="flex-1 lg:flex-none">
                        <AdminDateFilters
                            period={period}
                            selectedDate={selectedDate}
                            startDate={startDate}
                            endDate={endDate}
                            setSelectedDate={setSelectedDate}
                            setStartDate={setStartDate}
                            setEndDate={setEndDate}
                            getWeekRange={getWeekRange}
                        />
                    </div>
                    <button
                        onClick={handleResetFilters}
                        id="btn-reset-filters"
                        className="h-[42px] px-4 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer border-none"
                    >
                        Đặt lại
                    </button>
                </div>
            </div>


            {/* ── Error ──────────────────────────────────────────────────────── */}
            {error && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-600 font-medium flex items-center gap-2">
                    <Icon name="close" size={16} />
                    {error}
                </div>
            )}

            {/* ── Loading ────────────────────────────────────────────────────── */}
            {loading && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
                    <p className="text-sm text-slate-400 font-medium">Đang tải dữ liệu...</p>
                </div>
            )}

            {/* ── Data Table ─────────────────────────────────────────────────── */}
            {fetched && !loading && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                        {orders.length >= 200 && (
                            <span className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1 font-bold">
                                Xem trước: tối đa 200 đơn. Nhấn Xuất Excel để lấy toàn bộ.
                            </span>
                        )}
                    </div>

                    {rows.length === 0 ? (
                        <div className="py-16 flex flex-col items-center gap-3 text-slate-400">
                            <Icon name="inbox" size={40} />
                            <p className="text-sm font-medium">Không có dữ liệu trong khoảng thời gian đã chọn.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto overflow-y-auto">
                            <table className="w-full text-xs" id="order-export-table">
                                <thead>
                                    <tr className="bg-[#f3f4f6] text-[#111827] border-b border-[#e5e7eb]">
                                        {[
                                            'STT', 'No', 'Table', 'Arrival Time', 'Printed',
                                            'Cashier', 'Items', 'QTY', 'Total',
                                            'Cross Total QTY', 'Cross Total Amount', 'Total Due'
                                        ].map(h => (
                                            <th key={h} className="sticky top-0 z-10 px-3 py-3 text-left font-bold text-[#111827] bg-[#f3f4f6] border-b border-[#e5e7eb] tracking-wider whitespace-nowrap">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#e5e7eb]">
                                    {rows.map((row, idx) => {
                                        const { stt, order, item, crossTotalQty, crossTotalAmount, totalDue, tableName, cashierName } = row;
                                        const itemName = item?.name || item?.product?.name || '—';
                                        const qty = item?.quantity ?? 0;
                                        const itemTotal = (item?.price ?? 0) * qty;
                                        const isFirstItemInOrder = row.isFirstItem;

                                        // Soft Zebra stripe by order (STT)
                                        const rowBg = stt % 2 === 0 ? 'bg-[#f1f5f9]' : 'bg-white';

                                        return (
                                            <tr
                                                key={item ? `${order.id}-item-${item.id}` : `${order.id}-empty`}
                                                className={`transition-colors ${rowBg} hover:bg-[#eef6ff] ${isFirstItemInOrder ? 'border-t border-[#e5e7eb]' : ''}`}
                                            >
                                                {/* STT */}
                                                <td className="px-3 py-2.5 text-[#1f2937] font-semibold">{stt}</td>
                                                {/* No */}
                                                <td className="px-3 py-2.5">
                                                    {isFirstItemInOrder ? (
                                                        <span className="font-bold text-[#1f2937]">#{order.id}</span>
                                                    ) : (
                                                        <span className="text-[#4b5563]/50">↳</span>
                                                    )}
                                                </td>
                                                {/* Table */}
                                                <td className="px-3 py-2.5 font-medium text-[#4b5563] whitespace-nowrap">
                                                    {isFirstItemInOrder ? tableName : ''}
                                                </td>
                                                {/* Arrival */}
                                                <td className="px-3 py-2.5 text-[#4b5563] whitespace-nowrap">
                                                    {isFirstItemInOrder ? formatDatetime(order.created_at) : ''}
                                                </td>
                                                {/* Printed */}
                                                <td className="px-3 py-2.5 text-[#4b5563] whitespace-nowrap">
                                                    {isFirstItemInOrder ? formatDatetime(order.updated_at) : ''}
                                                </td>
                                                {/* Cashier */}
                                                <td className="px-3 py-2.5 text-[#4b5563] whitespace-nowrap">
                                                    {isFirstItemInOrder ? cashierName : ''}
                                                </td>
                                                {/* Item name */}
                                                <td className="px-3 py-2.5 text-[#1f2937] font-medium max-w-[160px] truncate">
                                                    {item ? itemName : <span className="text-[#4b5563]/40 italic">—</span>}
                                                </td>
                                                {/* QTY */}
                                                <td className="px-3 py-2.5 text-center text-[#4b5563]">
                                                    {item ? qty : ''}
                                                </td>
                                                {/* Line total */}
                                                <td className="px-3 py-2.5 text-right font-medium text-[#1f2937]">
                                                    {item ? formatPrice(itemTotal) : ''}
                                                </td>
                                                {/* Cross Total QTY */}
                                                <td className="px-3 py-2.5 text-center font-bold text-blue-600">
                                                    {isFirstItemInOrder ? crossTotalQty : ''}
                                                </td>
                                                {/* Cross Total Amount */}
                                                <td className="px-3 py-2.5 text-right font-bold text-blue-600">
                                                    {isFirstItemInOrder ? formatPrice(crossTotalAmount) : ''}
                                                </td>
                                                {/* Total Due */}
                                                <td className="px-3 py-2.5 text-right font-bold text-orange-600">
                                                    {isFirstItemInOrder ? formatPrice(totalDue) : ''}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ── Empty initial state ─────────────────────────────────────────── */}
            {!fetched && !loading && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 flex flex-col items-center gap-4">
                    <div className="text-center">

                        <p className="text-slate-800 ">
                            Chưa có Data
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
