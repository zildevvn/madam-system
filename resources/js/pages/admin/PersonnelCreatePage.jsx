import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useUserManagement } from '../../hooks/useUserManagement';

const PersonnelCreatePage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { users, loading, processing, error, addUser, updateUser, roles } = useUserManagement();

    const isEditMode = !!id;

    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
        defaultValues: {
            name: '',
            email: '',
            password: '',
            role: 'order_staff',
            join_date: '',
            date_of_birth: '',
            work_shift: 'Morning Shift',
            salary: '',
            bonus: '',
            address: '',
            id_card_image: null,
            contract_image: null
        }
    });

    const [showPassword, setShowPassword] = useState(true);
    const activeRole = watch('role');
    const activeShift = watch('work_shift');

    // Previews for ID Card and Contract files
    const [idCardPreview, setIdCardPreview] = useState(null);
    const [contractPreview, setContractPreview] = useState(null);

    // Find user for editing
    const editingUser = isEditMode ? users.find(u => u.id === parseInt(id)) : null;

    useEffect(() => {
        if (isEditMode && editingUser) {
            setShowPassword(false); // Hide password by default in edit mode
            reset({
                name: editingUser.name || '',
                email: editingUser.email || '',
                password: '', // Keep blank by default in edit
                role: editingUser.role || 'order_staff',
                join_date: editingUser.join_date || '',
                date_of_birth: editingUser.date_of_birth || '',
                work_shift: editingUser.work_shift || 'Morning Shift',
                salary: editingUser.salary ? Math.round(editingUser.salary) : '',
                bonus: editingUser.bonus ? Math.round(editingUser.bonus) : '',
                address: editingUser.address || ''
            });

            // Set previews from existing images
            if (editingUser.id_card_image) {
                setIdCardPreview(`/storage/${editingUser.id_card_image}`);
            }
            if (editingUser.contract_image) {
                setContractPreview(`/storage/${editingUser.contract_image}`);
            }
        }
    }, [editingUser, isEditMode, reset]);

    const onFormSubmit = async (data) => {
        const payload = { ...data };

        // Remove password from payload if empty in edit mode
        if (isEditMode && !payload.password) {
            delete payload.password;
        }

        const success = isEditMode
            ? await updateUser(editingUser.id, payload)
            : await addUser(payload);

        if (success) {
            navigate('/admin/personnel');
        }
    };

    const handleGeneratePassword = () => {
        const letters = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
        const numbers = '23456789';
        let newPass = 'MD-';

        for (let i = 0; i < 4; i++) {
            newPass += letters.charAt(Math.floor(Math.random() * letters.length));
        }
        for (let i = 0; i < 2; i++) {
            newPass += numbers.charAt(Math.floor(Math.random() * numbers.length));
        }

        setValue('password', newPass);
        setShowPassword(true);

        navigator.clipboard.writeText(newPass)
            .then(() => {
                toast.success(`Đã tạo và sao chép mật khẩu: ${newPass}`, {
                    duration: 4000,
                    icon: '🔑'
                });
            })
            .catch(() => {
                toast.success(`Đã tạo mật khẩu ngẫu nhiên: ${newPass}`, {
                    duration: 3000
                });
            });
    };

    const handleFileChange = (e, type) => {
        const file = e.target.files?.[0];
        if (file) {
            const previewUrl = URL.createObjectURL(file);
            if (type === 'id_card') {
                setIdCardPreview(previewUrl);
                setValue('id_card_image', e.target.files);
            } else if (type === 'contract') {
                setContractPreview(previewUrl);
                setValue('contract_image', e.target.files);
            }
        }
    };


    // Shifts List
    const shiftCards = [
        { value: 'Morning Shift', label: 'Ca Sáng', time: '06:00 - 14:00', bg: 'border-amber-200/50 bg-amber-50/20 text-amber-700', active: 'border-amber-500 bg-amber-50 ring-4 ring-amber-500/10 text-amber-800' },
        { value: 'Afternoon Shift', label: 'Ca Chiều', time: '14:00 - 22:00', bg: 'border-sky-200/50 bg-sky-50/20 text-sky-700', active: 'border-sky-500 bg-sky-50 ring-4 ring-sky-500/10 text-sky-800' },
        { value: 'Night Shift', label: 'Ca Tối', time: '22:00 - 06:00', bg: 'border-indigo-200/50 bg-indigo-50/20 text-indigo-700', active: 'border-indigo-500 bg-indigo-50 ring-4 ring-indigo-500/10 text-indigo-800' },
        { value: 'Full-time', label: 'Full-time', time: '08:00 - 17:00', bg: 'border-emerald-200/50 bg-emerald-50/20 text-emerald-700', active: 'border-emerald-500 bg-emerald-50 ring-4 ring-emerald-500/10 text-emerald-800' }
    ];

    if (isEditMode && loading && !editingUser) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[40px] border border-slate-100 shadow-sm animate-pulse">
                <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-orange-500 animate-spin mb-4"></div>
                <p className="text-slate-400 font-bold text-[11px] tracking-widest uppercase">Đang tải thông tin nhân sự...</p>
            </div>
        );
    }

    if (isEditMode && !editingUser && !loading) {
        return (
            <div className="py-20 flex flex-col items-center justify-center bg-white rounded-[32px] border border-slate-100 shadow-sm text-center">
                <h3 className="text-base font-black text-slate-800 uppercase tracking-wider">Không tìm thấy tài khoản nhân sự</h3>
                <Link to="/admin/personnel" className="mt-4 mdt-btn">Quay lại danh sách</Link>
            </div>
        );
    }

    return (
        <div className="space-y-6 lg:space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 max-w-4xl mx-auto pb-24 font-sans">

            {/* Header & Back Action */}
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
                    <h1 className="text-2xl font-black text-slate-850 tracking-tight leading-none uppercase">
                        {isEditMode ? 'Chỉnh sửa nhân sự' : 'Thêm nhân sự mới'}
                    </h1>
                    <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">
                        Thiết lập tài khoản đăng nhập, thông tin ca trực, hồ sơ nhân sự, bảng lương và tài liệu hợp đồng đính kèm.
                    </p>
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

            <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6 lg:space-y-8" encType="multipart/form-data">

                {/* ─── SECTION 1: TÀI KHOẢN ĐĂNG NHẬP ─── */}
                <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-6 lg:p-8 space-y-6">
                    <div className="border-l-4 border-orange-500 pl-4">
                        <h3 className="text-sm font-black text-slate-850 uppercase tracking-wider">1. Tài khoản Đăng nhập</h3>
                        <p className="text-[11px] text-slate-400 mt-1">Thông tin định danh bắt buộc để nhân viên truy cập hệ thống.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Name */}
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Họ và Tên <span className="text-red-500">*</span></label>
                            <input
                                {...register('name', { required: true })}
                                type="text"
                                className={`text-sm w-full bg-slate-50 border border-slate-200/50 rounded-[16px] px-4 py-3.5 text-slate-800 font-medium placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-orange-500/30 focus:ring-4 focus:ring-orange-500/10 transition-all ${errors.name ? 'border-red-500 bg-red-50/20' : ''}`}
                                placeholder="Vd: Nguyễn Văn A"
                            />
                            {errors.name && <span className="text-[10px] text-red-500 mt-1.5 font-bold block">Họ và tên là bắt buộc</span>}
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Địa chỉ Email <span className="text-red-500">*</span></label>
                            <input
                                {...register('email', { required: true, pattern: /^\S+@\S+$/i })}
                                type="email"
                                className={`text-sm w-full bg-slate-50 border border-slate-200/50 rounded-[16px] px-4 py-3.5 text-slate-800 font-medium placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-orange-500/30 focus:ring-4 focus:ring-orange-500/10 transition-all ${errors.email ? 'border-red-500 bg-red-50/20' : ''}`}
                                placeholder="email@example.com"
                            />
                            {errors.email && <span className="text-[10px] text-red-500 mt-1.5 font-bold block">Email không đúng định dạng</span>}
                        </div>
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                            {isEditMode ? 'Mật khẩu mới (Bỏ trống nếu không đổi)' : 'Mật khẩu tài khoản *'}
                        </label>
                        <div className="flex gap-3">
                            <div className="relative flex-1">
                                <input
                                    {...register('password', { required: !isEditMode, minLength: 6 })}
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="off"
                                    className={`text-sm w-full bg-slate-50 border border-slate-200/50 rounded-[16px] pl-4 pr-12 py-3.5 text-slate-800 font-mono focus:outline-none focus:bg-white focus:border-orange-500/30 focus:ring-4 focus:ring-orange-500/10 transition-all ${errors.password ? 'border-red-500 bg-red-50/20' : ''}`}
                                    placeholder={isEditMode ? "Nhập mật khẩu mới nếu muốn thay đổi" : "Tối thiểu 6 ký tự"}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-650 transition-colors focus:outline-none cursor-pointer"
                                >
                                    {showPassword ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                                        </svg>
                                    )}
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={handleGeneratePassword}
                                className="px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-[16px] text-[10px] font-black uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5 cursor-pointer flex-shrink-0 active:scale-95"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span>Tạo tự động</span>
                            </button>
                        </div>
                        {errors.password && <span className="text-[10px] text-red-500 mt-1.5 font-bold block">Mật khẩu tối thiểu phải 6 ký tự</span>}
                    </div>
                    {/* Predefined Select Dropdown for Role / Position */}
                    <div className="space-y-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Vai trò chức vụ hệ thống <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.3" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <select
                                {...register('role', { required: true })}
                                className={`text-sm w-full bg-slate-50 border border-slate-200/50 rounded-[16px] pl-11 pr-10 py-3.5 text-slate-800 font-bold focus:outline-none focus:bg-white focus:border-orange-500/30 focus:ring-4 focus:ring-orange-500/10 transition-all appearance-none cursor-pointer ${errors.role ? 'border-red-500 bg-red-50/20' : ''}`}
                            >
                                <option value="" disabled>-- Lựa chọn vai trò / chức vụ --</option>
                                {roles.map(r => (
                                    <option key={r.value} value={r.value}>{r.label}</option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400">
                                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                        {errors.role && <span className="text-[10px] text-red-500 mt-1.5 font-bold block">Vai trò chức vụ là bắt buộc</span>}
                    </div>
                </div>

                {/* ─── SECTION 2: THÔNG TIN HỒ SƠ & VẬN HÀNH ─── */}
                <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-6 lg:p-8 space-y-6">
                    <div className="border-l-4 border-blue-500 pl-4">
                        <h3 className="text-sm font-black text-slate-850 uppercase tracking-wider">2. Thông tin Hồ sơ & Ca trực</h3>
                        <p className="text-[11px] text-slate-400 mt-1">Thông tin ngày sinh, ngày tham gia vận hành và phân bổ ca làm việc của nhân sự.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Date of Birth */}
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Ngày sinh <span className="text-red-500">*</span></label>
                            <input
                                {...register('date_of_birth', { required: true })}
                                type="date"
                                className={`text-sm w-full bg-slate-50 border border-slate-200/50 rounded-[16px] px-4 py-3.5 text-slate-800 font-medium focus:outline-none focus:bg-white focus:border-orange-500/30 focus:ring-4 focus:ring-orange-500/10 transition-all ${errors.date_of_birth ? 'border-red-500 bg-red-50/20' : ''}`}
                            />
                            {errors.date_of_birth && <span className="text-[10px] text-red-500 mt-1.5 font-bold block">Ngày sinh là bắt buộc</span>}
                        </div>

                        {/* Join Date */}
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Ngày vào làm <span className="text-red-500">*</span></label>
                            <input
                                {...register('join_date', { required: true })}
                                type="date"
                                className={`text-sm w-full bg-slate-50 border border-slate-200/50 rounded-[16px] px-4 py-3.5 text-slate-800 font-medium focus:outline-none focus:bg-white focus:border-orange-500/30 focus:ring-4 focus:ring-orange-500/10 transition-all ${errors.join_date ? 'border-red-500 bg-red-50/20' : ''}`}
                            />
                            {errors.join_date && <span className="text-[10px] text-red-500 mt-1.5 font-bold block">Ngày vào làm là bắt buộc</span>}
                        </div>
                    </div>

                    <input type="hidden" {...register('work_shift', { required: true })} />

                    {/* Shift Cards Grid */}
                    <div className="space-y-3">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Ca làm việc được phân bổ <span className="text-red-500">*</span></label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {shiftCards.map((shift) => {
                                const isSelected = activeShift === shift.value;
                                return (
                                    <div
                                        key={shift.value}
                                        onClick={() => setValue('work_shift', shift.value)}
                                        className={`p-4 rounded-2xl border text-center cursor-pointer transition-all duration-300 select-none ${isSelected ? shift.active : `bg-white border-slate-200/60 hover:bg-slate-50`
                                            }`}
                                    >
                                        <p className="text-sm font-black uppercase tracking-tight">{shift.label}</p>
                                        <p className="text-[10px] text-slate-400 mt-1">{shift.time}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Address (Optional) */}
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Địa chỉ thường trú (Không bắt buộc)</label>
                        <textarea
                            {...register('address')}
                            rows="2"
                            className="text-sm w-full bg-slate-50 border border-slate-200/50 rounded-[16px] px-4 py-3 text-slate-800 font-medium placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-orange-500/30 focus:ring-4 focus:ring-orange-500/10 transition-all resize-none"
                            placeholder="Nhập địa chỉ nhà, số đường, khu phố cư trú..."
                        />
                    </div>
                </div>

                {/* ─── SECTION 3: BẢNG LƯƠNG & CHẾ ĐỘ ─── */}
                <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-6 lg:p-8 space-y-6">
                    <div className="border-l-4 border-emerald-500 pl-4">
                        <h3 className="text-sm font-black text-slate-850 uppercase tracking-wider">3. Bảng lương & Phúc lợi</h3>
                        <p className="text-[11px] text-slate-400 mt-1">Thiết lập các mức lương cơ bản và thưởng doanh số định kỳ hàng tháng.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Salary */}
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Lương cơ bản (VND) <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <input
                                    {...register('salary', { required: true, min: 0 })}
                                    type="number"
                                    className={`text-sm w-full bg-slate-50 border border-slate-200/50 rounded-[16px] pl-4 pr-12 py-3.5 text-slate-800 font-bold focus:outline-none focus:bg-white focus:border-orange-500/30 focus:ring-4 focus:ring-orange-500/10 transition-all ${errors.salary ? 'border-red-500 bg-red-50/20' : ''}`}
                                    placeholder="Vd: 8500000"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-black">VND</span>
                            </div>
                            {errors.salary && <span className="text-[10px] text-red-500 mt-1.5 font-bold block">Lương cơ bản không hợp lệ</span>}
                        </div>

                        {/* Bonus */}
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Thưởng doanh số (VND) <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <input
                                    {...register('bonus', { required: true, min: 0 })}
                                    type="number"
                                    className={`text-sm w-full bg-slate-50 border border-slate-200/50 rounded-[16px] pl-4 pr-12 py-3.5 text-slate-800 font-bold focus:outline-none focus:bg-white focus:border-orange-500/30 focus:ring-4 focus:ring-orange-500/10 transition-all ${errors.bonus ? 'border-red-500 bg-red-50/20' : ''}`}
                                    placeholder="Vd: 1500000"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-black">VND</span>
                            </div>
                            {errors.bonus && <span className="text-[10px] text-red-500 mt-1.5 font-bold block">Mức thưởng không hợp lệ</span>}
                        </div>
                    </div>
                </div>

                {/* ─── SECTION 4: TÀI LIỆU PHÁP LÝ & ĐÍNH KÈM ─── */}
                <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-6 lg:p-8 space-y-6">
                    <div className="border-l-4 border-purple-500 pl-4">
                        <h3 className="text-sm font-black text-slate-850 uppercase tracking-wider">4. Tài liệu Pháp lý & Đính kèm</h3>
                        <p className="text-[11px] text-slate-400 mt-1">Đính kèm các bản quét / hình ảnh chụp của Thẻ căn cước và Hợp đồng lao động.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* ID Card Image Zone */}
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Ảnh chụp CMND / CCCD (Không bắt buộc)</label>

                            <div className="relative border-2 border-dashed border-slate-200 hover:border-orange-500/40 rounded-[24px] p-5 flex flex-col items-center justify-center bg-slate-50/40 hover:bg-slate-50 transition-all duration-300 cursor-pointer min-h-[170px]">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleFileChange(e, 'id_card')}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />

                                {idCardPreview ? (
                                    <div className="w-full flex flex-col items-center gap-2">
                                        <img src={idCardPreview} alt="ID Card Preview" className="h-28 w-auto rounded-xl object-contain border border-slate-200/55 shadow-sm" />
                                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                                            Đã chọn ảnh CCCD
                                        </span>
                                    </div>
                                ) : (
                                    <div className="text-center space-y-2 select-none">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        </div>
                                        <p className="text-xs font-bold text-slate-700">Tải lên ảnh CMND/CCCD</p>
                                        <p className="text-[9px] text-slate-400">Định dạng JPG, PNG. Tối đa 2MB</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Contract Image Zone */}
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Ảnh chụp Hợp đồng Lao động (Không bắt buộc)</label>

                            <div className="relative border-2 border-dashed border-slate-200 hover:border-orange-500/40 rounded-[24px] p-5 flex flex-col items-center justify-center bg-slate-50/40 hover:bg-slate-50 transition-all duration-300 cursor-pointer min-h-[170px]">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleFileChange(e, 'contract')}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />

                                {contractPreview ? (
                                    <div className="w-full flex flex-col items-center gap-2">
                                        <img src={contractPreview} alt="Contract Preview" className="h-28 w-auto rounded-xl object-contain border border-slate-200/55 shadow-sm" />
                                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                                            Đã chọn ảnh hợp đồng
                                        </span>
                                    </div>
                                ) : (
                                    <div className="text-center space-y-2 select-none">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <p className="text-xs font-bold text-slate-700">Tải lên ảnh Hợp đồng</p>
                                        <p className="text-[9px] text-slate-400">Định dạng JPG, PNG. Tối đa 2MB</p>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>

                {/* Form Submit Footer */}
                <div className="flex items-center gap-4">
                    <Link
                        to="/admin/personnel"
                        className="flex-1 py-4 bg-slate-100 text-slate-500 hover:bg-slate-200 rounded-[20px] font-black text-xs uppercase tracking-wider transition-all text-center border border-slate-200/30"
                    >
                        Hủy bỏ
                    </Link>
                    <button
                        type="submit"
                        disabled={processing}
                        className="flex-1 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-[20px] font-black text-xs uppercase tracking-wider transition-all shadow-xl shadow-orange-500/20 disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2 cursor-pointer border border-transparent"
                    >
                        {processing ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                <span>Đang xử lý...</span>
                            </>
                        ) : (
                            <span>{isEditMode ? 'Lưu thay đổi hồ sơ' : 'Thêm nhân viên'}</span>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default PersonnelCreatePage;
