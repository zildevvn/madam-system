import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { updateUserInStore } from '../store/slices/authSlice';
import toast from 'react-hot-toast';
import imageCompression from 'browser-image-compression';
import { getUserByIdApi, updateUserApi } from '../services/userService';
import { getLeaveRequestsApi, createLeaveRequestApi } from '../services/leaveService';

const UserProfilePage = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { user: currentUser } = useAppSelector(state => state.auth);

    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [leaves, setLeaves] = useState([]);

    // Editable States
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [password, setPassword] = useState('');
    const [workShift, setWorkShift] = useState('');
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState('');
    const fileInputRef = useRef(null);

    // Document States
    const [idCardFile, setIdCardFile] = useState(null);
    const [idCardPreview, setIdCardPreview] = useState('');
    const idCardInputRef = useRef(null);
    const [removeIdCard, setRemoveIdCard] = useState(false);

    const [contractFile, setContractFile] = useState(null);
    const [contractPreview, setContractPreview] = useState('');
    const contractInputRef = useRef(null);
    const [removeContract, setRemoveContract] = useState(false);

    // Lightbox for Document Previews
    const [lightboxImage, setLightboxImage] = useState(null);

    // Leave registration states
    const [showLeaveForm, setShowLeaveForm] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [leaveType, setLeaveType] = useState('paid');
    const [reason, setReason] = useState('');
    const [submittingLeave, setSubmittingLeave] = useState(false);
    const [submittingProfile, setSubmittingProfile] = useState(false);

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

    const fetchProfileAndLeaves = async () => {
        if (!currentUser) return;
        try {
            const [userRes, leaveRes] = await Promise.all([
                getUserByIdApi(currentUser.id),
                getLeaveRequestsApi(currentUser.id)
            ]);

            const userData = userRes.data;
            setUser(userData);
            setLeaves(leaveRes.data);

            // Populate form fields
            setName(userData.name || '');
            setEmail(userData.email || '');
            setPhone(userData.phone || '');
            setAddress(userData.address || '');
            setDateOfBirth(userData.date_of_birth ? userData.date_of_birth.split('T')[0] : '');
            setWorkShift(userData.work_shift || 'Ca sáng');
            
            if (userData.photo) {
                setAvatarPreview(`/storage/${userData.photo}`);
            }

            setIdCardPreview(userData.id_card_image ? `/storage/${userData.id_card_image}` : '');
            setIdCardFile(null);
            setRemoveIdCard(false);

            setContractPreview(userData.contract_image ? `/storage/${userData.contract_image}` : '');
            setContractFile(null);
            setRemoveContract(false);
        } catch (err) {
            console.error('Failed to load profile details:', err);
            toast.error('Không thể tải thông tin trang cá nhân');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfileAndLeaves();
        const today = new Date().toISOString().split('T')[0];
        setStartDate(today);
        setEndDate(today);

        return () => {
            // Clean up avatar preview URL
            if (avatarPreview && avatarPreview.startsWith('blob:')) {
                URL.revokeObjectURL(avatarPreview);
            }
            if (idCardPreview && idCardPreview.startsWith('blob:')) {
                URL.revokeObjectURL(idCardPreview);
            }
            if (contractPreview && contractPreview.startsWith('blob:')) {
                URL.revokeObjectURL(contractPreview);
            }
        };
    }, [currentUser]);

    const handleAvatarChange = async (e) => {
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

        if (avatarPreview && avatarPreview.startsWith('blob:')) {
            URL.revokeObjectURL(avatarPreview);
        }

        setAvatarFile(processedFile);
        const url = URL.createObjectURL(processedFile);
        setAvatarPreview(url);

        e.target.value = '';
    };

    const handleIdCardChange = async (e) => {
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
        const toastId = toast.loading('Đang nén ảnh CMND/CCCD...');
        try {
            processedFile = await imageCompression(file, options);
        } catch (error) {
            console.error('Image compression failed:', error);
        } finally {
            toast.dismiss(toastId);
        }

        if (idCardPreview && idCardPreview.startsWith('blob:')) {
            URL.revokeObjectURL(idCardPreview);
        }

        setIdCardFile(processedFile);
        const url = URL.createObjectURL(processedFile);
        setIdCardPreview(url);
        setRemoveIdCard(false);

        e.target.value = '';
    };

    const handleContractChange = async (e) => {
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
        const toastId = toast.loading('Đang nén ảnh hợp đồng...');
        try {
            processedFile = await imageCompression(file, options);
        } catch (error) {
            console.error('Image compression failed:', error);
        } finally {
            toast.dismiss(toastId);
        }

        if (contractPreview && contractPreview.startsWith('blob:')) {
            URL.revokeObjectURL(contractPreview);
        }

        setContractFile(processedFile);
        const url = URL.createObjectURL(processedFile);
        setContractPreview(url);
        setRemoveContract(false);

        e.target.value = '';
    };

    const handleRemoveIdCard = () => {
        if (idCardPreview && idCardPreview.startsWith('blob:')) {
            URL.revokeObjectURL(idCardPreview);
        }
        setIdCardFile(null);
        setIdCardPreview('');
        setRemoveIdCard(true);
    };

    const handleRemoveContract = () => {
        if (contractPreview && contractPreview.startsWith('blob:')) {
            URL.revokeObjectURL(contractPreview);
        }
        setContractFile(null);
        setContractPreview('');
        setRemoveContract(true);
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();

        if (!name || !email) {
            toast.error('Họ tên và email là bắt buộc');
            return;
        }

        setSubmittingProfile(true);
        try {
            const formData = new FormData();
            formData.append('_method', 'PUT'); // Bypass laravel multipart/form-data limitations
            formData.append('name', name);
            formData.append('email', email);
            formData.append('phone', phone);
            formData.append('address', address);
            formData.append('date_of_birth', dateOfBirth);
            formData.append('work_shift', workShift);

            if (password) {
                formData.append('password', password);
            }
            if (avatarFile) {
                formData.append('photo', avatarFile);
            }

            if (idCardFile) {
                formData.append('id_card_image', idCardFile);
            }
            if (removeIdCard) {
                formData.append('remove_id_card_image', '1');
            }

            if (contractFile) {
                formData.append('contract_image', contractFile);
            }
            if (removeContract) {
                formData.append('remove_contract_image', '1');
            }

            const response = await updateUserApi(currentUser.id, formData);
            const updatedUser = response.data;
            toast.success('Cập nhật trang cá nhân thành công!');

            // Sync with auth Redux store to update header avatar/name
            dispatch(updateUserInStore(updatedUser));

            setPassword('');
            fetchProfileAndLeaves();
        } catch (err) {
            console.error('Failed to update profile:', err);
            const msg = err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật';
            toast.error(msg);
        } finally {
            setSubmittingProfile(false);
        }
    };

    const handleCreateLeave = async (e) => {
        e.preventDefault();

        if (new Date(startDate) > new Date(endDate)) {
            toast.error('Ngày bắt đầu không được lớn hơn ngày kết thúc');
            return;
        }

        setSubmittingLeave(true);
        try {
            await createLeaveRequestApi({
                user_id: currentUser.id,
                start_date: startDate,
                end_date: endDate,
                leave_type: leaveType,
                reason: reason
            });

            toast.success('Đăng ký xin nghỉ phép thành công!');
            setShowLeaveForm(false);
            setReason('');
            fetchProfileAndLeaves();
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
            default: return 'bg-amber-50 text-amber-600';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'approved': return 'Đã duyệt';
            case 'rejected': return 'Từ chối';
            default: return 'Chờ duyệt';
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] py-20 bg-white rounded-[32px] border border-slate-100 shadow-sm animate-pulse">
                <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-orange-500 animate-spin mb-4"></div>
                <p className="text-slate-400 font-bold text-xs tracking-widest uppercase">Đang tải trang cá nhân...</p>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="space-y-4 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
            <h3 className="text-base font-bold text-slate-900 tracking-tight uppercase">Trang cá nhân</h3>

            {/* Profile Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Side Column */}
                <div className="lg:col-span-1 space-y-6">

                    {/* User Card */}
                    <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 flex flex-col items-center text-center relative overflow-hidden">

                        {/* Status Badge */}
                        <div className="absolute top-4 right-4">
                            {user.status === 'active' ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-wider">
                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                    Đang làm việc
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-wider">
                                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                                    Đã nghỉ việc
                                </span>
                            )}
                        </div>

                        {/* Interactive Avatar Upload Container */}
                        <div
                            onClick={() => fileInputRef.current.click()}
                            className="mt-6 w-28 h-28 rounded-full border-4 border-slate-50 bg-slate-100 shadow-inner flex items-center justify-center overflow-hidden cursor-pointer relative group flex-shrink-0"
                        >
                            {avatarPreview ? (
                                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover group-hover:scale-105 transition-all" />
                            ) : (
                                <div className="text-slate-300 flex items-center justify-center text-5xl font-black uppercase">
                                    {user.name?.[0]}
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleAvatarChange}
                                className="hidden"
                                accept="image/*"
                            />
                        </div>

                        <h4 className="text-slate-900 mt-4 uppercase tracking-tight truncate max-w-full">
                            {user.name}
                        </h4>
                        <span className="text-[10px] px-3 py-1 rounded-full bg-orange-100 text-orange-600 font-bold uppercase tracking-wider mt-1">
                            {getRoleLabel(user.role)}
                        </span>

                        <div className="w-full border-t border-slate-100 mt-6 pt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-4 lg:gap-6 text-left">
                            <div>
                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest block">Ca làm việc</span>
                                <span className="text-sm font-black text-slate-700">{user.work_shift || 'Chưa cập nhật'}</span>
                            </div>
                            <div>
                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest block">Mức lương cơ bản</span>
                                <span className="text-sm font-black text-slate-700">{formatCurrency(user.salary)}</span>
                            </div>
                            <div className="col-span-2 sm:col-span-1">
                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest block">Ngày bắt đầu</span>
                                <span className="text-sm font-black text-slate-700">{formatDate(user.join_date)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side Column */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Settings Form */}
                    <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 space-y-6">
                        <h5 className="text-orange-500 uppercase tracking-widest pb-2 border-b border-orange-50">
                            Cập nhật thông tin cá nhân
                        </h5>

                        <form onSubmit={handleUpdateProfile} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Họ và tên <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="text-sm w-full bg-slate-50 border-none rounded-xl p-3 text-slate-900 font-bold focus:ring-4 focus:ring-orange-500/10 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Email liên hệ <span className="text-red-500">*</span></label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="text-sm w-full bg-slate-50 border-none rounded-xl p-3 text-slate-900 font-bold focus:ring-4 focus:ring-orange-500/10 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Số điện thoại</label>
                                    <input
                                        type="text"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="text-sm w-full bg-slate-50 border-none rounded-xl p-3 text-slate-900 font-bold focus:ring-4 focus:ring-orange-500/10 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Ngày sinh</label>
                                    <input
                                        type="date"
                                        value={dateOfBirth}
                                        onChange={(e) => setDateOfBirth(e.target.value)}
                                        className="text-sm w-full bg-slate-50 border-none rounded-xl p-3 text-slate-900 font-bold focus:ring-4 focus:ring-orange-500/10 transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Địa chỉ thường trú</label>
                                <input
                                    type="text"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    className="text-sm w-full bg-slate-50 border-none rounded-xl p-3 text-slate-900 font-bold focus:ring-4 focus:ring-orange-500/10 transition-all"
                                />
                            </div>

                            <div className="pt-2 border-t border-slate-50">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">Đăng ký ca làm việc</label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div 
                                        type="button"
                                        onClick={() => setWorkShift('Ca sáng')}
                                        className={`p-4 rounded-xl border-2 cursor-pointer flex flex-col items-center justify-center text-center transition-all ${
                                            workShift === 'Ca sáng' 
                                            ? 'border-orange-500 bg-orange-50/30 text-orange-600 shadow-sm' 
                                            : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50 text-slate-500 hover:border-slate-200'
                                        }`}
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1.5 transition-colors ${
                                            workShift === 'Ca sáng' ? 'bg-orange-100 text-orange-500' : 'bg-slate-100 text-slate-400'
                                        }`}>
                                            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 3v1m0 16v1m9-9h-1M4 9h-1m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" /></svg>
                                        </div>
                                        <span className="text-xs font-black uppercase tracking-wider">Ca sáng</span>
                                        <span className="text-[9px] text-slate-400 font-medium mt-0.5">Ca làm việc sáng</span>
                                    </div>
                                    <div 
                                        type="button"
                                        onClick={() => setWorkShift('Ca tối')}
                                        className={`p-4 rounded-xl border-2 cursor-pointer flex flex-col items-center justify-center text-center transition-all ${
                                            workShift === 'Ca tối' 
                                            ? 'border-orange-500 bg-orange-50/30 text-orange-600 shadow-sm' 
                                            : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50 text-slate-500 hover:border-slate-200'
                                        }`}
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1.5 transition-colors ${
                                            workShift === 'Ca tối' ? 'bg-indigo-100 text-indigo-500' : 'bg-slate-100 text-slate-400'
                                        }`}>
                                            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                                        </div>
                                        <span className="text-xs font-black uppercase tracking-wider">Ca tối</span>
                                        <span className="text-[9px] text-slate-400 font-medium mt-0.5">Ca làm việc tối</span>
                                    </div>
                                    <div 
                                        type="button"
                                        onClick={() => setWorkShift('Ca full time')}
                                        className={`p-4 rounded-xl border-2 cursor-pointer flex flex-col items-center justify-center text-center transition-all ${
                                            workShift === 'Ca full time' 
                                            ? 'border-orange-500 bg-orange-50/30 text-orange-600 shadow-sm' 
                                            : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50 text-slate-500 hover:border-slate-200'
                                        }`}
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1.5 transition-colors ${
                                            workShift === 'Ca full time' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
                                        }`}>
                                            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                        </div>
                                        <span className="text-xs font-black uppercase tracking-wider">Ca full time</span>
                                        <span className="text-[9px] text-slate-400 font-medium mt-0.5">Ca làm việc cả ngày</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2 border-t border-slate-50">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Đổi mật khẩu mới (Bỏ trống nếu giữ nguyên)</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Nhập mật khẩu bảo mật mới của bạn..."
                                    className="text-sm w-full bg-slate-50 border-none rounded-xl p-3 text-slate-900 font-medium placeholder:text-slate-300 focus:ring-4 focus:ring-orange-500/10 transition-all"
                                />
                            </div>

                            {/* Document Upload Section */}
                            <div className="pt-4 border-t border-slate-50 space-y-4">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Hồ sơ tài liệu cá nhân</label>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    {/* ID Card Document Upload */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Ảnh CMND / CCCD</span>
                                            {idCardPreview && (
                                                <button
                                                    type="button"
                                                    onClick={handleRemoveIdCard}
                                                    className="text-red-500 hover:text-red-700 text-[10px] font-bold uppercase transition-colors border-none bg-transparent cursor-pointer"
                                                >
                                                    Gỡ bỏ
                                                </button>
                                            )}
                                        </div>

                                        <div className="relative group rounded-2xl border-2 border-dashed border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-orange-200 transition-all overflow-hidden flex flex-col items-center justify-center p-4 min-h-[140px] text-center">
                                            {idCardPreview ? (
                                                <div className="relative w-full h-full flex flex-col items-center gap-2">
                                                    <img 
                                                        src={idCardPreview} 
                                                        alt="ID Card Preview" 
                                                        className="h-24 w-auto object-cover rounded-xl shadow-sm cursor-zoom-in hover:scale-105 transition-all"
                                                        onClick={() => setLightboxImage(idCardPreview)}
                                                    />
                                                    <span className="text-[9px] text-slate-400 font-medium">Nhấp vào hình ảnh để xem lớn</span>
                                                    
                                                    <button
                                                        type="button"
                                                        onClick={() => idCardInputRef.current.click()}
                                                        className="px-3 py-1 bg-white border border-slate-200 text-slate-600 hover:border-orange-500 hover:text-orange-500 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all shadow-sm active:scale-95 cursor-pointer mt-1"
                                                    >
                                                        Thay thế ảnh
                                                    </button>
                                                </div>
                                            ) : (
                                                <div 
                                                    onClick={() => idCardInputRef.current.click()}
                                                    className="w-full h-full flex flex-col items-center justify-center cursor-pointer py-4"
                                                >
                                                    <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                    </div>
                                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Tải lên ảnh CMND/CCCD</span>
                                                    <span className="text-[9px] text-slate-400 mt-1 font-medium">Định dạng JPG, PNG dưới 1MB</span>
                                                </div>
                                            )}

                                            <input 
                                                type="file" 
                                                ref={idCardInputRef}
                                                onChange={handleIdCardChange}
                                                accept="image/*"
                                                className="hidden"
                                            />
                                        </div>
                                    </div>

                                    {/* Contract Document Upload */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Ảnh hợp đồng lao động</span>
                                            {contractPreview && (
                                                <button
                                                    type="button"
                                                    onClick={handleRemoveContract}
                                                    className="text-red-500 hover:text-red-700 text-[10px] font-bold uppercase transition-colors border-none bg-transparent cursor-pointer"
                                                >
                                                    Gỡ bỏ
                                                </button>
                                            )}
                                        </div>

                                        <div className="relative group rounded-2xl border-2 border-dashed border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-orange-200 transition-all overflow-hidden flex flex-col items-center justify-center p-4 min-h-[140px] text-center">
                                            {contractPreview ? (
                                                <div className="relative w-full h-full flex flex-col items-center gap-2">
                                                    <img 
                                                        src={contractPreview} 
                                                        alt="Contract Preview" 
                                                        className="h-24 w-auto object-cover rounded-xl shadow-sm cursor-zoom-in hover:scale-105 transition-all"
                                                        onClick={() => setLightboxImage(contractPreview)}
                                                    />
                                                    <span className="text-[9px] text-slate-400 font-medium">Nhấp vào hình ảnh để xem lớn</span>
                                                    
                                                    <button
                                                        type="button"
                                                        onClick={() => contractInputRef.current.click()}
                                                        className="px-3 py-1 bg-white border border-slate-200 text-slate-600 hover:border-orange-500 hover:text-orange-500 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all shadow-sm active:scale-95 cursor-pointer mt-1"
                                                    >
                                                        Thay thế ảnh
                                                    </button>
                                                </div>
                                            ) : (
                                                <div 
                                                    onClick={() => contractInputRef.current.click()}
                                                    className="w-full h-full flex flex-col items-center justify-center cursor-pointer py-4"
                                                >
                                                    <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                    </div>
                                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Tải lên ảnh Hợp đồng</span>
                                                    <span className="text-[9px] text-slate-400 mt-1 font-medium">Định dạng JPG, PNG dưới 1MB</span>
                                                </div>
                                            )}

                                            <input 
                                                type="file" 
                                                ref={contractInputRef}
                                                onChange={handleContractChange}
                                                accept="image/*"
                                                className="hidden"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-2 border-t border-slate-50 w-full">
                                <button
                                    type="submit"
                                    disabled={submittingProfile}
                                    className="w-full sm:w-auto px-6 py-3.5 sm:py-3 bg-orange-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 transition-all active:scale-95 disabled:opacity-50 border-none cursor-pointer flex items-center justify-center text-center"
                                >
                                    {submittingProfile ? 'Đang lưu...' : 'Lưu thay đổi'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Day Off Registry Card */}
                    <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-50">
                            <h5 className="text-slate-400 uppercase tracking-widest text-[10px] sm:text-xs font-black">
                                Đăng ký & Lịch sử nghỉ phép
                            </h5>
                            <button
                                onClick={() => setShowLeaveForm(!showLeaveForm)}
                                className="w-full sm:w-auto text-center px-3 py-2 bg-orange-50 text-orange-600 hover:bg-orange-500 hover:text-white rounded-lg font-black text-[9px] uppercase tracking-wider transition-all border-none cursor-pointer flex items-center justify-center"
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
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                            <input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                className="text-xs w-full bg-white border-none rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-orange-500/10 font-bold"
                                            />
                                            <span className="text-slate-400 text-[10px] font-black uppercase tracking-wider text-center block sm:inline py-0.5">đến</span>
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
                                <div className="flex justify-end pt-1 w-full">
                                    <button
                                        type="submit"
                                        disabled={submittingLeave}
                                        className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-orange-500 text-white rounded-lg font-black text-[9px] uppercase tracking-wider hover:bg-orange-600 transition-all border-none cursor-pointer flex items-center justify-center text-center"
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
                                            <svg className="w-4 h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        </div>
                                    );

                                    if (leave.status === 'approved') {
                                        statusBgColor = 'bg-emerald-50/20 border-emerald-100 hover:border-emerald-200';
                                        statusBorderLeft = 'border-l-4 border-l-emerald-500';
                                        badgeStyle = 'bg-emerald-100 text-emerald-800 border-emerald-200/50';
                                        statusIcon = (
                                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 shadow-sm shadow-emerald-500/10">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                                            </div>
                                        );
                                    } else if (leave.status === 'rejected') {
                                        statusBgColor = 'bg-red-50/20 border-red-100 hover:border-red-200';
                                        statusBorderLeft = 'border-l-4 border-l-red-500';
                                        badgeStyle = 'bg-red-100 text-red-800 border-red-200/50';
                                        statusIcon = (
                                            <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0 shadow-sm shadow-red-500/10">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div 
                                            key={leave.id} 
                                            className={`p-4 rounded-2xl border transition-all ${statusBgColor} ${statusBorderLeft} flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:shadow-md hover:shadow-slate-500/5`}
                                        >
                                            <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
                                                {statusIcon}
                                                <div className="space-y-0.5 min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center gap-1.5">
                                                        <span className="text-xs font-black text-slate-800 tracking-tight">
                                                            {formatDateStr(leave.start_date)} - {formatDateStr(leave.end_date)}
                                                        </span>
                                                        <span className="text-[10px] text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200/50">
                                                            {totalDays} ngày
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-600 font-medium truncate max-w-full sm:max-w-xs" title={leave.reason}>
                                                        Lý do: <span className="text-slate-500 italic">{leave.reason || 'Không ghi lý do'}</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 pt-2 sm:pt-0 border-t border-dashed border-slate-200/50 sm:border-none w-full sm:w-auto flex-shrink-0 text-right">
                                                <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${badgeStyle}`}>
                                                    {getStatusText(leave.status)}
                                                </span>
                                                {leave.status !== 'pending' && leave.approver && (
                                                    <span className="text-[8px] text-slate-400 font-bold flex items-center gap-1 mt-0 sm:mt-1.5">
                                                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                                        {leave.approver.name}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-xs text-slate-400 italic text-center py-4">Bạn chưa đăng ký yêu cầu nghỉ phép nào</p>
                        )}
                    </div>
                </div>

            </div>

            {/* Document Lightbox */}
            {lightboxImage && (
                <div 
                    onClick={() => setLightboxImage(null)}
                    className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-200"
                >
                    <div className="max-w-4xl max-h-[90vh] relative">
                        <img src={lightboxImage} alt="Zoomed Document" className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-200" />
                        <button 
                            onClick={() => setLightboxImage(null)}
                            className="absolute top-4 right-4 bg-black/50 hover:bg-black/75 text-white w-10 h-10 rounded-full flex items-center justify-center transition-colors border-none cursor-pointer"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
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

export default UserProfilePage;
