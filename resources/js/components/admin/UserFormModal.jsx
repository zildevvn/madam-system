import React, { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { formatLocalDate } from '../../shared/utils/formatLocalDate';
import Icon from '../shared/Icon';

const UserFormModal = ({ isOpen, onClose, onSubmit, roles, user = null, processing = false }) => {
    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
        defaultValues: {
            name: '',
            email: '',
            password: '',
            role: 'order_staff',
            join_date: '',
            date_of_birth: '',
            work_shift: '',
            salary: '',
            bonus: '',
            address: ''
        }
    });

    const salary = watch('salary');
    const bonus = watch('bonus');

    const [showPassword, setShowPassword] = useState(false);
    
    // File upload states
    const [idCardFile, setIdCardFile] = useState(null);
    const [idCardPreview, setIdCardPreview] = useState(null);
    const [idCardError, setIdCardError] = useState(null);
    const idCardInputRef = useRef(null);

    const [contractFile, setContractFile] = useState(null);
    const [contractPreview, setContractPreview] = useState(null);
    const [contractError, setContractError] = useState(null);
    const contractInputRef = useRef(null);

    // Clean up previews to avoid memory leaks
    useEffect(() => {
        return () => {
            if (idCardPreview && idCardPreview.startsWith('blob:')) {
                URL.revokeObjectURL(idCardPreview);
            }
            if (contractPreview && contractPreview.startsWith('blob:')) {
                URL.revokeObjectURL(contractPreview);
            }
        };
    }, [idCardPreview, contractPreview]);

    useEffect(() => {
        if (isOpen) {
            setShowPassword(false);
            setIdCardFile(null);
            setContractFile(null);
            setIdCardError(null);
            setContractError(null);

            if (user) {
                setIdCardPreview(user.id_card_image ? `/storage/${user.id_card_image}` : null);
                setContractPreview(user.contract_image ? `/storage/${user.contract_image}` : null);
                
                reset({
                    name: user.name || '',
                    email: user.email || '',
                    password: '', // Leave blank for edit unless they change it
                    role: user.role || 'order_staff',
                    join_date: user.join_date || '',
                    date_of_birth: user.date_of_birth || '',
                    work_shift: user.work_shift || '',
                    salary: user.salary ? Math.round(user.salary) : '',
                    bonus: user.bonus ? Math.round(user.bonus) : '',
                    address: user.address || ''
                });
            } else {
                setIdCardPreview(null);
                setContractPreview(null);
                
                reset({
                    name: '',
                    email: '',
                    password: '',
                    role: 'order_staff',
                    join_date: formatLocalDate(new Date()), // Default to today
                    date_of_birth: '',
                    work_shift: 'Ca sáng',
                    salary: '',
                    bonus: '0',
                    address: ''
                });
            }
        }
    }, [user, isOpen, reset]);

    const handleFileChange = (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            if (type === 'id_card') {
                setIdCardError('Vui lòng chọn file ảnh hợp lệ');
            } else {
                setContractError('Vui lòng chọn file ảnh hợp lệ');
            }
            return;
        }

        const previewUrl = URL.createObjectURL(file);

        if (type === 'id_card') {
            if (idCardPreview && idCardPreview.startsWith('blob:')) {
                URL.revokeObjectURL(idCardPreview);
            }
            setIdCardFile(file);
            setIdCardPreview(previewUrl);
            setIdCardError(null);
        } else {
            if (contractPreview && contractPreview.startsWith('blob:')) {
                URL.revokeObjectURL(contractPreview);
            }
            setContractFile(file);
            setContractPreview(previewUrl);
            setContractError(null);
        }

        e.target.value = ''; // Reset input to allow selecting same file
    };

    const removeFile = (type) => {
        if (type === 'id_card') {
            if (idCardPreview && idCardPreview.startsWith('blob:')) {
                URL.revokeObjectURL(idCardPreview);
            }
            setIdCardFile(null);
            setIdCardPreview(null);
        } else {
            if (contractPreview && contractPreview.startsWith('blob:')) {
                URL.revokeObjectURL(contractPreview);
            }
            setContractFile(null);
            setContractPreview(null);
        }
    };

    const onFormSubmit = (data) => {
        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('email', data.email);
        
        // Add password if it's new user or populated on edit
        if (data.password) {
            formData.append('password', data.password);
        }
        
        formData.append('role', data.role);
        formData.append('join_date', data.join_date);
        formData.append('date_of_birth', data.date_of_birth);
        formData.append('work_shift', data.work_shift);
        formData.append('salary', data.salary);
        formData.append('bonus', data.bonus);
        formData.append('address', data.address || '');

        if (idCardFile) {
            formData.append('id_card_image', idCardFile);
        }
        if (contractFile) {
            formData.append('contract_image', contractFile);
        }

        onSubmit(formData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white rounded-[24px] w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col my-8 max-h-[90vh]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0 bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500">
                            <Icon name="userPlus" className="w-5 h-5" size={20} />
                        </div>
                        <div>
                            <h4 className="text-gray-900 mb-0 font-black text-lg leading-tight">
                                {user ? 'Chỉnh sửa nhân sự' : 'Thêm nhân sự mới'}
                            </h4>
                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                                {user ? `Mã nhân sự: #${user.id}` : 'Điền đầy đủ thông tin bên dưới'}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all" 
                        type="button"
                    >
                        <Icon name="close" className="w-5 h-5" size={20} />
                    </button>
                </div>

                {/* Form Body - Scrollable */}
                <form onSubmit={handleSubmit(onFormSubmit)} className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                    
                    {/* Section 1: Basic Information */}
                    <div>
                        <h5 className="text-[11px] font-black text-orange-500 uppercase tracking-[0.2em] mb-4 pb-1 border-b border-orange-100">
                            Thông tin cơ bản
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[11px] font-black text-gray-500 uppercase tracking-[0.1em] mb-1.5">
                                    Họ và tên <span className="text-red-500">*</span>
                                </label>
                                <input
                                    {...register('name', { required: 'Họ và tên là bắt buộc' })}
                                    type="text"
                                    className={`text-[15px] w-full bg-slate-50 border-none rounded-xl p-3 text-slate-900 font-medium placeholder:text-slate-300 focus:ring-4 focus:ring-orange-500/10 transition-all font-sans ${errors.name ? 'ring-2 ring-red-500/20' : ''}`}
                                    placeholder="Ví dụ: Nguyễn Văn A"
                                />
                                {errors.name && <span className="text-[10px] text-red-500 mt-1 font-bold block">{errors.name.message}</span>}
                            </div>

                            <div>
                                <label className="block text-[11px] font-black text-gray-500 uppercase tracking-[0.1em] mb-1.5">
                                    Email (Tên đăng nhập) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    {...register('email', { 
                                        required: 'Email đăng nhập là bắt buộc',
                                        pattern: { value: /^\S+@\S+$/i, message: 'Định dạng email không hợp lệ' }
                                    })}
                                    type="email"
                                    className={`text-[15px] w-full bg-slate-50 border-none rounded-xl p-3 text-slate-900 font-medium placeholder:text-slate-300 focus:ring-4 focus:ring-orange-500/10 transition-all font-sans ${errors.email ? 'ring-2 ring-red-500/20' : ''}`}
                                    placeholder="email@domain.com"
                                />
                                {errors.email && <span className="text-[10px] text-red-500 mt-1 font-bold block">{errors.email.message}</span>}
                            </div>

                            <div>
                                <label className="block text-[11px] font-black text-gray-500 uppercase tracking-[0.1em] mb-1.5">
                                    Mật khẩu {!user && <span className="text-red-500">*</span>}
                                </label>
                                <div className="relative">
                                    <input
                                        {...register('password', { 
                                            required: !user ? 'Mật khẩu là bắt buộc' : false, 
                                            minLength: { value: 6, message: 'Mật khẩu phải tối thiểu 6 ký tự' } 
                                        })}
                                        type={showPassword ? "text" : "password"}
                                        className={`text-[15px] w-full bg-slate-50 border-none rounded-xl p-3 pr-12 text-slate-900 font-medium placeholder:text-slate-300 focus:ring-4 focus:ring-orange-500/10 transition-all font-sans ${errors.password ? 'ring-2 ring-red-500/20' : ''}`}
                                        placeholder={user ? "Bỏ trống nếu không đổi" : "Tối thiểu 6 ký tự"}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                                    >
                                        {showPassword ? (
                                            <Icon name="eye" className="w-5 h-5" size={20} />
                                        ) : (
                                            <Icon name="eyeOff" className="w-5 h-5" size={20} />
                                        )}
                                    </button>
                                </div>
                                {errors.password && <span className="text-[10px] text-red-500 mt-1 font-bold block">{errors.password.message}</span>}
                            </div>

                            <div>
                                <label className="block text-[11px] font-black text-gray-500 uppercase tracking-[0.1em] mb-1.5">
                                    Ngày sinh <span className="text-red-500">*</span>
                                </label>
                                <input
                                    {...register('date_of_birth', { required: 'Ngày sinh là bắt buộc' })}
                                    type="date"
                                    className={`text-[15px] w-full bg-slate-50 border-none rounded-xl p-3 text-slate-900 font-medium focus:ring-4 focus:ring-orange-500/10 transition-all font-sans ${errors.date_of_birth ? 'ring-2 ring-red-500/20' : ''}`}
                                />
                                {errors.date_of_birth && <span className="text-[10px] text-red-500 mt-1 font-bold block">{errors.date_of_birth.message}</span>}
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-[11px] font-black text-gray-500 uppercase tracking-[0.1em] mb-1.5">
                                    Địa chỉ thường trú
                                </label>
                                <input
                                    {...register('address')}
                                    type="text"
                                    className="text-[15px] w-full bg-slate-50 border-none rounded-xl p-3 text-slate-900 font-medium placeholder:text-slate-300 focus:ring-4 focus:ring-orange-500/10 transition-all font-sans"
                                    placeholder="Ví dụ: 123 Nguyễn Huệ, TP. Huế"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Employment Information */}
                    <div>
                        <h5 className="text-[11px] font-black text-orange-500 uppercase tracking-[0.2em] mb-4 pb-1 border-b border-orange-100">
                            Thông tin công việc
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[11px] font-black text-gray-500 uppercase tracking-[0.1em] mb-1.5">
                                    Quyền hạn / Chức vụ <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <select
                                        {...register('role', { required: true })}
                                        className="text-[15px] w-full bg-slate-50 border-none rounded-xl p-3 text-slate-900 font-medium appearance-none focus:ring-4 focus:ring-orange-500/10 transition-all cursor-pointer font-sans"
                                    >
                                        {roles.map(role => (
                                            <option key={role.value} value={role.value}>{role.label}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 flex items-center justify-center">
                                        <Icon name="chevronDown" className="w-4 h-4" size={16} />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-black text-gray-500 uppercase tracking-[0.1em] mb-1.5">
                                    Ca làm việc <span className="text-red-500">*</span>
                                </label>
                                <input
                                    {...register('work_shift', { required: 'Ca làm việc là bắt buộc' })}
                                    type="text"
                                    className={`text-[15px] w-full bg-slate-50 border-none rounded-xl p-3 text-slate-900 font-medium placeholder:text-slate-300 focus:ring-4 focus:ring-orange-500/10 transition-all font-sans ${errors.work_shift ? 'ring-2 ring-red-500/20' : ''}`}
                                    placeholder="Ví dụ: Ca sáng (6:00 - 14:00), Ca gãy..."
                                />
                                {errors.work_shift && <span className="text-[10px] text-red-500 mt-1 font-bold block">{errors.work_shift.message}</span>}
                            </div>

                            <div>
                                <label className="block text-[11px] font-black text-gray-500 uppercase tracking-[0.1em] mb-1.5">
                                    Mức lương (VND/tháng) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={salary ? Number(salary).toLocaleString('vi-VN') : ''}
                                    onChange={(e) => {
                                        const cleanVal = e.target.value.replace(/\D/g, '');
                                        setValue('salary', cleanVal ? parseInt(cleanVal, 10) : '', { shouldValidate: true });
                                    }}
                                    className={`text-[15px] w-full bg-slate-50 border-none rounded-xl p-3 text-slate-900 font-medium placeholder:text-slate-300 focus:ring-4 focus:ring-orange-500/10 transition-all font-sans ${errors.salary ? 'ring-2 ring-red-500/20' : ''}`}
                                    placeholder="Ví dụ: 8.000.000"
                                />
                                <input type="hidden" {...register('salary', { 
                                    required: 'Mức lương là bắt buộc',
                                    min: { value: 0, message: 'Lương không được nhỏ hơn 0' }
                                })} />
                                {errors.salary && <span className="text-[10px] text-red-500 mt-1 font-bold block">{errors.salary.message}</span>}
                            </div>

                            <div>
                                <label className="block text-[11px] font-black text-gray-500 uppercase tracking-[0.1em] mb-1.5">
                                    Thưởng cố định (VND/tháng) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={bonus || bonus === 0 ? Number(bonus).toLocaleString('vi-VN') : ''}
                                    onChange={(e) => {
                                        const cleanVal = e.target.value.replace(/\D/g, '');
                                        setValue('bonus', cleanVal !== '' ? parseInt(cleanVal, 10) : 0, { shouldValidate: true });
                                    }}
                                    className={`text-[15px] w-full bg-slate-50 border-none rounded-xl p-3 text-slate-900 font-medium placeholder:text-slate-300 focus:ring-4 focus:ring-orange-500/10 transition-all font-sans ${errors.bonus ? 'ring-2 ring-red-500/20' : ''}`}
                                    placeholder="Ví dụ: 500.000"
                                />
                                <input type="hidden" {...register('bonus', { 
                                    required: 'Mức thưởng là bắt buộc',
                                    min: { value: 0, message: 'Mức thưởng không được nhỏ hơn 0' }
                                })} />
                                {errors.bonus && <span className="text-[10px] text-red-500 mt-1 font-bold block">{errors.bonus.message}</span>}
                            </div>

                            <div>
                                <label className="block text-[11px] font-black text-gray-500 uppercase tracking-[0.1em] mb-1.5">
                                    Ngày bắt đầu làm việc <span className="text-red-500">*</span>
                                </label>
                                <input
                                    {...register('join_date', { required: 'Ngày vào làm là bắt buộc' })}
                                    type="date"
                                    className={`text-[15px] w-full bg-slate-50 border-none rounded-xl p-3 text-slate-900 font-medium focus:ring-4 focus:ring-orange-500/10 transition-all font-sans ${errors.join_date ? 'ring-2 ring-red-500/20' : ''}`}
                                />
                                {errors.join_date && <span className="text-[10px] text-red-500 mt-1 font-bold block">{errors.join_date.message}</span>}
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Document Attachments */}
                    <div>
                        <h5 className="text-[11px] font-black text-orange-500 uppercase tracking-[0.2em] mb-4 pb-1 border-b border-orange-100">
                            Tài liệu đính kèm (Tùy chọn)
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            
                            {/* ID Card Uploader */}
                            <div className="flex flex-col">
                                <label className="block text-[11px] font-black text-gray-500 uppercase tracking-[0.1em] mb-2">
                                    Ảnh CMND / CCCD
                                </label>
                                <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 relative group">
                                    <div 
                                        onClick={() => idCardInputRef.current?.click()}
                                        className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-200 bg-white flex flex-col items-center justify-center overflow-hidden cursor-pointer hover:border-orange-400 hover:bg-orange-50/30 transition-all flex-shrink-0"
                                    >
                                        {idCardPreview ? (
                                            <img src={idCardPreview} alt="ID Card Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center text-slate-400">
                                                <Icon name="plus" className="w-6 h-6" size={24} />
                                                <span className="text-[8px] font-bold uppercase tracking-widest mt-1">Tải ảnh</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h6 className="text-xs font-black text-slate-700 truncate">
                                            {idCardFile ? idCardFile.name : (user?.id_card_image ? 'Ảnh CMND hiện tại' : 'Chưa chọn tệp')}
                                        </h6>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                                            {idCardFile ? `${(idCardFile.size / 1024).toFixed(1)} KB` : 'Định dạng .JPG, .PNG'}
                                        </p>
                                        {idCardPreview && (
                                            <button
                                                type="button"
                                                onClick={() => removeFile('id_card')}
                                                className="text-[9px] font-black text-red-500 uppercase tracking-widest mt-1 hover:text-red-600 transition-colors flex items-center gap-1"
                                            >
                                                <Icon name="trash" className="w-3 h-3" size={12} />
                                                Gỡ bỏ
                                            </button>
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        ref={idCardInputRef}
                                        onChange={(e) => handleFileChange(e, 'id_card')}
                                        accept="image/*"
                                        className="hidden"
                                    />
                                </div>
                                {idCardError && <span className="text-[10px] text-red-500 mt-1 font-bold">{idCardError}</span>}
                            </div>

                            {/* Contract Uploader */}
                            <div className="flex flex-col">
                                <label className="block text-[11px] font-black text-gray-500 uppercase tracking-[0.1em] mb-2">
                                    Ảnh hợp đồng lao động
                                </label>
                                <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 relative group">
                                    <div 
                                        onClick={() => contractInputRef.current?.click()}
                                        className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-200 bg-white flex flex-col items-center justify-center overflow-hidden cursor-pointer hover:border-orange-400 hover:bg-orange-50/30 transition-all flex-shrink-0"
                                    >
                                        {contractPreview ? (
                                            <img src={contractPreview} alt="Contract Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center text-slate-400">
                                                <Icon name="plus" className="w-6 h-6" size={24} />
                                                <span className="text-[8px] font-bold uppercase tracking-widest mt-1">Tải ảnh</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h6 className="text-xs font-black text-slate-700 truncate">
                                            {contractFile ? contractFile.name : (user?.contract_image ? 'Ảnh hợp đồng hiện tại' : 'Chưa chọn tệp')}
                                        </h6>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                                            {contractFile ? `${(contractFile.size / 1024).toFixed(1)} KB` : 'Định dạng .JPG, .PNG'}
                                        </p>
                                        {contractPreview && (
                                            <button
                                                type="button"
                                                onClick={() => removeFile('contract')}
                                                className="text-[9px] font-black text-red-500 uppercase tracking-widest mt-1 hover:text-red-600 transition-colors flex items-center gap-1"
                                            >
                                                <Icon name="trash" className="w-3 h-3" size={12} />
                                                Gỡ bỏ
                                            </button>
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        ref={contractInputRef}
                                        onChange={(e) => handleFileChange(e, 'contract')}
                                        accept="image/*"
                                        className="hidden"
                                    />
                                </div>
                                {contractError && <span className="text-[10px] text-red-500 mt-1 font-bold">{contractError}</span>}
                            </div>

                        </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="pt-6 border-t border-gray-100 flex items-center gap-4 bg-white sticky bottom-0">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={processing}
                            className="flex-1 py-3.5 bg-slate-100 text-slate-500 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95 disabled:opacity-50"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="flex-1 py-3.5 bg-orange-500 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-orange-600 transition-all shadow-xl shadow-orange-500/25 disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2"
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
