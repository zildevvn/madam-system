import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getUserByIdApi } from '../../services/userService';
import { getLeaveRequestsApi, createLeaveRequestApi } from '../../services/leaveService';
import { formatLocalDate } from '../../shared/utils/formatLocalDate';
import Icon from '../../components/shared/Icon';

const EmployeeDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [leaves, setLeaves] = useState([]);
    const [lightboxImage, setLightboxImage] = useState(null);

    // Leave registration states
    const [showLeaveForm, setShowLeaveForm] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [leaveType, setLeaveType] = useState('paid');
    const [reason, setReason] = useState('');
    const [submittingLeave, setSubmittingLeave] = useState(false);

    const roles = [
        { value: 'admin', label: 'Quản trị viên (Admin)' },
        { value: 'manager', label: 'Quản lý (Manager)' },
        { value: 'order_staff', label: 'Nhân viên Order' },
        { value: 'kitchen', label: 'Bếp (Kitchen)' },
        { value: 'bar', label: 'Bar' },
        { value: 'cashier', label: 'Thu ngân (Cashier)' },
        { value: 'bill', label: 'Nhân viên đọc Bill' },
        { value: 'seller', label: 'Bán hàng (Seller)' }
    ];

    // Format currency to VND
    const formatCurrency = (val) => {
        if (!val && val !== 0) return 'Chưa cập nhật';
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
    };

    // Format Date
    const formatDate = (dateStr) => {
        if (!dateStr) return 'Chưa cập nhật';
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch (e) {
            return dateStr;
        }
    };

    // Get Role Label
    const getRoleLabel = (roleVal) => {
        const found = roles.find(r => r.value === roleVal);
        return found ? found.label : roleVal;
    };

    const fetchEmployeeData = async () => {
        try {
            const [userRes, leaveRes] = await Promise.all([
                getUserByIdApi(id),
                getLeaveRequestsApi(id)
            ]);
            setUser(userRes.data);
            setLeaves(leaveRes.data);
        } catch (err) {
            console.error('Failed to fetch employee details:', err);
            toast.error('Không thể tải thông tin chi tiết nhân viên');
            navigate('/admin/personnel');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployeeData();
        const today = formatLocalDate(new Date());
        setStartDate(today);
        setEndDate(today);
    }, [id, navigate]);

    const handleCreateLeave = async (e) => {
        e.preventDefault();

        if (new Date(startDate) > new Date(endDate)) {
            toast.error('Ngày bắt đầu không được lớn hơn ngày kết thúc');
            return;
        }

        setSubmittingLeave(true);
        try {
            await createLeaveRequestApi({
                user_id: id,
                start_date: startDate,
                end_date: endDate,
                leave_type: leaveType,
                reason: reason
            });

            toast.success('Đăng ký xin nghỉ thành công!');
            setShowLeaveForm(false);
            setReason('');
            fetchEmployeeData();
        } catch (err) {
            console.error('Failed to submit leave request:', err);
            toast.error('Có lỗi xảy ra khi gửi yêu cầu');
        } finally {
            setSubmittingLeave(false);
        }
    };

    const getLeaveTypeLabel = (type) => {
        switch (type) {
            case 'paid': return 'Có lương';
            case 'unpaid': return 'Không lương';
            case 'sick': return 'Nghỉ ốm';
            default: return 'Khác';
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'approved': return 'bg-emerald-50 text-emerald-600';
            case 'rejected': return 'bg-red-50 text-red-600';
            case 'pending_cancel': return 'bg-rose-50 text-rose-600';
            case 'approved_cancel': return 'bg-slate-100 text-slate-500';
            case 'rejected_cancel': return 'bg-orange-50 text-orange-600';
            default: return 'bg-amber-50 text-amber-600';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'approved': return 'Đã duyệt';
            case 'rejected': return 'Từ chối';
            case 'pending_cancel': return 'Chờ duyệt hủy';
            case 'approved_cancel': return 'Đã hủy Off';
            case 'rejected_cancel': return 'Từ chối hủy';
            default: return 'Chờ duyệt';
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] py-20 bg-white rounded-[32px] border border-gray-100 shadow-sm animate-pulse">
                <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-orange-500 animate-spin mb-4"></div>
                <p className="text-slate-400 font-bold text-xs tracking-widest uppercase">Đang tải thông tin hồ sơ...</p>
            </div>
        );
    }

    if (!user) return null;

    // Mock timeline logs
    const mockActivities = [
        {
            id: 1,
            time: 'Hôm nay, 08:30 AM',
            icon: (
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center flex-shrink-0">
                    <Icon name="checkCircle" className="w-4 h-4" size={16} strokeWidth={2.5} />
                </div>
            ),
            title: 'Bắt đầu ca làm việc',
            desc: `Đăng nhập hệ thống và điểm danh ca làm việc: "${user.work_shift || 'Ca làm việc'}".`
        },
        {
            id: 2,
            time: 'Hôm qua, 05:45 PM',
            icon: (
                <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center flex-shrink-0">
                    <Icon name="clock" className="w-4 h-4" size={16} strokeWidth={2.5} />
                </div>
            ),
            title: 'Hoàn thành ca làm việc',
            desc: 'Kết thúc phiên làm việc và bàn giao số liệu.'
        },
        {
            id: 3,
            time: formatDate(user.join_date),
            icon: (
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center flex-shrink-0">
                    <Icon name="clipboard" className="w-4 h-4" size={16} strokeWidth={2.5} />
                </div>
            ),
            title: 'Ký kết hợp đồng lao động',
            desc: `Tạo tài khoản nhân viên, thiết lập vai trò: "${getRoleLabel(user.role)}" và đăng tải văn bản đính kèm.`
        }
    ];

    return (
        <div className="space-y-6">

            {/* Navigation & Breadcrumbs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-400">
                    <Link to="/admin" className="hover:text-orange-500 transition-colors">Admin</Link>
                    <span>/</span>
                    <Link to="/admin/personnel" className="hover:text-orange-500 transition-colors">Nhân sự</Link>
                    <span>/</span>
                    <span className="text-slate-900">Chi tiết nhân sự</span>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/admin/personnel')}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-slate-200 transition-all border-none cursor-pointer animate-none shadow-none"
                    >
                        <Icon name="arrowLeft" className="w-4 h-4" size={16} strokeWidth={2.5} />
                        <span>Quay lại</span>
                    </button>
                    <button
                        onClick={() => navigate(`/admin/personnel/edit/${user.id}`)}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-orange-600 transition-all shadow-md active:scale-95 border-none cursor-pointer"
                    >
                        <Icon name="pencil" className="w-4 h-4" size={16} strokeWidth={2.5} />
                        <span>Chỉnh sửa hồ sơ</span>
                    </button>
                </div>
            </div>

            {/* Profile Detail Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Side Column Left */}
                <div className="lg:col-span-1 space-y-6">

                    {/* User Card */}
                    <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 flex flex-col items-center text-center relative overflow-hidden">
                        <div className="absolute top-4 right-4">
                            {user.status === 'active' ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-600 text-[10px] font-black uppercase tracking-wider">
                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                    Đang làm việc
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-600 text-[10px] font-black uppercase tracking-wider">
                                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                                    Đã nghỉ việc
                                </span>
                            )}
                        </div>

                        <div className="mt-6 w-28 h-28 rounded-full border-4 border-slate-50 bg-slate-100 shadow-inner flex items-center justify-center overflow-hidden flex-shrink-0">
                            {user.photo ? (
                                <img src={`/storage/${user.photo}`} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-slate-300 flex items-center justify-center text-5xl font-black uppercase">
                                    {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                </div>
                            )}
                        </div>

                        <h4 className="text-slate-900 mt-4 uppercase tracking-tight truncate max-w-full">
                            {user.name}
                        </h4>
                        <span className="text-[10px] px-3 py-1 rounded-full bg-orange-100 text-orange-600 font-bold uppercase tracking-wider mt-1">
                            {getRoleLabel(user.role)}
                        </span>

                        <div className="w-full border-t border-slate-100 mt-6 pt-6 space-y-4 text-left">
                            <div>
                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest block">Email liên hệ</span>
                                <span className="text-sm font-black text-slate-700 break-all">{user.email || 'Chưa cập nhật'}</span>
                            </div>
                            <div>
                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest block">Số điện thoại</span>
                                <span className="text-sm font-black text-slate-700">{user.phone || 'Chưa cập nhật'}</span>
                            </div>
                            <div>
                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest block">ID Tài khoản</span>
                                <span className="text-xs text-slate-400 font-bold">#0{user.id}</span>
                            </div>
                        </div>
                    </div>

                    {/* Legal Documents */}
                    <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 space-y-4">
                        <h6 className="text-slate-400 uppercase tracking-widest pb-2">
                            Hồ sơ tài liệu cá nhân
                        </h6>

                        <div className="space-y-4">
                            <div>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">Ảnh CMND / CCCD</span>
                                {user.id_card_image ? (
                                    <div
                                        onClick={() => setLightboxImage(`/storage/${user.id_card_image}`)}
                                        className="h-32 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 cursor-zoom-in hover:brightness-95 transition-all relative flex items-center justify-center group"
                                    >
                                        <img src={`/storage/${user.id_card_image}`} alt="ID Card" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Icon name="eye" className="w-6 h-6 text-white" size={24} strokeWidth={2} />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-32 rounded-xl border border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-slate-400 text-center p-2">
                                        <Icon name="image" className="w-6 h-6" size={24} strokeWidth={2} />
                                        <span className="text-[9px] font-bold uppercase tracking-wider mt-1 block">Chưa đính kèm</span>
                                    </div>
                                )}
                            </div>

                            <div>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">Hợp đồng lao động</span>
                                {user.contract_image ? (
                                    <div
                                        onClick={() => setLightboxImage(`/storage/${user.contract_image}`)}
                                        className="h-32 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 cursor-zoom-in hover:brightness-95 transition-all relative flex items-center justify-center group"
                                    >
                                        <img src={`/storage/${user.contract_image}`} alt="Contract" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Icon name="eye" className="w-6 h-6 text-white" size={24} strokeWidth={2} />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-32 rounded-xl border border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-slate-400 text-center p-2">
                                        <Icon name="image" className="w-6 h-6" size={24} strokeWidth={2} />
                                        <span className="text-[9px] font-bold uppercase tracking-wider mt-1 block">Chưa đính kèm</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Column Center & Right */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Details Card */}
                    <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 space-y-6">
                        <div className="space-y-4">
                            <h6 className="uppercase tracking-[0.01em] pb-2 border-b border-slate-300">
                                Thông tin
                            </h6>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Ngày sinh</span>
                                    <span className="text-[14px] font-black text-slate-800 mt-0.5 block">{formatDate(user.date_of_birth)}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Địa chỉ thường trú</span>
                                    <span className="text-[14px] font-black text-slate-800 mt-0.5 block">{user.address || 'Chưa cập nhật'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-slate-50">
                            <h6 className="uppercase tracking-[0.01em] pb-2 border-b border-slate-300">
                                Chế độ lương thưởng
                            </h6>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Ca làm việc</span>
                                    <span className="text-[14px] font-black text-slate-800 mt-0.5 block">{user.work_shift || 'Chưa cập nhật'}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Ngày bắt đầu làm</span>
                                    <span className="text-[14px] font-black text-slate-800 mt-0.5 block">{formatDate(user.join_date)}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Mức lương cơ bản</span>
                                    <span className="text-[14px] font-black text-slate-900 mt-0.5 block">{formatCurrency(user.salary)}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Thưởng cố định</span>
                                    <span className="text-[14px] font-black text-green-600 mt-0.5 block">{formatCurrency(user.bonus)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section: Leave Requests (Xin Nghỉ phép) */}
                    <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 space-y-4">
                        <div className="flex items-center justify-between gap-4 pb-2 border-b border-slate-50">
                            <h6 className="uppercase tracking-[0.01em] pb-2 border-b border-slate-300">
                                Đăng ký & Lịch sử nghỉ phép
                            </h6>

                            <button
                                onClick={() => setShowLeaveForm(!showLeaveForm)}
                                className="px-3 py-1.5 bg-orange-50 text-orange-600 hover:bg-orange-500 hover:text-white rounded-lg font-black text-[9px] uppercase tracking-wider transition-all border-none cursor-pointer"
                            >
                                {showLeaveForm ? 'Đóng' : 'Đăng ký nghỉ'}
                            </button>
                        </div>

                        {/* Leave Register Form */}
                        {showLeaveForm && (
                            <form onSubmit={handleCreateLeave} className="p-4 rounded-2xl bg-orange-50/30 border border-orange-100/50 space-y-3 animate-in slide-in-from-top-2 duration-200">
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">Thời gian nghỉ</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                className="text-xs w-full bg-white border-none rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-orange-500/10 font-bold"
                                            />
                                            <span className="text-slate-400 text-xs font-bold">đến</span>
                                            <input
                                                type="date"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                                className="text-xs w-full bg-white border-none rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-orange-500/10 font-bold"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">Lý do xin nghỉ</label>
                                    <input
                                        type="text"
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        placeholder="Vd: Giải quyết việc gia đình..."
                                        className="text-xs w-full bg-white border-none rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-orange-500/10 placeholder:text-slate-300"
                                    />
                                </div>
                                <div className="flex justify-end pt-1">
                                    <button
                                        type="submit"
                                        disabled={submittingLeave}
                                        className="px-4 py-2 bg-orange-500 text-white rounded-lg font-black text-[9px] uppercase tracking-wider hover:bg-orange-600 transition-all border-none cursor-pointer"
                                    >
                                        {submittingLeave ? 'Đang gửi...' : 'Gửi đơn đăng ký'}
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Leaves list */}
                        {leaves.length > 0 ? (
                            <div className="space-y-3">
                                {leaves.map((leave) => {
                                    const totalDays = Math.ceil(Math.abs(new Date(leave.end_date) - new Date(leave.start_date)) / (1000 * 60 * 60 * 24)) + 1;

                                    // Custom colors & styles based on status
                                    let statusBgColor = 'bg-amber-50/30 border-amber-100 hover:border-amber-200';
                                    let statusBorderLeft = 'border-l-4 border-l-amber-500';
                                    let badgeStyle = 'bg-amber-100 text-amber-800 border-amber-200/50';
                                    let statusIcon = (
                                        <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0 shadow-sm shadow-amber-500/10">
                                            <Icon name="clock" className="w-4 h-4 animate-pulse" size={16} strokeWidth={2.5} />
                                        </div>
                                    );

                                    if (leave.status === 'approved') {
                                        statusBgColor = 'bg-emerald-50/20 border-emerald-100 hover:border-emerald-200';
                                        statusBorderLeft = 'border-l-4 border-l-emerald-500';
                                        badgeStyle = 'bg-emerald-100 text-emerald-800 border-emerald-200/50';
                                        statusIcon = (
                                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 shadow-sm shadow-emerald-500/10">
                                                <Icon name="check" className="w-4 h-4" size={16} strokeWidth={2.5} />
                                            </div>
                                        );
                                    } else if (leave.status === 'rejected') {
                                        statusBgColor = 'bg-red-50/20 border-red-100 hover:border-red-200';
                                        statusBorderLeft = 'border-l-4 border-l-red-500';
                                        badgeStyle = 'bg-red-100 text-red-800 border-red-200/50';
                                        statusIcon = (
                                            <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0 shadow-sm shadow-red-500/10">
                                                <Icon name="close" className="w-4 h-4" size={16} strokeWidth={2.5} />
                                            </div>
                                        );
                                    } else if (leave.status === 'pending_cancel') {
                                        statusBgColor = 'bg-rose-50/30 border-rose-100 hover:border-rose-200';
                                        statusBorderLeft = 'border-l-4 border-l-rose-450';
                                        badgeStyle = 'bg-rose-100 text-rose-800 border-rose-200/50';
                                        statusIcon = (
                                            <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0 shadow-sm shadow-rose-500/10">
                                                <Icon name="clock" className="w-4 h-4 animate-pulse" size={16} strokeWidth={2.5} />
                                            </div>
                                        );
                                    } else if (leave.status === 'approved_cancel') {
                                        statusBgColor = 'bg-slate-50 border-slate-200 hover:border-slate-300';
                                        statusBorderLeft = 'border-l-4 border-l-slate-400';
                                        badgeStyle = 'bg-slate-100 text-slate-500 border-slate-200/50';
                                        statusIcon = (
                                            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                                                <Icon name="check" className="w-4 h-4" size={16} strokeWidth={2.5} />
                                            </div>
                                        );
                                    } else if (leave.status === 'rejected_cancel') {
                                        statusBgColor = 'bg-orange-50/20 border-orange-100 hover:border-orange-200';
                                        statusBorderLeft = 'border-l-4 border-l-orange-500';
                                        badgeStyle = 'bg-orange-100 text-orange-800 border-orange-200/50';
                                        statusIcon = (
                                            <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0 shadow-sm shadow-orange-500/10">
                                                <Icon name="close" className="w-4 h-4" size={16} strokeWidth={2.5} />
                                            </div>
                                        );
                                    }

                                    return (
                                        <div
                                            key={leave.id}
                                            className={`p-4 rounded-2xl border transition-all ${statusBgColor} ${statusBorderLeft} flex items-start sm:items-center justify-between gap-4 hover:shadow-md hover:shadow-slate-500/5`}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                {statusIcon}
                                                <div className="space-y-0.5 min-w-0">
                                                    <div className="flex flex-wrap items-center gap-1.5">
                                                        <span className="text-xs font-black text-slate-800 tracking-tight">
                                                            {formatDateStr(leave.start_date)} - {formatDateStr(leave.end_date)}
                                                        </span>
                                                        <span className="text-[10px] text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200/50">
                                                            {totalDays} ngày
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-600 font-medium truncate max-w-[200px] sm:max-w-xs" title={leave.reason}>
                                                        Lý do: <span className="text-slate-500 italic">{leave.reason || 'Không ghi lý do'}</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end flex-shrink-0 text-right">
                                                <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${badgeStyle}`}>
                                                    {getStatusText(leave.status)}
                                                </span>
                                                {leave.status !== 'pending' && leave.approver && (
                                                    <span className="text-[8px] text-slate-400 font-bold mt-1.5 flex items-center gap-1">
                                                        <Icon name="shield" className="w-2.5 h-2.5" size={10} strokeWidth={2.5} />
                                                        {leave.approver.name}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-xs text-slate-400 italic text-center py-4">Chưa có yêu cầu nghỉ phép nào từ nhân sự này</p>
                        )}
                    </div>
                </div>

            </div>

            {/* Lightbox */}
            {lightboxImage && (
                <div
                     onClick={() => setLightboxImage(null)}
                     className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-200"
                >
                    <div className="max-w-4xl max-h-[90vh] relative">
                        <img src={lightboxImage} alt="Zoomed Document" className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" />
                        <button
                            onClick={() => setLightboxImage(null)}
                            className="absolute top-4 right-4 bg-black/50 hover:bg-black/75 text-white w-10 h-10 rounded-full flex items-center justify-center transition-colors border-none cursor-pointer flex items-center justify-center"
                        >
                            <Icon name="close" className="w-6 h-6" size={24} strokeWidth={2.5} />
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
};

const formatDateStr = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export default EmployeeDetailPage;
