import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';

const TableFormModal = ({ isOpen, onClose, onSubmit, table = null, processing = false }) => {
    const { register, handleSubmit, reset } = useForm({
        defaultValues: {
            name: ''
        }
    });

    useEffect(() => {
        if (isOpen) {
            reset(table ? {
                name: table.name || ''
            } : {
                name: ''
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
                            className="text-[16px] w-full bg-gray-100 border-none rounded-xl px-4 py-3 text-gray-900 font-bold placeholder:text-gray-300 focus:ring-2 focus:ring-orange-500/20 transition-all"
                            placeholder="Vd: Bàn 01"
                        />
                    </div>



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
