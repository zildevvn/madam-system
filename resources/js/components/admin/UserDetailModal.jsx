import React, { useState } from 'react';
import Icon from '../shared/Icon';

const UserDetailModal = ({ isOpen, onClose, user, roles }) => {
    if (!isOpen || !user) return null;

    const [lightboxImage, setLightboxImage] = useState(null);

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

    return (
        <>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm overflow-y-auto">
                <div className="bg-white rounded-[24px] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col my-8 max-h-[90vh]">
                    
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0 bg-slate-50/50">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-[22px] bg-orange-500 border-2 border-white shadow-md flex items-center justify-center text-sm font-black text-white uppercase ring-4 ring-orange-100">
                                {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </div>
                            <div>
                                <h4 className="text-gray-900 mb-0 font-black text-lg leading-tight uppercase tracking-tight">
                                    {user.name}
                                </h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 font-bold uppercase tracking-wider">
                                        {getRoleLabel(user.role)}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                        ID: #{user.id}
                                    </span>
                                </div>
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

                    {/* Details Body */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                        
                        {/* Grid for Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            
                            {/* Left Side: Personal Info */}
                            <div className="space-y-4">
                                <h5 className="text-[11px] font-black text-orange-500 uppercase tracking-[0.2em] pb-1 border-b border-orange-100">
                                    Thông tin cá nhân
                                </h5>
                                
                                <div className="space-y-3">
                                    <div>
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Email Đăng nhập</span>
                                        <span className="text-sm font-black text-slate-800 break-all">{user.email || 'Chưa cập nhật'}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Ngày sinh</span>
                                        <span className="text-sm font-black text-slate-800">{formatDate(user.date_of_birth)}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Địa chỉ thường trú</span>
                                        <span className="text-sm font-black text-slate-800">{user.address || 'Chưa cập nhật'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Right Side: Job Info */}
                            <div className="space-y-4">
                                <h5 className="text-[11px] font-black text-orange-500 uppercase tracking-[0.2em] pb-1 border-b border-orange-100">
                                    Thông tin công việc
                                </h5>
                                
                                <div className="space-y-3">
                                    <div>
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Ca làm việc</span>
                                        <span className="text-sm font-black text-slate-800">{user.work_shift || 'Chưa cập nhật'}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Mức lương</span>
                                        <span className="text-sm font-black text-slate-800">{formatCurrency(user.salary)}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Thưởng cố định</span>
                                        <span className="text-sm font-black text-green-600">{formatCurrency(user.bonus)}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Ngày bắt đầu làm</span>
                                        <span className="text-sm font-black text-slate-800">{formatDate(user.join_date)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section: Documents */}
                        <div className="space-y-4 pt-4 border-t border-slate-100">
                            <h5 className="text-[11px] font-black text-orange-500 uppercase tracking-[0.2em] pb-1 border-b border-orange-100">
                                Tài liệu hồ sơ đính kèm
                            </h5>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* ID Card */}
                                <div>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">Ảnh CMND / CCCD</span>
                                    {user.id_card_image ? (
                                        <div 
                                            onClick={() => setLightboxImage(`/storage/${user.id_card_image}`)}
                                            className="h-40 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 cursor-zoom-in hover:brightness-95 transition-all relative group"
                                        >
                                            <img src={`/storage/${user.id_card_image}`} alt="ID Card" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Icon name="search" className="w-8 h-8 text-white" size={32} />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="h-40 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-slate-400">
                                            <Icon name="image" className="w-8 h-8" size={32} />
                                            <span className="text-[10px] font-bold uppercase tracking-wider mt-2">Chưa đính kèm</span>
                                        </div>
                                    )}
                                </div>

                                {/* Contract */}
                                <div>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">Ảnh hợp đồng lao động</span>
                                    {user.contract_image ? (
                                        <div 
                                            onClick={() => setLightboxImage(`/storage/${user.contract_image}`)}
                                            className="h-40 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 cursor-zoom-in hover:brightness-95 transition-all relative group"
                                        >
                                            <img src={`/storage/${user.contract_image}`} alt="Contract" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Icon name="search" className="w-8 h-8 text-white" size={32} />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="h-40 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-slate-400">
                                            <Icon name="image" className="w-8 h-8" size={32} />
                                            <span className="text-[10px] font-bold uppercase tracking-wider mt-2">Chưa đính kèm</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Footer Actions */}
                    <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end flex-shrink-0 bg-slate-50/50">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 bg-orange-500 text-white rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-orange-600 transition-all active:scale-95"
                        >
                            Đóng
                        </button>
                    </div>
                </div>
            </div>

            {/* Lightbox for zooming images */}
            {lightboxImage && (
                <div 
                    onClick={() => setLightboxImage(null)}
                    className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-200"
                >
                    <div className="max-w-4xl max-h-[90vh] relative">
                        <img src={lightboxImage} alt="Zoomed Document" className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" />
                        <button 
                            onClick={() => setLightboxImage(null)}
                            className="absolute top-4 right-4 bg-black/50 hover:bg-black/75 text-white w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                        >
                            <Icon name="close" className="w-6 h-6" size={24} />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default UserDetailModal;
