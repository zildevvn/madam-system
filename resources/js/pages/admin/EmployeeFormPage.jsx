import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import axios from 'axios';
import imageCompression from 'browser-image-compression';
import { createUserApi, updateUserApi, getUsersApi, getUserByIdApi } from '../../services/userService';
import { formatLocalDate } from '../../shared/utils/formatLocalDate';
import Icon from '../../components/shared/Icon';

const EmployeeFormPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = !!id;

    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [user, setUser] = useState(null);

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
            address: '',
            phone: '',
            status: 'active'
        }
    });

    const salary = watch('salary');
    const bonus = watch('bonus');

    const [showPassword, setShowPassword] = useState(false);

    // Image/file states
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const photoInputRef = useRef(null);

    const [idCardFile, setIdCardFile] = useState(null);
    const [idCardPreview, setIdCardPreview] = useState(null);
    const idCardInputRef = useRef(null);

    const [contractFile, setContractFile] = useState(null);
    const [contractPreview, setContractPreview] = useState(null);
    const contractInputRef = useRef(null);

    const roles = [
        { value: 'admin', label: 'Quản trị viên (Admin)' },
        { value: 'accountant', label: 'Kế toán (Accountant)' },
        { value: 'manager', label: 'Quản lý (Manager)' },
        { value: 'order_staff', label: 'Nhân viên Order' },
        { value: 'kitchen', label: 'Bếp (Kitchen)' },
        { value: 'bar', label: 'Bar' },
        { value: 'cashier', label: 'Thu ngân (Cashier)' },
        { value: 'bill', label: 'Nhân viên đọc Bill' },
        { value: 'seller', label: 'Bán hàng (Seller)' }
    ];

    // Fetch user details if editing
    useEffect(() => {
        if (isEditMode) {
            const fetchEmployee = async () => {
                setLoading(true);
                try {
                    const response = await getUserByIdApi(id);
                    const emp = response.data;
                    setUser(emp);

                    setPhotoPreview(emp.photo ? `/storage/${emp.photo}` : null);
                    setIdCardPreview(emp.id_card_image ? `/storage/${emp.id_card_image}` : null);
                    setContractPreview(emp.contract_image ? `/storage/${emp.contract_image}` : null);

                    reset({
                        name: emp.name || '',
                        email: emp.email || '',
                        password: '', // Kept blank unless resetting
                        role: emp.role || 'order_staff',
                        join_date: emp.join_date || '',
                        date_of_birth: emp.date_of_birth || '',
                        work_shift: emp.work_shift || '',
                        salary: emp.salary ? Math.round(emp.salary) : '',
                        bonus: emp.bonus ? Math.round(emp.bonus) : '',
                        address: emp.address || '',
                        phone: emp.phone || '',
                        status: emp.status || 'active'
                    });
                } catch (err) {
                    console.error('Failed to fetch employee details:', err);
                    toast.error('Không thể tải thông tin nhân viên');
                    navigate('/admin/personnel');
                } finally {
                    setLoading(false);
                }
            };
            fetchEmployee();
        } else {
            // Default setup for Create Mode
            reset({
                name: '',
                email: '',
                password: '',
                role: 'order_staff',
                join_date: formatLocalDate(new Date()),
                date_of_birth: '',
                work_shift: 'Ca sáng',
                salary: '',
                bonus: '0',
                address: '',
                phone: '',
                status: 'active'
            });
        }
    }, [id, isEditMode, reset, navigate]);

    // Clean up local preview Blob URLs to avoid memory leaks
    useEffect(() => {
        return () => {
            if (photoPreview && photoPreview.startsWith('blob:')) URL.revokeObjectURL(photoPreview);
            if (idCardPreview && idCardPreview.startsWith('blob:')) URL.revokeObjectURL(idCardPreview);
            if (contractPreview && contractPreview.startsWith('blob:')) URL.revokeObjectURL(contractPreview);
        };
    }, [photoPreview, idCardPreview, contractPreview]);

    const handleFileChange = async (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Vui lòng chọn file hình ảnh hợp lệ (.JPG, .PNG)');
            return;
        }

        const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 1200,
            useWebWorker: true
        };

        let processedFile = file;
        const toastId = toast.loading('Đang nén ảnh...');
        try {
            processedFile = await imageCompression(file, options);
        } catch (error) {
            console.error('Image compression failed:', error);
        } finally {
            toast.dismiss(toastId);
        }

        const previewUrl = URL.createObjectURL(processedFile);

        if (type === 'photo') {
            if (photoPreview && photoPreview.startsWith('blob:')) URL.revokeObjectURL(photoPreview);
            setPhotoFile(processedFile);
            setPhotoPreview(previewUrl);
        } else if (type === 'id_card') {
            if (idCardPreview && idCardPreview.startsWith('blob:')) URL.revokeObjectURL(idCardPreview);
            setIdCardFile(processedFile);
            setIdCardPreview(previewUrl);
        } else if (type === 'contract') {
            if (contractPreview && contractPreview.startsWith('blob:')) URL.revokeObjectURL(contractPreview);
            setContractFile(processedFile);
            setContractPreview(previewUrl);
        }

        e.target.value = '';
    };

    const removeFile = (type) => {
        if (type === 'photo') {
            if (photoPreview && photoPreview.startsWith('blob:')) URL.revokeObjectURL(photoPreview);
            setPhotoFile(null);
            setPhotoPreview(null);
        } else if (type === 'id_card') {
            if (idCardPreview && idCardPreview.startsWith('blob:')) URL.revokeObjectURL(idCardPreview);
            setIdCardFile(null);
            setIdCardPreview(null);
        } else if (type === 'contract') {
            if (contractPreview && contractPreview.startsWith('blob:')) URL.revokeObjectURL(contractPreview);
            setContractFile(null);
            setContractPreview(null);
        }
    };

    const onSubmitForm = async (data) => {
        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('name', data.name);
            formData.append('email', data.email);

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
            formData.append('phone', data.phone || '');
            formData.append('status', data.status || 'active');

            if (photoFile) {
                formData.append('photo', photoFile);
            }
            if (idCardFile) {
                formData.append('id_card_image', idCardFile);
            }
            if (contractFile) {
                formData.append('contract_image', contractFile);
            }

            if (isEditMode) {
                await updateUserApi(id, formData);
                toast.success('Cập nhật nhân viên thành công!');
            } else {
                await createUserApi(formData);
                toast.success('Thêm nhân viên mới thành công!');
            }
            navigate('/admin/personnel');
        } catch (err) {
            console.error('Error submitting form:', err);
            const msg = err.response?.data?.message || 'Có lỗi xảy ra khi lưu dữ liệu';
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] py-20 bg-white rounded-[32px] border border-gray-100 shadow-sm animate-pulse">
                <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-orange-500 animate-spin mb-4"></div>
                <p className="text-slate-400 font-bold text-xs tracking-widest uppercase">Đang tải thông tin nhân sự...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">

            {/* Navigation & Breadcrumbs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-400">
                    <Link to="/admin" className="hover:text-orange-500 transition-colors">Admin</Link>
                    <span>/</span>
                    <Link to="/admin/personnel" className="hover:text-orange-500 transition-colors">Nhân sự</Link>
                    <span>/</span>
                    <span className="text-slate-900">{isEditMode ? 'Chỉnh sửa' : 'Thêm mới'}</span>
                </div>
                <button
                    onClick={() => navigate('/admin/personnel')}
                    className="flex items-center justify-center gap-2 self-start px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-slate-200 transition-all active:scale-95 border-none cursor-pointer"
                >
                    <Icon name="arrowLeft" className="w-4 h-4" size={16} strokeWidth={2.5} />
                    <span>Quay lại</span>
                </button>
            </div>

            {/* Header Title */}
            <h3 className="text-slate-900 tracking-tight">
                {isEditMode ? 'Chỉnh sửa Hồ sơ' : 'Tạo Hồ sơ Mới'}
            </h3>

            {/* Form layout */}
            <form onSubmit={handleSubmit(onSubmitForm)} className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Column Left: Photo Upload & Account Status */}
                <div className="lg:col-span-1 space-y-6">

                    {/* Avatar Upload Card */}
                    <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 flex flex-col items-center text-center">
                        <h6 className=" text-slate-400 uppercase tracking-widest mb-6 self-start w-full text-left pb-2 border-b border-slate-300">
                            Avatar
                        </h6>

                        <div className="relative group">
                            <div
                                onClick={() => photoInputRef.current?.click()}
                                className="w-32 h-32 rounded-full border-4 border-slate-50 bg-slate-100 shadow-inner flex items-center justify-center overflow-hidden cursor-pointer hover:border-orange-200 hover:shadow-md transition-all relative"
                            >
                                {photoPreview ? (
                                    <img src={photoPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-slate-400">
                                        <Icon name="user" className="w-10 h-10" size={40} strokeWidth={2} />
                                        <span className="text-[8px] font-black uppercase tracking-widest mt-1.5">Tải ảnh</span>
                                    </div>
                                )}
                            </div>

                            {photoPreview && (
                                <button
                                    type="button"
                                    onClick={() => removeFile('photo')}
                                    className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg border border-white hover:bg-red-600 transition-colors cursor-pointer active:scale-90"
                                    title="Xóa ảnh"
                                >
                                    <Icon name="close" className="w-4 h-4" size={16} strokeWidth={3} />
                                </button>
                            )}
                        </div>

                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-4">
                            Định dạng tệp: JPG, PNG (tối đa 1MB)
                        </p>

                        <input
                            type="file"
                            ref={photoInputRef}
                            onChange={(e) => handleFileChange(e, 'photo')}
                            accept="image/*"
                            className="hidden"
                        />
                    </div>

                    {/* Status & Security Card */}
                    <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 space-y-4">
                        <h6 className="text-slate-400 uppercase tracking-widest pb-2 border-b border-slate-300">
                            Trạng thái & Quyền hạn
                        </h6>

                        <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.1em] mb-1.5">Trạng thái công việc</label>
                            <div className="relative">
                                <select
                                    {...register('status')}
                                    className="text-sm w-full bg-slate-50 border-none rounded-xl p-3 text-slate-900 font-bold appearance-none cursor-pointer focus:ring-4 focus:ring-orange-500/10 transition-all"
                                >
                                    <option value="active">Đang làm việc (Active)</option>
                                    <option value="inactive">Đã nghỉ việc (Inactive)</option>
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                    <Icon name="chevronDown" className="w-4 h-4" size={16} strokeWidth={2.5} />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.1em] mb-1.5">Chức vụ / Nhóm quyền <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <select
                                    {...register('role', { required: true })}
                                    className="text-sm w-full bg-slate-50 border-none rounded-xl p-3 text-slate-900 font-bold appearance-none cursor-pointer focus:ring-4 focus:ring-orange-500/10 transition-all"
                                >
                                    {roles.map(role => (
                                        <option key={role.value} value={role.value}>{role.label}</option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                    <Icon name="chevronDown" className="w-4 h-4" size={16} strokeWidth={2.5} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Column Center & Right: Core Data Form */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Basic & Account Details Card */}
                    <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 space-y-6">
                        <h6 className="text-orange-500 uppercase tracking-[0.2em] pb-1 border-b border-slate-300">
                            Thông tin cá nhân & Tài khoản
                        </h6>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.1em] mb-1.5">Họ và tên <span className="text-red-500">*</span></label>
                                <input
                                    {...register('name', { required: 'Họ và tên là bắt buộc' })}
                                    type="text"
                                    className={`text-sm w-full bg-slate-50 border-none rounded-xl p-3 text-slate-900 font-medium placeholder:text-slate-300 focus:ring-4 focus:ring-orange-500/10 transition-all ${errors.name ? 'ring-2 ring-red-500/20' : ''}`}
                                    placeholder="Vd: Nguyễn Văn A"
                                />
                                {errors.name && <span className="text-[10px] text-red-500 mt-1 font-bold block">{errors.name.message}</span>}
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.1em] mb-1.5">Ngày sinh <span className="text-red-500">*</span></label>
                                <input
                                    {...register('date_of_birth', { required: 'Ngày sinh là bắt buộc' })}
                                    type="date"
                                    className={`text-sm w-full bg-slate-50 border-none rounded-xl p-3 text-slate-900 font-medium focus:ring-4 focus:ring-orange-500/10 transition-all ${errors.date_of_birth ? 'ring-2 ring-red-500/20' : ''}`}
                                />
                                {errors.date_of_birth && <span className="text-[10px] text-red-500 mt-1 font-bold block">{errors.date_of_birth.message}</span>}
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.1em] mb-1.5">Email đăng nhập (Tên TK) <span className="text-red-500">*</span></label>
                                <input
                                    {...register('email', {
                                        required: 'Email đăng nhập là bắt buộc',
                                        pattern: { value: /^\S+@\S+$/i, message: 'Email không hợp lệ' }
                                    })}
                                    type="email"
                                    className={`text-sm w-full bg-slate-50 border-none rounded-xl p-3 text-slate-900 font-medium placeholder:text-slate-300 focus:ring-4 focus:ring-orange-500/10 transition-all ${errors.email ? 'ring-2 ring-red-500/20' : ''}`}
                                    placeholder="email@example.com"
                                />
                                {errors.email && <span className="text-[10px] text-red-500 mt-1 font-bold block">{errors.email.message}</span>}
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.1em] mb-1.5">Số điện thoại liên hệ</label>
                                <input
                                    {...register('phone')}
                                    type="text"
                                    className="text-sm w-full bg-slate-50 border-none rounded-xl p-3 text-slate-900 font-medium placeholder:text-slate-300 focus:ring-4 focus:ring-orange-500/10 transition-all"
                                    placeholder="Vd: 0905123456"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.1em] mb-1.5">Mật khẩu {!isEditMode && <span className="text-red-500">*</span>}</label>
                                <div className="relative">
                                    <input
                                        {...register('password', {
                                            required: !isEditMode ? 'Mật khẩu là bắt buộc' : false,
                                            minLength: { value: 6, message: 'Mật khẩu tối thiểu 6 ký tự' }
                                        })}
                                        type={showPassword ? "text" : "password"}
                                        className={`text-sm w-full bg-slate-50 border-none rounded-xl p-3 pr-12 text-slate-900 font-medium placeholder:text-slate-300 focus:ring-4 focus:ring-orange-500/10 transition-all ${errors.password ? 'ring-2 ring-red-500/20' : ''}`}
                                        placeholder={isEditMode ? "Bỏ trống nếu giữ nguyên" : "Nhập tối thiểu 6 ký tự"}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                                    >
                                        {showPassword ? (
                                            <Icon name="eye" className="w-5 h-5" size={20} strokeWidth={2.5} />
                                        ) : (
                                            <Icon name="eyeOff" className="w-5 h-5" size={20} strokeWidth={2.5} />
                                        )}
                                    </button>
                                </div>
                                {errors.password && <span className="text-[10px] text-red-500 mt-1 font-bold block">{errors.password.message}</span>}
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.1em] mb-1.5">Địa chỉ thường trú</label>
                                <input
                                    {...register('address')}
                                    type="text"
                                    className="text-sm w-full bg-slate-50 border-none rounded-xl p-3 text-slate-900 font-medium placeholder:text-slate-300 focus:ring-4 focus:ring-orange-500/10 transition-all"
                                    placeholder="Vd: 15 Lê Lợi, Thành phố Huế"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Employment & Salary Details */}
                    <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 space-y-6">
                        <h6 className="text-orange-500 uppercase tracking-[0.2em] pb-1 border-b border-slate-300">
                            Chế độ lương thưởng
                        </h6>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.1em] mb-1.5">Ca làm việc</label>
                                <input
                                    {...register('work_shift')}
                                    type="text"
                                    className={`text-sm w-full bg-slate-50 border-none rounded-xl p-3 text-slate-900 font-medium placeholder:text-slate-300 focus:ring-4 focus:ring-orange-500/10 transition-all ${errors.work_shift ? 'ring-2 ring-red-500/20' : ''}`}
                                    placeholder="Vd: Ca sáng (6:00 - 14:00)"
                                />
                                {errors.work_shift && <span className="text-[10px] text-red-500 mt-1 font-bold block">{errors.work_shift.message}</span>}
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.1em] mb-1.5">Ngày vào làm</label>
                                <input
                                    {...register('join_date')}
                                    type="date"
                                    className={`text-sm w-full bg-slate-50 border-none rounded-xl p-3 text-slate-900 font-medium focus:ring-4 focus:ring-orange-500/10 transition-all ${errors.join_date ? 'ring-2 ring-red-500/20' : ''}`}
                                />
                                {errors.join_date && <span className="text-[10px] text-red-500 mt-1 font-bold block">{errors.join_date.message}</span>}
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.1em] mb-1.5">Mức lương cơ bản (VND/tháng)</label>
                                <input
                                    type="text"
                                    value={salary ? Number(salary).toLocaleString('vi-VN') : ''}
                                    onChange={(e) => {
                                        const cleanVal = e.target.value.replace(/\D/g, '');
                                        setValue('salary', cleanVal ? parseInt(cleanVal, 10) : '', { shouldValidate: true });
                                    }}
                                    className={`text-sm w-full bg-slate-50 border-none rounded-xl p-3 text-slate-900 font-medium placeholder:text-slate-300 focus:ring-4 focus:ring-orange-500/10 transition-all ${errors.salary ? 'ring-2 ring-red-500/20' : ''}`}
                                    placeholder="Vd: 8.000.000"
                                />
                                <input type="hidden" {...register('salary', { 
                                    min: { value: 0, message: 'Lương không được dưới 0' }
                                })} />
                                {errors.salary && <span className="text-[10px] text-red-500 mt-1 font-bold block">{errors.salary.message}</span>}
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.1em] mb-1.5">Thưởng cố định (VND/tháng)</label>
                                <input
                                    type="text"
                                    value={bonus || bonus === 0 ? Number(bonus).toLocaleString('vi-VN') : ''}
                                    onChange={(e) => {
                                        const cleanVal = e.target.value.replace(/\D/g, '');
                                        setValue('bonus', cleanVal !== '' ? parseInt(cleanVal, 10) : 0, { shouldValidate: true });
                                    }}
                                    className={`text-sm w-full bg-slate-50 border-none rounded-xl p-3 text-slate-900 font-medium placeholder:text-slate-300 focus:ring-4 focus:ring-orange-500/10 transition-all ${errors.bonus ? 'ring-2 ring-red-500/20' : ''}`}
                                    placeholder="Vd: 500.000"
                                />
                                <input type="hidden" {...register('bonus', { 
                                    min: { value: 0, message: 'Thưởng không được dưới 0' }
                                })} />
                                {errors.bonus && <span className="text-[10px] text-red-500 mt-1 font-bold block">{errors.bonus.message}</span>}
                            </div>
                        </div>
                    </div>

                    {/* Document Attachments */}
                    <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 space-y-6">
                        <h6 className="text-orange-500 uppercase tracking-[0.2em] pb-1 border-b border-slate-300">
                            Hồ sơ tài liệu cá nhân
                        </h6>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

                            {/* ID Card Box */}
                            <div className="flex flex-col">
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.1em] mb-2">Ảnh CMND / CCCD</label>
                                <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 relative">
                                    <div
                                        onClick={() => idCardInputRef.current?.click()}
                                        className="w-16 h-16 rounded-xl border border-dashed border-slate-200 bg-white flex flex-col items-center justify-center overflow-hidden cursor-pointer hover:border-orange-400 hover:bg-orange-50/20 transition-all flex-shrink-0"
                                    >
                                        {idCardPreview ? (
                                            <img src={idCardPreview} alt="ID Card" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="flex flex-col items-center text-slate-400">
                                                <Icon name="plus" className="w-5 h-5" size={20} strokeWidth={2} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h6 className="text-xs font-black text-slate-700 truncate">
                                            {idCardFile ? idCardFile.name : (user?.id_card_image ? 'Ảnh CMND hiện tại' : 'Chưa đính kèm')}
                                        </h6>
                                        {idCardPreview && (
                                            <button
                                                type="button"
                                                onClick={() => removeFile('id_card')}
                                                className="text-[9px] font-black text-red-500 uppercase tracking-widest mt-1.5 hover:text-red-600 transition-colors flex items-center gap-1 border-none bg-transparent cursor-pointer"
                                            >
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
                            </div>

                            {/* Contract Box */}
                            <div className="flex flex-col">
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.1em] mb-2">Ảnh hợp đồng lao động</label>
                                <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 relative">
                                    <div
                                        onClick={() => contractInputRef.current?.click()}
                                        className="w-16 h-16 rounded-xl border border-dashed border-slate-200 bg-white flex flex-col items-center justify-center overflow-hidden cursor-pointer hover:border-orange-400 hover:bg-orange-50/20 transition-all flex-shrink-0"
                                    >
                                        {contractPreview ? (
                                            <img src={contractPreview} alt="Contract" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="flex flex-col items-center text-slate-400">
                                                <Icon name="plus" className="w-5 h-5" size={20} strokeWidth={2} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h6 className="text-xs font-black text-slate-700 truncate">
                                            {contractFile ? contractFile.name : (user?.contract_image ? 'Ảnh hợp đồng hiện tại' : 'Chưa đính kèm')}
                                        </h6>
                                        {contractPreview && (
                                            <button
                                                type="button"
                                                onClick={() => removeFile('contract')}
                                                className="text-[9px] font-black text-red-500 uppercase tracking-widest mt-1.5 hover:text-red-600 transition-colors flex items-center gap-1 border-none bg-transparent cursor-pointer"
                                            >
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
                            </div>

                        </div>
                    </div>

                    {/* Sticky Save / Action Bar */}
                    <div className="pt-6 border-t border-slate-100 flex items-center gap-4">
                        <button
                            type="button"
                            onClick={() => navigate('/admin/personnel')}
                            disabled={submitting}
                            className="flex-1 py-3.5 bg-slate-100 text-slate-500 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95 disabled:opacity-50 border-none cursor-pointer"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 py-3.5 bg-orange-500 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-orange-600 transition-all shadow-xl shadow-orange-500/25 disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2 border-none cursor-pointer"
                        >
                            {submitting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                    <span>Đang xử lý...</span>
                                </>
                            ) : (
                                isEditMode ? 'Lưu thay đổi' : 'Tạo hồ sơ'
                            )}
                        </button>
                    </div>

                </div>

            </form>

        </div>
    );
};

export default EmployeeFormPage;
