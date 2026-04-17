import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';

const TableFormModal = ({ isOpen, onClose, onSubmit, table = null, processing = false }) => {
    const { register, handleSubmit, reset } = useForm({
        defaultValues: {
            name: '',
            status: 'available'
        }
    });

    useEffect(() => {
        if (isOpen) {
            reset(table ? {
                name: table.name || '',
                status: table.status || 'available'
            } : {
                name: '',
                status: 'available'
            });
        }
    }, [table, isOpen, reset]);

    if (!isOpen) return null;

    const onFormSubmit = (data) => {
        onSubmit(data);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-xl w-full max-w-md shadow-xl overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="px-3 py-4 border-b border-gray-50 flex items-center justify-between">
                    <h4 className="mb-0">
                        {table ? 'Chỉnh sửa bàn' : 'Thêm bàn mới'}
                    </h4>

                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors" type="button">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit(onFormSubmit)} className="px-3 py-4 space-y-4">
                    <div>
                        <label className="block text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-2">Tên bàn</label>
                        <input
                            {...register('name', { required: true })}
                            type="text"
                            className="text-[13px] w-full bg-gray-100 border-none rounded-xl px-4 py-3 text-gray-900 font-bold placeholder:text-gray-300 focus:ring-2 focus:ring-orange-500/20 transition-all"
                            placeholder="Vd: Bàn 01"
                        />
                    </div>

                    {table && (
                        <div>
                            <label className="block text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-2">Trạng thái</label>
                            <div className="relative group">
                                <select
                                    {...register('status')}
                                    className="text-[13px] w-full bg-gray-100 border-none rounded-xl px-4 py-3 text-gray-900 font-bold focus:ring-2 focus:ring-orange-500/20 transition-all appearance-none cursor-pointer pr-10"
                                >
                                    <option value="available">Trống (Empty)</option>
                                    <option value="busy">Đang bận (Busy)</option>
                                    <option value="maintenance">Bảo trì (Maintenance)</option>
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-gray-600 transition-colors">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="pt-4 flex items-center gap-4">
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
                            {processing ? 'Đang xử lý...' : table ? 'Lưu thay đổi' : 'Tạo bàn'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TableFormModal;
