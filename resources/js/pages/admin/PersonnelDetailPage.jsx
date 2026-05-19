import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useUserManagement } from '../../hooks/useUserManagement';
import { getRoleStyle } from '../../components/admin/UserManagement';
import { getDayOffsApi, storeDayOffApi, deleteDayOffApi } from '../../services/userService';

const getAvatarGradient = (name) => {
    const hash = (name || 'Staff').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const gradients = [
        'from-purple-500 to-indigo-500 shadow-purple-500/20',
        'from-blue-500 to-sky-500 shadow-blue-500/20',
        'from-emerald-500 to-teal-500 shadow-emerald-500/20',
        'from-orange-500 to-amber-500 shadow-orange-500/20',
        'from-rose-500 to-pink-500 shadow-rose-500/20',
        'from-violet-500 to-fuchsia-500 shadow-violet-500/20',
        'from-sky-500 to-blue-600 shadow-sky-500/20',
        'from-red-500 to-rose-500 shadow-red-500/20'
    ];
    return gradients[hash % gradients.length];
};

const formatCurrency = (value) => {
    if (value === undefined || value === null || isNaN(value)) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

const formatDate = (dateString) => {
    if (!dateString) return 'Chưa cập nhật';
    try {
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return dateString;
        return d.toLocaleDateString('vi-VN');
    } catch {
        return dateString;
    }
};

const getShiftLabel = (shift) => {
    switch (shift) {
        case 'Morning Shift':
            return { name: 'Ca Sáng', time: '06:00 - 14:00', color: 'amber' };
        case 'Afternoon Shift':
            return { name: 'Ca Chiều', time: '14:00 - 22:00', color: 'sky' };
        case 'Night Shift':
            return { name: 'Ca Tối', time: '22:00 - 06:00', color: 'indigo' };
        case 'Full-time':
            return { name: 'Full-time', time: '08:00 - 17:00', color: 'emerald' };
        default:
            return { name: shift || 'Chưa xếp ca', time: '', color: 'slate' };
    }
};

const PersonnelDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { users, loading, processing, error, deleteUser } = useUserManagement();
    
    // Day Off State
    const [dayOffs, setDayOffs] = useState([]);
    const [dayOffLoading, setDayOffLoading] = useState(false);
    const [dayOffFormDate, setDayOffFormDate] = useState('');
    const [dayOffFormReason, setDayOffFormReason] = useState('');
    const [dayOffSubmitting, setDayOffSubmitting] = useState(false);

    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
    const [zoomedImage, setZoomedImage] = useState(null);

    // Find the user
    const user = useMemo(() => {
        return users.find(u => u.id === parseInt(id));
    }, [users, id]);

    // Fetch Day Offs for User
    const fetchDayOffs = async () => {
        if (!user) return;
        try {
            setDayOffLoading(true);
            const res = await getDayOffsApi(user.id);
            setDayOffs(res.data || []);
        } catch (err) {
            console.error('Failed to fetch day offs:', err);
        } finally {
            setDayOffLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchDayOffs();
        }
    }, [user]);

    const handleRegisterDayOff = async (e) => {
        e.preventDefault();
        if (!dayOffFormDate) {
            toast.error('Vui lòng chọn ngày nghỉ');
            return;
        }

        try {
            setDayOffSubmitting(true);
            await storeDayOffApi(user.id, {
                off_date: dayOffFormDate,
                reason: dayOffFormReason
            });
            toast.success('Đăng ký ngày nghỉ phép thành công.');
            setDayOffFormDate('');
            setDayOffFormReason('');
            fetchDayOffs();
        } catch (err) {
            console.error('Failed to store day off:', err);
            const msg = err.response?.data?.message || 'Không thể đăng ký ngày nghỉ';
            toast.error(msg);
        } finally {
            setDayOffSubmitting(false);
        }
    };

    const handleDeleteDayOff = async (dayOffId) => {
        try {
            await deleteDayOffApi(dayOffId);
            toast.success('Đã hủy đăng ký ngày nghỉ');
            fetchDayOffs();
        } catch (err) {
            console.error('Failed to delete day off:', err);
            toast.error('Không thể hủy ngày nghỉ');
        }
    };

    const handleDeleteClick = () => {
        setIsConfirmDeleteOpen(true);
    };

    const confirmDelete = async () => {
        if (!user) return;
        const success = await deleteUser(user.id, true); // skip native window.confirm
        if (success) {
            setIsConfirmDeleteOpen(false);
            navigate('/admin/personnel');
        }
    };

    if (loading && !user) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[40px] border border-slate-100 shadow-sm animate-pulse">
                <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-orange-500 animate-spin mb-4"></div>
                <p className="text-slate-400 font-bold text-[11px] tracking-widest uppercase">Đang tải chi tiết nhân sự...</p>
            </div>
        );
    }

    if (!user && !loading) {
        return (
            <div className="py-20 flex flex-col items-center justify-center bg-white rounded-[32px] border border-slate-100 shadow-sm text-center">
                <h3 className="text-base font-black text-slate-850 uppercase tracking-wider">Không tìm thấy tài khoản nhân sự</h3>
                <Link to="/admin/personnel" className="mt-4 mdt-btn">Quay lại danh sách</Link>
            </div>
        );
    }

    const roleStyle = getRoleStyle(user.role);
    const shiftInfo = getShiftLabel(user.work_shift);
    const totalEarnings = (parseFloat(user.salary) || 0) + (parseFloat(user.bonus) || 0);

    return (
        <div className="space-y-6 lg:space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-16 font-sans">
            
            {/* Header & Back Link */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link
                        to="/admin/personnel"
                        className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200/60 rounded-xl text-slate-500 hover:text-slate-850 hover:shadow-md transition-all active:scale-95 cursor-pointer"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                        </svg>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black text-slate-850 tracking-tight leading-none uppercase">Hồ sơ Nhân sự</h1>
                        <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">
                            Xem hồ sơ, lịch trình ca làm, mức lương & đãi ngộ, và chứng từ lao động pháp lý.
                        </p>
                    </div>
                </div>

                {/* Edit & Delete Quick Controls */}
                <div className="flex items-center gap-3">
                    <Link
                        to={`/admin/personnel/edit/${user.id}`}
                        className="flex-1 sm:flex-initial px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black text-[11px] uppercase tracking-wider cursor-pointer active:scale-95 transition-all shadow-sm text-center"
                    >
                        Chỉnh sửa
                    </Link>
                    <button
                        onClick={handleDeleteClick}
                        className="flex-1 sm:flex-initial px-5 py-2.5 bg-red-50 text-red-655 hover:bg-red-100 rounded-xl font-black text-[11px] uppercase tracking-wider cursor-pointer active:scale-95 transition-all shadow-sm text-center border border-red-200/50"
                    >
                        Xóa tài khoản
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-5 rounded-3xl text-[11px] font-black uppercase tracking-widest border border-red-100 flex items-center gap-4 animate-in shake duration-500">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>{error}</span>
                </div>
            )}

            {/* Desktop Two-Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                
                {/* ─── LEFT COLUMN: PROFILE HERO CARD & PERSONAL DETAILS ─── */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-6 flex flex-col items-center text-center relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl"></div>

                        {/* Large Gradient Initial Avatar */}
                        <div className={`w-24 h-24 rounded-[32px] bg-gradient-to-tr ${getAvatarGradient(user.name)} text-white flex items-center justify-center text-3xl font-black uppercase shadow-xl mb-6 relative group-hover:scale-105 group-hover:rotate-3 transition-all duration-300`}>
                            {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-4 border-white rounded-full shadow-md animate-in zoom-in duration-300"></span>
                        </div>

                        <h2 className="text-xl font-black text-slate-850 uppercase tracking-tight truncate max-w-full">{user.name}</h2>
                        <p className="text-xs text-slate-400 mt-1 font-medium select-all">{user.email || 'Chưa cung cấp email'}</p>

                        <div className="mt-4">
                            <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm ${roleStyle.bg} ${roleStyle.text}`}>
                                {roleStyle.icon}
                                <span>{roleStyle.label}</span>
                            </span>
                        </div>

                        {/* System Account Info */}
                        <div className="w-full border-t border-slate-100 mt-6 pt-6 space-y-4 text-left">
                            <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-wider pb-1">Tài khoản Đăng nhập</h4>
                            
                            <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-xs">
                                <div>
                                    <p className="text-slate-400 font-bold uppercase text-[9px]">ID nhân viên</p>
                                    <p className="text-slate-850 font-black mt-1 uppercase tracking-tight">EMP-0{user.id}</p>
                                </div>
                                <div>
                                    <p className="text-slate-400 font-bold uppercase text-[9px]">Mật khẩu lưu</p>
                                    <p className="text-slate-800 font-black mt-1 font-mono tracking-wide select-all bg-slate-50 px-2.5 py-0.5 rounded border border-slate-100 inline-block">
                                        {user.plain_password || '••••••••'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-slate-400 font-bold uppercase text-[9px]">Trạng thái</p>
                                    <p className="text-emerald-600 font-bold mt-1 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                        Hoạt động
                                    </p>
                                </div>
                                <div>
                                    <p className="text-slate-400 font-bold uppercase text-[9px]">Ngày gia nhập</p>
                                    <p className="text-slate-800 font-bold mt-1">
                                        {formatDate(user.join_date)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* HR Personal Profile Card */}
                    <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-6 space-y-5">
                        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Hồ sơ cá nhân</h4>
                        
                        <div className="space-y-4 text-xs">
                            <div>
                                <p className="text-slate-400 font-bold uppercase text-[9px]">Ngày sinh</p>
                                <p className="text-slate-800 font-bold mt-1 text-sm">{formatDate(user.date_of_birth)}</p>
                            </div>
                            
                            <div>
                                <p className="text-slate-400 font-bold uppercase text-[9px]">Phân bổ ca trực</p>
                                <div className="mt-1 flex items-center gap-2">
                                    <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border ${
                                        shiftInfo.color === 'amber' ? 'border-amber-200 bg-amber-50 text-amber-700' :
                                        shiftInfo.color === 'sky' ? 'border-sky-200 bg-sky-50 text-sky-700' :
                                        shiftInfo.color === 'indigo' ? 'border-indigo-200 bg-indigo-50 text-indigo-700' :
                                        'border-emerald-200 bg-emerald-50 text-emerald-700'
                                    }`}>
                                        {shiftInfo.name}
                                    </span>
                                    {shiftInfo.time && (
                                        <span className="text-xs text-slate-500 font-semibold">{shiftInfo.time}</span>
                                    )}
                                </div>
                            </div>

                            <div>
                                <p className="text-slate-400 font-bold uppercase text-[9px]">Địa chỉ liên hệ</p>
                                <p className="text-slate-800 font-medium mt-1 leading-relaxed text-sm">
                                    {user.address || 'Chưa cập nhật địa chỉ'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ─── RIGHT COLUMN: SALARY, LEGAL CONTRACT, DAY OFF & TIMELINE ─── */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* Compensation & Financial Card */}
                    <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-6 space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Đãi ngộ & Tiền lương</h3>
                            <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-emerald-100">
                                Định kỳ hàng tháng
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 bg-slate-50/50 border border-slate-100/50 rounded-2xl">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Lương cơ bản</p>
                                <p className="text-xl font-black text-slate-850 mt-1">{formatCurrency(user.salary)}</p>
                            </div>
                            <div className="p-4 bg-slate-50/50 border border-slate-100/50 rounded-2xl">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Thưởng doanh số</p>
                                <p className="text-xl font-black text-slate-850 mt-1">{formatCurrency(user.bonus)}</p>
                            </div>
                            <div className="p-4 bg-orange-50/50 border border-orange-100/40 rounded-2xl">
                                <p className="text-[9px] font-black text-orange-600 uppercase tracking-wider">Tổng thu nhập</p>
                                <p className="text-xl font-black text-orange-700 mt-1">{formatCurrency(totalEarnings)}</p>
                            </div>
                        </div>
                    </div>

                    {/* ─── NEW REGISTER DAY OFF SECTION ─── */}
                    <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-6 space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 bg-orange-500 rounded-full"></span>
                                <h3 className="text-sm font-black text-slate-850 uppercase tracking-wider">Đăng ký ngày nghỉ</h3>
                            </div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Lịch trình vắng mặt</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Fast Register Form */}
                            <form onSubmit={handleRegisterDayOff} className="space-y-4">
                                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Đăng ký ngày nghỉ nhanh</h4>
                                
                                <div>
                                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Chọn ngày nghỉ *</label>
                                    <input
                                        type="date"
                                        value={dayOffFormDate}
                                        onChange={(e) => setDayOffFormDate(e.target.value)}
                                        className="text-sm w-full bg-slate-50 border border-slate-200/50 rounded-[14px] px-4 py-3 text-slate-800 font-bold focus:outline-none focus:bg-white focus:border-orange-500/30 focus:ring-4 focus:ring-orange-500/10 transition-all cursor-pointer"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Lý do nghỉ (Không bắt buộc)</label>
                                    <textarea
                                        rows="2"
                                        value={dayOffFormReason}
                                        onChange={(e) => setDayOffFormReason(e.target.value)}
                                        className="text-sm w-full bg-slate-50 border border-slate-200/50 rounded-[14px] px-4 py-3 text-slate-800 font-medium placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-orange-500/30 focus:ring-4 focus:ring-orange-500/10 transition-all resize-none"
                                        placeholder="Nhập lý do nghỉ phép, việc cá nhân..."
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={dayOffSubmitting}
                                    className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-[14px] font-black text-[10px] uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer border border-transparent shadow-sm"
                                >
                                    {dayOffSubmitting ? (
                                        <>
                                            <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                            <span>Đang xử lý...</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                                            </svg>
                                            <span>Đăng ký nghỉ</span>
                                        </>
                                    )}
                                </button>
                            </form>

                            {/* Registered History Log */}
                            <div className="space-y-4">
                                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest font-sans">Ngày nghỉ đã đăng ký ({dayOffs.length})</h4>
                                
                                {dayOffLoading ? (
                                    <div className="flex flex-col items-center justify-center py-6 text-slate-400">
                                        <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-500 rounded-full animate-spin mb-2"></div>
                                        <p className="text-[10px] uppercase font-bold tracking-wider">Đang tải danh sách...</p>
                                    </div>
                                ) : dayOffs.length === 0 ? (
                                    <div className="border border-dashed border-slate-200 rounded-[20px] p-6 text-center bg-slate-50/20 select-none flex flex-col items-center justify-center min-h-[170px]">
                                        <svg className="w-8 h-8 text-slate-350 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Chưa có ngày đăng ký nghỉ</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1">
                                        {dayOffs.map((day) => (
                                            <div
                                                key={day.id}
                                                className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between gap-3 group hover:bg-white hover:shadow-sm hover:border-slate-200/50 transition-all duration-300"
                                            >
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-xs font-black text-slate-800 tracking-tight">
                                                        {formatDate(day.off_date)}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 mt-1 leading-normal truncate max-w-[200px]" title={day.reason}>
                                                        {day.reason || 'Không ghi chú lý do'}
                                                    </span>
                                                </div>
                                                
                                                <button
                                                    onClick={() => handleDeleteDayOff(day.id)}
                                                    className="p-2 text-slate-450 hover:text-red-600 rounded-xl hover:bg-red-50 transition-colors focus:outline-none cursor-pointer flex-shrink-0"
                                                    title="Hủy đăng ký ngày nghỉ"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Legal Documents Grid */}
                    <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-6 space-y-4">
                        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Tài liệu hồ sơ đính kèm</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* ID Card Doc Card */}
                            <div className="border border-slate-100 rounded-[24px] p-4 flex flex-col items-center justify-center text-center bg-slate-50/20 min-h-[170px] relative overflow-hidden group">
                                {user.id_card_image ? (
                                    <div className="flex flex-col items-center justify-between w-full h-full gap-3 cursor-pointer" onClick={() => setZoomedImage(`/storage/${user.id_card_image}`)}>
                                        <div className="w-full h-24 overflow-hidden rounded-xl border border-slate-200/50 bg-white shadow-sm flex items-center justify-center relative">
                                            <img src={`/storage/${user.id_card_image}`} alt="ID Card scan" className="h-full w-auto object-contain transition-transform group-hover:scale-110 duration-300" />
                                            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-black uppercase tracking-wider gap-1">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                </svg>
                                                Xem tài liệu
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Ảnh CCCD/CMND bản gốc</span>
                                    </div>
                                ) : (
                                    <div className="space-y-2 py-4">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-300 mx-auto">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                            </svg>
                                        </div>
                                        <p className="text-xs font-bold text-slate-400">Không có ảnh CMND/CCCD</p>
                                    </div>
                                )}
                            </div>

                            {/* Contract Doc Card */}
                            <div className="border border-slate-100 rounded-[24px] p-4 flex flex-col items-center justify-center text-center bg-slate-50/20 min-h-[170px] relative overflow-hidden group">
                                {user.contract_image ? (
                                    <div className="flex flex-col items-center justify-between w-full h-full gap-3 cursor-pointer" onClick={() => setZoomedImage(`/storage/${user.contract_image}`)}>
                                        <div className="w-full h-24 overflow-hidden rounded-xl border border-slate-200/50 bg-white shadow-sm flex items-center justify-center relative">
                                            <img src={`/storage/${user.contract_image}`} alt="Contract scan" className="h-full w-auto object-contain transition-transform group-hover:scale-110 duration-300" />
                                            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-black uppercase tracking-wider gap-1">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                </svg>
                                                Xem hợp đồng
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Ảnh Hợp đồng Lao động</span>
                                    </div>
                                ) : (
                                    <div className="space-y-2 py-4">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-300 mx-auto">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <p className="text-xs font-bold text-slate-400">Không đính kèm hợp đồng</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Operational Timeline log */}
                    <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-6 space-y-6">
                        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Nhật ký vận hành chi tiết</h3>
                        
                        <div className="border-l-2 border-slate-100 pl-6 space-y-6 ml-2">
                            <div className="relative">
                                <div className="absolute -left-[31px] top-1.5 w-4 h-4 bg-orange-500 rounded-full border-4 border-white shadow-sm"></div>
                                <p className="text-sm text-slate-800 font-bold">Đặt bàn #12 phục vụ thành công</p>
                                <p className="text-xs text-slate-400 mt-1">10 phút trước • Phân khu A</p>
                            </div>
                            <div className="relative">
                                <div className="absolute -left-[31px] top-1.5 w-4 h-4 bg-blue-500 rounded-full border-4 border-white shadow-sm"></div>
                                <p className="text-sm text-slate-800 font-bold">Đăng nhập vào hệ thống (Thiết bị Tablet)</p>
                                <p className="text-xs text-slate-400 mt-1">2 giờ trước • IP: 192.168.1.45</p>
                            </div>
                            <div className="relative">
                                <div className="absolute -left-[31px] top-1.5 w-4 h-4 bg-slate-300 rounded-full border-4 border-white shadow-sm"></div>
                                <p className="text-sm text-slate-800 font-bold">Cập nhật trạng thái món ăn bàn #04</p>
                                <p className="text-xs text-slate-400 mt-1">Hôm qua • Đã chuyển sang chế biến xong</p>
                            </div>
                            <div className="relative">
                                <div className="absolute -left-[31px] top-1.5 w-4 h-4 bg-emerald-500 rounded-full border-4 border-white shadow-sm"></div>
                                <p className="text-sm text-slate-800 font-bold">Khởi tạo ca trực hệ thống</p>
                                <p className="text-xs text-slate-400 mt-1">Hôm qua • {shiftInfo.name} ({shiftInfo.time})</p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* ─── CUSTOM DELETE CONFIRMATION MODAL ─── */}
            {isConfirmDeleteOpen && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[28px] w-full max-w-md shadow-2xl p-6 text-center animate-in zoom-in-95 duration-300 border border-slate-100 flex flex-col items-center">
                        <div className="w-16 h-16 rounded-[22px] bg-red-50 text-red-500 flex items-center justify-center mb-4 border border-red-100 shadow-sm animate-bounce">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>

                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Xác nhận xóa nhân sự</h3>
                        <p className="text-sm text-slate-500 mt-3 leading-relaxed">
                            Bạn có chắc chắn muốn xóa tài khoản của nhân viên <strong className="text-slate-800 uppercase tracking-tight">"{user.name}"</strong>?
                        </p>
                        <div className="bg-red-50/50 p-4 rounded-2xl border border-red-100/50 text-[11px] text-red-600 font-bold uppercase tracking-wider text-center mt-4 w-full">
                            Lưu ý: Hành động này không thể hoàn tác và dữ liệu sẽ bị xóa hoàn toàn khỏi hệ thống.
                        </div>

                        <div className="flex gap-4 w-full mt-6">
                            <button
                                onClick={() => setIsConfirmDeleteOpen(false)}
                                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl font-black text-[11px] uppercase tracking-wider cursor-pointer active:scale-95 transition-all"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={processing}
                                className="flex-1 py-3 bg-red-500 hover:bg-red-650 text-white rounded-xl font-black text-[11px] uppercase tracking-wider cursor-pointer active:scale-95 transition-all shadow-lg shadow-red-500/20 disabled:opacity-50"
                            >
                                {processing ? 'Đang xóa...' : 'Xác nhận xóa'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── FULL DOCUMENT ZOOM LIGHTBOX MODAL ─── */}
            {zoomedImage && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200" onClick={() => setZoomedImage(null)}>
                    <button className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-all cursor-pointer">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <div className="max-w-4xl max-h-[85vh] overflow-hidden rounded-[24px] border border-white/10 bg-black/40 shadow-2xl flex items-center justify-center p-2 animate-in zoom-in-95 duration-250" onClick={(e) => e.stopPropagation()}>
                        <img src={zoomedImage} alt="Document Detail Zoom" className="max-w-full max-h-[80vh] object-contain rounded-xl select-none" />
                    </div>
                </div>
            )}

        </div>
    );
};

export default PersonnelDetailPage;
