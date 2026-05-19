import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

const UserFormModal = ({ isOpen, onClose, onSubmit, roles, user = null, processing = false }) => {
    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
        defaultValues: {
            name: '',
            email: '',
            password: '',
            role: 'order_staff'
        }
    });

    const [showPassword, setShowPassword] = useState(true);
    const activeRole = watch('role');

    useEffect(() => {
        if (isOpen) {
            setShowPassword(true);
            reset(user ? {
                name: user.name || '',
                email: user.email || '',
                password: user.plain_password || '', // Populate with plain password if available
                role: user.role || 'order_staff'
            } : {
                name: '',
                email: '',
                password: '',
                role: 'order_staff'
            });
        }
    }, [user, isOpen, reset]);

    const onFormSubmit = (data) => {
        // If password is empty during edit, remove it from the payload
        const payload = { ...data };
        if (user && !payload.password) {
            delete payload.password;
        }
        onSubmit(payload);
    };

    const handleGeneratePassword = () => {
        const letters = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
        const numbers = '23456789';
        let newPass = 'MD-';
        
        // Generate random character string
        for (let i = 0; i < 4; i++) {
            newPass += letters.charAt(Math.floor(Math.random() * letters.length));
        }
        for (let i = 0; i < 2; i++) {
            newPass += numbers.charAt(Math.floor(Math.random() * numbers.length));
        }
        
        setValue('password', newPass);
        setShowPassword(true);

        // Copy to clipboard
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

    if (!isOpen) return null;

    // Premium Interactive Role Cards definitions
    const roleCards = [
        {
            value: 'admin',
            label: 'Quản trị viên',
            sub: 'Toàn quyền cấu hình & quản trị hệ thống',
            color: 'purple',
            bgClass: 'hover:border-purple-300 hover:bg-purple-50/20',
            activeClass: 'border-purple-500 bg-purple-50/50 ring-2 ring-purple-500/10 text-purple-700',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
            )
        },
        {
            value: 'manager',
            label: 'Quản lý',
            sub: 'Giám sát vận hành, doanh thu & bàn',
            color: 'blue',
            bgClass: 'hover:border-blue-300 hover:bg-blue-50/20',
            activeClass: 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/10 text-blue-700',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
            )
        },
        {
            value: 'order_staff',
            label: 'Nhân viên Order',
            sub: 'Ghi nhận và gửi order món cho khách',
            color: 'orange',
            bgClass: 'hover:border-orange-300 hover:bg-orange-50/20',
            activeClass: 'border-orange-500 bg-orange-50/50 ring-2 ring-orange-500/10 text-orange-700',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
            )
        },
        {
            value: 'kitchen',
            label: 'Đầu bếp',
            sub: 'Chế biến món ăn, cập nhật món hoàn thành',
            color: 'emerald',
            bgClass: 'hover:border-emerald-300 hover:bg-emerald-50/20',
            activeClass: 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/10 text-emerald-700',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                </svg>
            )
        },
        {
            value: 'bar',
            label: 'Pha chế (Bar)',
            sub: 'Pha chế đồ uống, sinh tố & nước ngọt',
            color: 'pink',
            bgClass: 'hover:border-pink-300 hover:bg-pink-50/20',
            activeClass: 'border-pink-500 bg-pink-50/50 ring-2 ring-pink-500/10 text-pink-700',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707m-9.9-9.9l.707-.707" />
                </svg>
            )
        },
        {
            value: 'cashier',
            label: 'Thu ngân',
            sub: 'Thanh toán hóa đơn, in hóa đơn & két tiền',
            color: 'teal',
            bgClass: 'hover:border-teal-300 hover:bg-teal-50/20',
            activeClass: 'border-teal-500 bg-teal-50/50 ring-2 ring-teal-500/10 text-teal-700',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            )
        },
        {
            value: 'bill',
            label: 'Nhân viên Bill',
            sub: 'Theo dõi & in ấn hóa đơn chế biến cho bếp',
            color: 'cyan',
            bgClass: 'hover:border-cyan-300 hover:bg-cyan-50/20',
            activeClass: 'border-cyan-500 bg-cyan-50/50 ring-2 ring-cyan-500/10 text-cyan-700',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            )
        },
        {
            value: 'seller',
            label: 'Bán hàng',
            sub: 'Nhận đơn trực tiếp & quản lý quầy đồ khô',
            color: 'rose',
            bgClass: 'hover:border-rose-300 hover:bg-rose-50/20',
            activeClass: 'border-rose-500 bg-rose-50/50 ring-2 ring-rose-500/10 text-rose-700',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
            )
        }
    ];

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-[32px] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                        {user ? 'Chỉnh sửa nhân sự' : 'Thêm nhân sự mới'}
                    </h3>
                    <button 
                        onClick={onClose} 
                        className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-50 rounded-full transition-all cursor-pointer" 
                        type="button"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(onFormSubmit)} className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6 flex flex-col">
                    
                    {/* Basic Info Fields Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Username */}
                        <div>
                            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Tên nhân viên</label>
                            <input
                                {...register('name', { required: true })}
                                type="text"
                                autoComplete="name"
                                className={`text-sm w-full bg-slate-50 border border-slate-200/50 rounded-[16px] px-4 py-3 text-slate-800 font-medium placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-orange-500/30 focus:ring-4 focus:ring-orange-500/10 transition-all ${errors.name ? 'border-red-500 bg-red-50/20' : ''}`}
                                placeholder="Vd: Nguyễn Văn A"
                            />
                            {errors.name && <span className="text-[10px] text-red-500 mt-1 font-bold">Vui lòng nhập tên nhân viên</span>}
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Địa chỉ Email</label>
                            <input
                                {...register('email', { required: false, pattern: /^\S+@\S+$/i })}
                                type="email"
                                autoComplete="email"
                                className={`text-sm w-full bg-slate-50 border border-slate-200/50 rounded-[16px] px-4 py-3 text-slate-800 font-medium placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-orange-500/30 focus:ring-4 focus:ring-orange-500/10 transition-all ${errors.email ? 'border-red-500 bg-red-50/20' : ''}`}
                                placeholder="email@example.com"
                            />
                            {errors.email && <span className="text-[10px] text-red-500 mt-1 font-bold">Email không đúng định dạng</span>}
                        </div>
                    </div>

                    {/* Password Field */}
                    <div>
                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">
                            {user ? 'Mật khẩu mới (Bỏ trống nếu không đổi)' : 'Mật khẩu tài khoản'}
                        </label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <input
                                    {...register('password', { required: !user, minLength: 6 })}
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="off"
                                    className={`text-sm w-full bg-slate-50 border border-slate-200/50 rounded-[16px] pl-4 pr-12 py-3 text-slate-800 font-mono focus:outline-none focus:bg-white focus:border-orange-500/30 focus:ring-4 focus:ring-orange-500/10 transition-all ${errors.password ? 'border-red-500 bg-red-50/20' : ''}`}
                                    placeholder={user ? "Nhập mật khẩu mới nếu muốn thay đổi" : "Tối thiểu 6 ký tự"}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none cursor-pointer"
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
                            
                            {/* Auto Password Generator Button */}
                            <button
                                type="button"
                                onClick={handleGeneratePassword}
                                className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-[16px] text-xs font-black uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5 cursor-pointer flex-shrink-0"
                                title="Tạo mật khẩu tự động"
                            >
                                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span>Tạo tự động</span>
                            </button>
                        </div>
                        {errors.password && <span className="text-[10px] text-red-500 mt-1 font-bold block">Mật khẩu tối thiểu phải 6 ký tự</span>}
                    </div>

                    {/* Hidden Native Role Input registered with react-hook-form */}
                    <input type="hidden" {...register('role', { required: true })} />

                    {/* Premium Card-based Role Selector Grid */}
                    <div className="space-y-3">
                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest">Phân quyền chức vụ hệ thống</label>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                            {roleCards.map((card) => {
                                const isSelected = activeRole === card.value;
                                return (
                                    <div
                                        key={card.value}
                                        onClick={() => setValue('role', card.value)}
                                        className={`p-4 rounded-2xl border border-slate-200/60 cursor-pointer transition-all duration-300 flex items-start gap-3 relative select-none group ${
                                            isSelected ? card.activeClass : `bg-white ${card.bgClass}`
                                        }`}
                                    >
                                        {/* Icon Container */}
                                        <div className={`p-2 rounded-xl flex-shrink-0 transition-all duration-300 ${
                                            isSelected ? 'bg-white text-slate-900 shadow-sm scale-110' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-600'
                                        }`}>
                                            {card.icon}
                                        </div>

                                        {/* Label & Details */}
                                        <div className="flex flex-col min-w-0 pr-6">
                                            <span className={`text-sm font-black transition-colors ${isSelected ? 'text-slate-900' : 'text-slate-700'}`}>
                                                {card.label}
                                            </span>
                                            <span className="text-[10px] text-slate-400 mt-1 leading-relaxed line-clamp-2">
                                                {card.sub}
                                            </span>
                                        </div>

                                        {/* Selected Indicator Circle Tick */}
                                        {isSelected && (
                                            <div className="absolute top-4 right-4 w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-md animate-in zoom-in duration-300">
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-6 border-t border-slate-100 flex items-center gap-4 mt-auto">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 bg-slate-100 text-slate-500 hover:bg-slate-200 rounded-[16px] font-black text-[11px] uppercase tracking-wider transition-all cursor-pointer active:scale-95 text-center"
                        >
                            Hủy bỏ
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-[16px] font-black text-[11px] uppercase tracking-wider transition-all shadow-xl shadow-orange-500/20 disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                        >
                            {processing ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                    <span>Đang xử lý...</span>
                                </>
                            ) : (
                                <span>{user ? 'Lưu thay đổi' : 'Tạo tài khoản'}</span>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserFormModal;
