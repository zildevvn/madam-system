import React, { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { formatPrice } from '../../shared/utils/formatCurrency';

const ProductFormModal = ({ isOpen, onClose, onSubmit, categories, product = null, processing = false }) => {
    const [preview, setPreview] = useState(null);
    const [imageError, setImageError] = useState(null);
    const fileInputRef = useRef(null);

    const { register, handleSubmit, reset, setValue, watch } = useForm({
        defaultValues: {
            name: '',
            price: 0,
            type: 'food',
            category_id: '',
            image: null
        }
    });

    const watchedPrice = watch('price');

    useEffect(() => {
        if (isOpen) {
            setPreview(product?.image ? `/storage/${product.image}` : null);
            setImageError(null);
            reset(product ? {
                name: product.name || '',
                price: product.price || 0,
                type: product.type || 'food',
                category_id: product.category_id || '',
                image: null // We don't populate the file input with the existing path
            } : {
                name: '',
                price: 0,
                type: 'food',
                category_id: categories.length > 0 ? categories[0].id : '',
                image: null
            });
        }
    }, [product, isOpen, reset, categories]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setImageError(null);

        if (file) {
            // Check file size (1.5MB = 1,572,864 bytes)
            if (file.size > 1.5 * 1024 * 1024) {
                setImageError('Dung lượng ảnh phải nhỏ hơn 1.5MB');
                setValue('image', null);
                setPreview(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
                return;
            }

            // Set image preview and value
            setValue('image', file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const onFormSubmit = (data) => {
        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('price', data.price);
        formData.append('type', data.type);
        formData.append('category_id', data.category_id);

        if (data.image) {
            formData.append('image', data.image);
        }

        onSubmit(formData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-[16px] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                <div className="px-3 py-2 lg:px-6 lg:py-4 border-b border-gray-50 flex items-center justify-between flex-shrink-0">
                    <h4 className="text-gray-900 mb-0 font-black">
                        {product ? 'Chỉnh sửa món' : 'Thêm món mới'}
                    </h4>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-all" type="button">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit(onFormSubmit)} className="px-3 py-2 lg:px-6 lg:py-4 space-y-3 lg:space-y-4 overflow-y-auto custom-scrollbar flex-1 min-h-0">
                    {/* Image Upload Area */}
                    <div className="flex flex-col items-center gap-4 py-2">
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="w-24 h-24 rounded-xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden cursor-pointer hover:border-orange-500 hover:bg-orange-50 transition-all group relative"
                        >
                            {preview ? (
                                <>
                                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-[10px] font-black uppercase text-white tracking-widest">Thay đổi</span>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center gap-2 text-slate-400">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    <span className="text-[9px] font-black uppercase tracking-widest">Chọn ảnh</span>
                                </div>
                            )}
                        </div>
                        <input
                            type="file"
                            className="hidden"
                            ref={fileInputRef}
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                        {imageError && (
                            <div className="text-red-500 text-[10px] font-black uppercase tracking-widest animate-in fade-in slide-in-from-top-1 duration-300">
                                {imageError}
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-[11px] font-black text-gray-600 uppercase tracking-[0.2em] mb-2">Tên món</label>
                        <input
                            {...register('name', { required: true })}
                            type="text"
                            className="text-[16px] w-full bg-slate-50 border-none rounded-xl p-2 lg:p-3 text-slate-900 font-normal placeholder:text-slate-300 focus:ring-4 focus:ring-orange-500/10 transition-all font-sans"
                            placeholder="Vd: Phở Bò Chín"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                        <div className="relative">
                            <label className="block text-[11px] font-black text-gray-600 uppercase tracking-[0.2em] mb-2">Giá (VND)</label>
                            <div className="relative">
                                <input
                                    {...register('price', { required: true, valueAsNumber: true })}
                                    type="number"
                                    className="text-[16px] w-full bg-slate-50 border-none rounded-xl p-2 lg:p-3 text-slate-900 font-normal placeholder:text-slate-300 focus:ring-4 focus:ring-orange-500/10 transition-all font-sans"
                                    placeholder="0"
                                />
                                {watchedPrice > 0 && (
                                    <div className="mt-1.5 px-1 flex items-center justify-between animate-in fade-in slide-in-from-top-1 duration-300">
                                        <span className="text-[11px] font-black text-orange-500 uppercase tracking-widest">
                                            {formatPrice(watchedPrice)}đ
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div>
                            <label className="block text-[11px] font-black text-gray-600 uppercase tracking-[0.2em] mb-2">Loại</label>
                            <div className="relative">
                                <select
                                    {...register('type')}
                                    className="text-[16px] w-full bg-slate-50 border-none rounded-xl p-2 lg:p-3 text-slate-900 font-normal appearance-none focus:ring-4 focus:ring-orange-500/10 transition-all cursor-pointer font-sans"
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
                                className="text-[16px] w-full bg-slate-50 border-none rounded-xl p-2 lg:p-3 text-slate-900 font-normal appearance-none focus:ring-4 focus:ring-orange-500/10 transition-all cursor-pointer font-sans"
                            >
                                <option value="">Chọn danh mục</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
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
