import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';

const ProductFormModal = ({ isOpen, onClose, onSubmit, categories, product = null, processing = false }) => {
    const { register, handleSubmit, reset } = useForm({
        defaultValues: {
            name: '',
            price: 0,
            type: 'food',
            category_id: '',
            image: ''
        }
    });

    useEffect(() => {
        if (isOpen) {
            reset(product ? {
                name: product.name || '',
                price: product.price || 0,
                type: product.type || 'food',
                category_id: product.category_id || '',
                image: product.image || ''
            } : {
                name: '',
                price: 0,
                type: 'food',
                category_id: categories.length > 0 ? categories[0].id : '',
                image: ''
            });
        }
    }, [product, isOpen, reset, categories]);

    const onFormSubmit = (data) => {
        onSubmit(data);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-[16px] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[80vh]">
                <div className="px-3 py-2 lg:px-6 lg:py-4 border-b border-gray-50 flex items-center justify-between flex-shrink-0">
                    <h4 className="text-gray-900 mb-0">
                        {product ? 'Chỉnh sửa món' : 'Thêm món mới'}
                    </h4>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-all" type="button">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit(onFormSubmit)} className="px-3 py-2 lg:px-6 lg:py-4 space-y-3 lg:space-y-4 overflow-y-auto custom-scrollbar flex-1 min-h-0">
                    <div>
                        <label className="block text-[11px] font-black text-gray-600 uppercase tracking-[0.2em] mb-2">Tên món</label>
                        <input
                            {...register('name', { required: true })}
                            type="text"
                            className="text-[14px] lg:text-[16px] w-full bg-slate-50 border-none rounded-xl p-2 lg:p-3 text-slate-900 font-bold placeholder:text-slate-300 focus:ring-4 focus:ring-orange-500/10 transition-all"
                            placeholder="Vd: Phở Bò Chín"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                        <div>
                            <label className="block text-[11px] font-black text-gray-600 uppercase tracking-[0.2em] mb-2">Giá (VND)</label>
                            <input
                                {...register('price', { required: true, valueAsNumber: true })}
                                type="number"
                                className="text-[14px] lg:text-[16px] w-full bg-slate-50 border-none rounded-xl p-2 lg:p-3 text-slate-900 font-bold placeholder:text-slate-300 focus:ring-4 focus:ring-orange-500/10 transition-all"
                                placeholder="0"
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-black text-gray-600 uppercase tracking-[0.2em] mb-2">Loại</label>
                            <div className="relative">
                                <select
                                    {...register('type')}
                                    className="text-[14px] lg:text-[16px] w-full bg-slate-50 border-none rounded-xl p-2 lg:p-3 text-slate-900 font-bold appearance-none focus:ring-4 focus:ring-orange-500/10 transition-all cursor-pointer"
                                >
                                    <option value="food">Thức ăn</option>
                                    <option value="drink">Đồ uống</option>
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-[11px] font-black text-gray-600 uppercase tracking-[0.2em] mb-2">Danh mục</label>
                        <div className="relative">
                            <select
                                {...register('category_id', { required: true })}
                                className="text-[14px] lg:text-[16px] w-full bg-slate-50 border-none rounded-xl p-2 lg:p-3 text-slate-900 font-bold appearance-none focus:ring-4 focus:ring-orange-500/10 transition-all cursor-pointer"
                            >
                                <option value="">Chọn danh mục</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name} ({cat.type})</option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-[11px] font-black text-gray-600 uppercase tracking-[0.2em] mb-2">Link ảnh (URL) - Không bắt buộc</label>
                        <input
                            {...register('image')}
                            type="text"
                            className="text-[14px] lg:text-[16px] w-full bg-slate-50 border-none rounded-xl p-2 lg:p-3 text-slate-900 font-bold placeholder:text-slate-300 focus:ring-4 focus:ring-orange-500/10 transition-all"
                            placeholder="https://cloudinary.com/..."
                        />
                    </div>

                    <div className="pt-4 flex items-center gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="flex-1 py-4 bg-orange-500 text-white rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-orange-600 transition-all shadow-xl shadow-orange-500/25 disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2"
                        >
                            {processing ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                    <span>Đang xử lý...</span>
                                </>
                            ) : (
                                product ? 'Lưu thay đổi' : 'Thêm món'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProductFormModal;
