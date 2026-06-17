import React from 'react';
import { useUserProfile } from '../hooks/useUserProfile';
import DocumentUploadCard from '../components/profile/DocumentUploadCard';
import FlexibleShiftCalendar from '../components/profile/FlexibleShiftCalendar';
import LeaveRegistrySection from '../components/profile/LeaveRegistrySection';
import Icon from '../components/shared/Icon';

// [WHY] Orchestrator page for Employee personal profile management.
// Delegates data management, hooks state processing, validation, and APIs completely to useUserProfile hook.
const UserProfilePage = () => {
    const {
        loading,
        user,
        leaves,
        name, setName,
        email, setEmail,
        phone, setPhone,
        address, setAddress,
        dateOfBirth, setDateOfBirth,
        password, setPassword,
        workShift, setWorkShift,
        avatarPreview,
        fileInputRef,
        idCardPreview,
        contractPreview,
        lightboxImage, setLightboxImage,
        showLeaveForm, setShowLeaveForm,
        startDate, setStartDate,
        endDate, setEndDate,
        leaveType, setLeaveType,
        reason, setReason,
        submittingLeave,
        submittingProfile,
        registrationMode, setRegistrationMode,
        flexibleShifts,
        selectedCalendarDate, setSelectedCalendarDate,
        isDateOnLeave,
        isDateInPast,
        handleSelectDayShift,
        handleAvatarChange,
        handleIdCardFileChange,
        handleContractFileChange,
        handleRemoveIdCard,
        handleRemoveContract,
        handleUpdateProfile,
        handleCreateLeave,
        handleCancelLeave,
        formatCurrency,
        formatDate,
        getRoleLabel
    } = useUserProfile();

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
            <h4 className="text-base font-bold text-slate-900 tracking-tight">Trang cá nhân</h4>

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
                                <Icon name="camera" className="w-6 h-6 text-white" size={24} strokeWidth={2.5} />
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleAvatarChange}
                                className="hidden"
                                accept="image/*"
                            />
                        </div>

                        <h4 className="text-slate-900 mt-4 uppercase tracking-tight truncate max-w-full font-bold">
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
                        <h5 className="text-orange-500 tracking-widest pb-2 border-b border-orange-50">
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

                                {/* Mode Selector */}
                                <div className="flex items-center gap-1 mb-3 bg-slate-100 p-1 rounded-xl w-fit">
                                    <button
                                        type="button"
                                        onClick={() => setRegistrationMode('fixed')}
                                        className={`px-3.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border-none cursor-pointer ${registrationMode === 'fixed'
                                            ? 'bg-white text-orange-600 shadow-sm'
                                            : 'text-slate-500 hover:text-slate-700 bg-transparent'
                                            }`}
                                    >
                                        Ca cố định
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setRegistrationMode('flexible')}
                                        className={`px-3.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border-none cursor-pointer ${registrationMode === 'flexible'
                                            ? 'bg-white text-orange-600 shadow-sm'
                                            : 'text-slate-500 hover:text-slate-700 bg-transparent'
                                            }`}
                                    >
                                        Ca linh hoạt
                                    </button>
                                </div>

                                {registrationMode === 'fixed' ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div
                                            type="button"
                                            onClick={() => setWorkShift('Ca sáng')}
                                            className={`p-4 rounded-xl border-2 cursor-pointer flex flex-col items-center justify-center text-center transition-all ${workShift === 'Ca sáng'
                                                ? 'border-orange-500 bg-orange-50/30 text-orange-600 shadow-sm'
                                                : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50 text-slate-500 hover:border-slate-200'
                                                }`}
                                        >
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1.5 transition-colors flex-shrink-0 ${workShift === 'Ca sáng' ? 'bg-orange-100 text-orange-500' : 'bg-slate-100 text-slate-400'
                                                }`}>
                                                <Icon name="sun" className="w-4.5 h-4.5" size={18} strokeWidth={2.5} />
                                            </div>
                                            <span className="text-xs font-black uppercase tracking-wider">Ca sáng</span>
                                            <span className="text-[9px] text-slate-400 font-medium mt-0.5">Ca làm việc sáng</span>
                                        </div>
                                        <div
                                            type="button"
                                            onClick={() => setWorkShift('Ca tối')}
                                            className={`p-4 rounded-xl border-2 cursor-pointer flex flex-col items-center justify-center text-center transition-all ${workShift === 'Ca tối'
                                                ? 'border-orange-500 bg-orange-50/30 text-orange-600 shadow-sm'
                                                : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50 text-slate-500 hover:border-slate-200'
                                                }`}
                                        >
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1.5 transition-colors flex-shrink-0 ${workShift === 'Ca tối' ? 'bg-indigo-100 text-indigo-500' : 'bg-slate-100 text-slate-400'
                                                }`}>
                                                <Icon name="moon" className="w-4.5 h-4.5" size={18} strokeWidth={2.5} />
                                            </div>
                                            <span className="text-xs font-black uppercase tracking-wider">Ca tối</span>
                                            <span className="text-[9px] text-slate-400 font-medium mt-0.5">Ca làm việc tối</span>
                                        </div>
                                        <div
                                            type="button"
                                            onClick={() => setWorkShift('Ca full time')}
                                            className={`p-4 rounded-xl border-2 cursor-pointer flex flex-col items-center justify-center text-center transition-all ${workShift === 'Ca full time'
                                                ? 'border-orange-500 bg-orange-50/30 text-orange-600 shadow-sm'
                                                : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50 text-slate-500 hover:border-slate-200'
                                                }`}
                                        >
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1.5 transition-colors flex-shrink-0 ${workShift === 'Ca full time' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
                                                }`}>
                                                <Icon name="briefcase" className="w-4.5 h-4.5" size={18} strokeWidth={2.5} />
                                            </div>
                                            <span className="text-xs font-black uppercase tracking-wider">Ca full time</span>
                                            <span className="text-[9px] text-slate-400 font-medium mt-0.5">Ca làm việc cả ngày</span>
                                        </div>
                                    </div>
                                ) : (
                                    <FlexibleShiftCalendar
                                        flexibleShifts={flexibleShifts}
                                        selectedCalendarDate={selectedCalendarDate}
                                        setSelectedCalendarDate={setSelectedCalendarDate}
                                        handleSelectDayShift={handleSelectDayShift}
                                        isDateOnLeave={isDateOnLeave}
                                        isDateInPast={isDateInPast}
                                    />
                                )}
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
                                    <DocumentUploadCard
                                        label="Ảnh CMND / CCCD"
                                        placeholderLabel="CMND/CCCD"
                                        preview={idCardPreview}
                                        onFileChange={handleIdCardFileChange}
                                        onRemove={handleRemoveIdCard}
                                        onZoom={setLightboxImage}
                                    />
                                    <DocumentUploadCard
                                        label="Ảnh hợp đồng lao động"
                                        placeholderLabel="Hợp đồng lao động"
                                        preview={contractPreview}
                                        onFileChange={handleContractFileChange}
                                        onRemove={handleRemoveContract}
                                        onZoom={setLightboxImage}
                                    />
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

                    <LeaveRegistrySection
                        leaves={leaves}
                        showLeaveForm={showLeaveForm}
                        setShowLeaveForm={setShowLeaveForm}
                        startDate={startDate}
                        setStartDate={setStartDate}
                        endDate={endDate}
                        setEndDate={setEndDate}
                        leaveType={leaveType}
                        setLeaveType={setLeaveType}
                        reason={reason}
                        setReason={setReason}
                        submittingLeave={submittingLeave}
                        handleCreateLeave={handleCreateLeave}
                        handleCancelLeave={handleCancelLeave}
                    />
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

export default UserProfilePage;
