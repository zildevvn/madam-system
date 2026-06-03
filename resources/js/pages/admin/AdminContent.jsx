import React from 'react';
import { useRevenueReport } from '../../hooks/useRevenueReport';
import AdminRevenueReport from '../../components/admin/AdminRevenueReport/AdminRevenueReport';
import AdminItemStats from '../../components/admin/AdminRevenueReport/AdminItemStats';
import AdminProfitReport from '../../components/admin/AdminRevenueReport/AdminProfitReport';
import AdminExpenses from '../../components/admin/AdminRevenueReport/AdminExpenses';
import AdminPeriodSelector from '../../components/admin/shared/AdminPeriodSelector';
import AdminDateFilters from '../../components/admin/shared/AdminDateFilters';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { updateSetting } from '../../store/slices/settingsSlice';
import toast from 'react-hot-toast';
import Icon from '../../components/shared/Icon';

/**
 * AdminContent Component
 * [WHY] Acts as the primary content container for administrative financial reports.
 * [RULE] Renders independent report modules (Revenue, Expenses, Profit) as siblings.
 * Now manages global filtering state to ensure consistency across all sections.
 */
const AdminContent = () => {
    const dispatch = useAppDispatch();
    const attendanceEnabled = useAppSelector(state => state.settings.settings.attendance_enabled);
    const settingsLoading = useAppSelector(state => state.settings.loading);

    const handleToggleAttendance = async () => {
        const newValue = attendanceEnabled === 'true' ? 'false' : 'true';
        try {
            await dispatch(updateSetting({ key: 'attendance_enabled', value: newValue })).unwrap();
            toast.success(`Hệ thống chấm công đã được ${newValue === 'true' ? 'BẬT' : 'TẮT'}`);
        } catch (err) {
            toast.error(err || 'Cập nhật cấu hình thất bại');
        }
    };

    const {
        period,
        selectedDate,
        startDate,
        endDate,
        stats,
        loading,
        periods,
        setSelectedDate,
        setStartDate,
        setEndDate,
        handlePeriodChange,
        getWeekRange
    } = useRevenueReport();

    return (
        <div className="admin-content flex flex-col gap-6 pb-20">
            {/* ─── HEADER: Exact Match to Design ─── */}
            <div className="bg-white border-b border-slate-100 p-4 lg:px-6 lg:py-4 sticky top-15 md:top-20 z-[10] -mx-4 lg:-mx-6">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    <div>
                        <h1 className="h3">Quản trị Tài chính</h1>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                        <div className="flex-1 lg:flex-none">
                            <AdminPeriodSelector
                                periods={periods}
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
                    </div>
                </div>
            </div>

            {/* ─── SYSTEM CONFIGURATION / ATTENDANCE TOGGLE ─── */}
            <div className="bg-white rounded-[32px] p-5 md:p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-[20px] flex items-center justify-center shrink-0 ${attendanceEnabled === 'true' ? 'bg-orange-50 text-orange-500' : 'bg-slate-50 text-slate-400'}`}>
                        <Icon name="clock" size={24} />
                    </div>
                    <div className="space-y-1">
                        <h5 className="text-slate-900 font-black uppercase text-xs tracking-wider">Hệ thống Điểm danh / Chấm công</h5>
                        <p className="text-slate-500 text-[11px] md:text-xs leading-relaxed max-w-2xl font-medium">
                            {attendanceEnabled === 'true'
                                ? "Hệ thống chấm công đang BẬT. Nhân viên order bắt buộc phải check-in để truy cập các tính năng bán hàng."
                                : "Hệ thống chấm công đang TẮT. Nhân viên có thể truy cập đầy đủ các chức năng mà không cần điểm danh."
                            }
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4 shrink-0 self-end md:self-auto">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-bold">Trạng thái hiện tại</span>
                        <span className={`text-xs font-black uppercase tracking-wider font-extrabold ${attendanceEnabled === 'true' ? 'text-emerald-500' : 'text-slate-400'}`}>
                            {attendanceEnabled === 'true' ? 'Đang hoạt động (ON)' : 'Tạm tắt (OFF)'}
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={handleToggleAttendance}
                        disabled={settingsLoading}
                        className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                            attendanceEnabled === 'true' ? 'bg-orange-500' : 'bg-slate-200'
                        }`}
                    >
                        <span className="sr-only">Toggle Attendance System</span>
                        <span
                            aria-hidden="true"
                            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                attendanceEnabled === 'true' ? 'translate-x-5' : 'translate-x-0'
                            }`}
                        />
                    </button>
                </div>
            </div>

            {/* ─── REVENUE SECTION ─── */}
            <div className="space-y-4">
                <div className="flex items-center gap-3 px-2">
                    <div className="w-1 h-6 mdt-bg-primary rounded-full" />
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-[0.01em]">Phân tích doanh thu</h4>
                </div>
                <AdminRevenueReport stats={stats} loading={loading} />
            </div>

            {/* ─── ITEM STATISTICS SECTION ─── */}
            <div className="space-y-4">
                <div className="flex items-center gap-3 px-2">
                    <div className="w-1 h-6 mdt-bg-primary rounded-full" />
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-[0.01em]">Hiệu suất sản phẩm</h4>
                </div>
                <AdminItemStats
                    stats={stats}
                    loading={loading}
                    filters={{ period, selectedDate, startDate, endDate }}
                />
            </div>

            {/* ─── EXPENSES SECTION ─── */}
            <div className="space-y-4">
                <div className="flex items-center gap-3 px-2">
                    <div className="w-1 h-6 mdt-bg-primary  rounded-full" />
                    <h4 className="tracking-[0.01em]">Chi phí vận hành</h4>
                </div>
                <AdminExpenses stats={stats} loading={loading} period={period} />
            </div>


            {/* ─── TOP OVERVIEW: Profit + Quick Stats ─── */}
            <div className="space-y-4">
                <div className="flex items-center gap-3 px-2">
                    <div className="w-1 h-6 mdt-bg-primary  rounded-full" />
                    <h4 className="tracking-[0.01em]">Tổng quan lợi nhuận</h4>
                </div>
                <AdminProfitReport stats={stats} loading={loading} />
            </div>
        </div>
    );
};

export default AdminContent;
