import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Icon from '../shared/Icon';

const PartnerCompanyFormModal = ({ isOpen, onClose, onSubmit, company = null, processing = false }) => {
    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        defaultValues: {
            name: '',
            phone: '',
            email: '',
            address: '',
            notes: ''
        }
    });

    useEffect(() => {
        if (isOpen) {
            reset(company ? {
                name: company.name || '',
                phone: company.phone || '',
                email: company.email || '',
                address: company.address || '',
                notes: company.notes || ''
            } : {
                name: '',
                phone: '',
                email: '',
                address: '',
                notes: ''
            });
        }
    }, [company, isOpen, reset]);

    if (!isOpen) return null;

    const onFormSubmit = (data) => {
        onSubmit(data);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                    <h4 className="mb-0 text-lg font-black text-slate-800 uppercase tracking-wide">
                        {company ? 'Chỉnh sửa đối tác' : 'Thêm đối tác mới'}
                    </h4>

                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors border-none bg-transparent cursor-pointer" type="button">
                        <Icon name="close" className="w-6 h-6" size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onFormSubmit)} className="px-6 py-4 space-y-4">
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Tên Đối tác / Doanh nghiệp <span className="text-red-500">*</span></label>
                        <input
                            {...register('name', { required: 'Tên đối tác là bắt buộc' })}
                            type="text"
                            className="text-[14px] w-full bg-gray-100 border-none rounded-xl px-4 py-2.5 text-gray-900 font-bold placeholder:text-gray-300 focus:ring-2 focus:ring-orange-500/20 transition-all"
                            placeholder="Vd: Công ty Du lịch VM Travel"
                        />
                        {errors.name && <p className="text-red-500 text-xs mt-1 font-bold">{errors.name.message}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Số điện thoại</label>
                            <input
                                {...register('phone')}
                                type="text"
                                className="text-[14px] w-full bg-gray-100 border-none rounded-xl px-4 py-2.5 text-gray-900 font-bold placeholder:text-gray-300 focus:ring-2 focus:ring-orange-500/20 transition-all"
                                placeholder="Vd: 0905123456"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Email</label>
                            <input
                                {...register('email')}
                                type="email"
                                className="text-[14px] w-full bg-gray-100 border-none rounded-xl px-4 py-2.5 text-gray-900 font-bold placeholder:text-gray-300 focus:ring-2 focus:ring-orange-500/20 transition-all"
                                placeholder="Vd: contact@vmtravel.com.vn"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Địa chỉ</label>
                        <input
                            {...register('address')}
                            type="text"
                            className="text-[14px] w-full bg-gray-100 border-none rounded-xl px-4 py-2.5 text-gray-900 font-bold placeholder:text-gray-300 focus:ring-2 focus:ring-orange-500/20 transition-all"
                            placeholder="Vd: 123 Nguyễn Huệ, Quận 1, TP. HCM"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Ghi chú</label>
                        <textarea
                            {...register('notes')}
                            rows={3}
                            className="text-[14px] w-full bg-gray-100 border-none rounded-xl px-4 py-2.5 text-gray-900 font-bold placeholder:text-gray-300 focus:ring-2 focus:ring-orange-500/20 transition-all resize-none"
                            placeholder="Thông tin thêm..."
                        />
                    </div>

                    <div className="pt-2 flex items-center gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="mdt-btn !text-gray-500 !bg-gray-100 transition-all w-full"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full mdt-btn shadow-lg shadow-orange-500/20 transition-all disabled:opacity-50"
                        >
                            {processing ? 'Đang xử lý...' : company ? 'Lưu thay đổi' : 'Tạo đối tác'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PartnerCompanyFormModal;
