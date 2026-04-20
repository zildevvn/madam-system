import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';

const UserFormModal = ({ isOpen, onClose, onSubmit, roles, user = null, processing = false }) => {
    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        defaultValues: {
            name: '',
            email: '',
            password: '',
            role: 'order_staff'
        }
    });

    useEffect(() => {
        if (isOpen) {
            reset(user ? {
                name: user.name || '',
                email: user.email || '',
                password: '', // Never populate password for editing
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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-[16px] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col">
                <div className="px-3 py-2 lg:px-6 lg:py-4 border-b border-gray-50 flex items-center justify-between flex-shrink-0">
                    <h4 className="text-gray-900 mb-0 font-black">
                        {user ? 'Chỉnh sửa nhân sự' : 'Thêm nhân sự mới'}
                    </h4>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-all" type="button">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit(onFormSubmit)} className="px-3 py-2 lg:px-6 lg:py-4 space-y-3 lg:space-y-4">
                    <div>
                        <label className="block text-[11px] font-black text-gray-600 uppercase tracking-[0.2em] mb-2">Họ & Tên</label>
                        <input
                            {...register('name', { required: true })}
                            type="text"
                            autoComplete="name"
                            className={`text-[16px] w-full bg-slate-50 border-none rounded-xl p-2 lg:p-3 text-slate-900 font-normal placeholder:text-slate-300 focus:ring-4 focus:ring-orange-500/10 transition-all font-sans ${errors.name ? 'ring-2 ring-red-500/20' : ''}`}
                            placeholder="Vd: Nguyễn Văn A"
                        />
                    </div>

                    <div>
                        <label className="block text-[11px] font-black text-gray-600 uppercase tracking-[0.2em] mb-2">Email</label>
                        <input
                            {...register('email', { required: false, pattern: /^\S+@\S+$/i })}
                            type="email"
                            autoComplete="email"
                            className={`text-[16px] w-full bg-slate-50 border-none rounded-xl p-2 lg:p-3 text-slate-900 font-normal placeholder:text-slate-300 focus:ring-4 focus:ring-orange-500/10 transition-all font-sans ${errors.email ? 'ring-2 ring-red-500/20' : ''}`}
                            placeholder="email@example.com"
                        />
                    </div>

                    <div>
                        <label className="block text-[11px] font-black text-gray-600 uppercase tracking-[0.2em] mb-2">
                            {user ? 'Mật khẩu (Để trống nếu không đổi)' : 'Mật khẩu'}
                        </label>
                        <input
                            {...register('password', { required: !user, minLength: 6 })}
                            type="text"
                            autoComplete="new-password"
                            className={`text-[16px] w-full bg-slate-50 border-none rounded-xl p-2 lg:p-3 text-slate-900 font-normal placeholder:text-slate-300 focus:ring-4 focus:ring-orange-500/10 transition-all font-sans ${errors.password ? 'ring-2 ring-red-500/20' : ''}`}
                            placeholder="••••••••"
                        />
                        {errors.password && <span className="text-[10px] text-red-500 mt-1 font-bold">Mật khẩu tối thiểu 6 ký tự</span>}
                    </div>

                    <div>
                        <label className="block text-[11px] font-black text-gray-600 uppercase tracking-[0.2em] mb-2">Quyền truy cập</label>
                        <div className="relative">
                            <select
                                {...register('role', { required: true })}
                                className="text-[16px] w-full bg-slate-50 border-none rounded-xl p-2 lg:p-3 text-slate-900 font-normal appearance-none focus:ring-4 focus:ring-orange-500/10 transition-all cursor-pointer font-sans"
                            >
                                {roles.map(role => (
                                    <option key={role.value} value={role.value}>{role.label}</option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex items-center gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 bg-slate-100 text-slate-500 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-orange-600 transition-all shadow-xl shadow-orange-500/25 disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2"
                        >
                            {processing ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                    <span>Đang xử lý...</span>
                                </>
                            ) : (
                                user ? 'Lưu thay đổi' : 'Tạo tài khoản'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserFormModal;
