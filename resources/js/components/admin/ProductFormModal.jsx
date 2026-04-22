import React, { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import imageCompression from 'browser-image-compression';
import { formatPrice } from '../../shared/utils/formatCurrency';

const ProductFormModal = ({ isOpen, onClose, onSubmit, categories, product = null, processing = false, serverError = null }) => {
    const [preview, setPreview] = useState(null);
    const [imageError, setImageError] = useState(null);
    const [isCompressing, setIsCompressing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef(null);

    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
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

    // [WHY] Dedicated effect to handle blob URL cleanup to prevent memory leaks
    useEffect(() => {
        return () => {
            if (preview && typeof preview === 'string' && preview.startsWith('blob:')) {
                URL.revokeObjectURL(preview);
            }
        };
    }, [preview]);

    const clearFileInput = () => {
        setValue('image', null);
        setPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        setImageError(null);

        if (file) {
            // Check file type
            if (!file.type.startsWith('image/')) {
                setImageError('Vui lòng chọn tệp tin hình ảnh');
                clearFileInput();
                return;
            }

            setIsCompressing(true);
            try {
                // [WHY] Automatic compression and resizing before upload
                const options = {
                    maxSizeMB: 1,
                    maxWidthOrHeight: 1200,
                    useWebWorker: true
                };
                const compressedFile = await imageCompression(file, options);

                // Check image dimensions of the result
                const img = new Image();
                const objectUrl = URL.createObjectURL(compressedFile);
                img.src = objectUrl;
                img.onload = () => {
                    const MAX_DIMENSION = 1200;
                    if (img.width > MAX_DIMENSION || img.height > MAX_DIMENSION) {
                        setImageError(`Ảnh quá lớn (tối đa ${MAX_DIMENSION}x${MAX_DIMENSION}px). Hiện tại: ${img.width}x${img.height}px`);
                        URL.revokeObjectURL(objectUrl);
                        clearFileInput();
                        setIsCompressing(false);
                        return;
                    }

                    // Set image preview and value
                    setValue('image', compressedFile);
                    setPreview(objectUrl);
                    setIsCompressing(false);
                };
                img.onerror = () => {
                    URL.revokeObjectURL(objectUrl);
                    setImageError('Không thể đọc tệp tin hình ảnh sau khi nén');
                    clearFileInput();
                    setIsCompressing(false);
                };
            } catch (error) {
                console.error('Image compression error:', error);
                setImageError('Lỗi khi nén ảnh. Vui lòng chọn ảnh khác.');
                setIsCompressing(false);
                clearFileInput();
            }
        }

        // [WHY] Reset the input value so selecting the same file again triggers onChange
        e.target.value = '';
    };

    const onFormSubmit = async (data) => {
        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('name', data.name);
            formData.append('price', data.price);
            formData.append('type', data.type);
            formData.append('category_id', data.category_id);

            if (data.image) {
                formData.append('image', data.image);
            }

            await onSubmit(formData);
        } finally {
            // [WHY] We keep it true if the modal is about to close, 
            // but if there's an error and it stays open, we reset it.
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-[16px] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                <div className="px-3 py-2 lg:px-6 lg:py-4 border-b border-gray-50 flex items-center justify-between flex-shrink-0">
                    <h4 className="text-gray-900 mb-0 font-black text-sm lg:text-base">
                        {product ? 'Chỉnh sửa món' : 'Thêm món mới'}
                    </h4>
                    <button
                        onClick={onClose}
                        disabled={processing || isCompressing}
                        className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        type="button"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="flex-1 min-h-0 relative">
                    {/* Processing Overlay */}
                    {(processing || isCompressing || isSubmitting) && (
                        <div className="absolute inset-0 z-50 bg-white/60 backdrop-blur-[2px] flex flex-col items-center justify-center animate-in fade-in duration-300">
                            <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-white shadow-xl border border-gray-100">
                                <div className="w-8 h-8 border-3 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
                                <span className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] animate-pulse">
                                    {isCompressing ? 'Đang tối ưu ảnh...' : 'Đang lưu dữ liệu...'}
                                </span>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onFormSubmit)} className="px-3 py-2 lg:px-6 lg:py-4 space-y-3 lg:space-y-4 overflow-y-auto custom-scrollbar h-full">
                        {serverError && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-100 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                <span>{serverError}</span>
                            </div>
                        )}

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
                                {errors.price && (
                                    <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider mt-1 block px-1 animate-in fade-in duration-300">
                                        {errors.price.message}
                                    </span>
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
                                {...register('name', {
                                    required: 'Tên món không được để trống',
                                    minLength: { value: 2, message: 'Tên món quá ngắn' }
                                })}
                                type="text"
                                className={`text-[16px] w-full bg-slate-50 border-none rounded-xl p-2 lg:p-3 text-slate-900 font-normal placeholder:text-slate-300 focus:ring-4 focus:ring-orange-500/10 transition-all font-sans ${errors.name ? 'ring-2 ring-red-500/20 bg-red-50/30' : ''}`}
                                placeholder="Vd: Phở Bò Chín"
                            />
                            {errors.name && (
                                <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider mt-1 block px-1 animate-in fade-in duration-300">
                                    {errors.name.message}
                                </span>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-5">
                            <div className="relative">
                                <label className="block text-[11px] font-black text-gray-600 uppercase tracking-[0.2em] mb-2">Giá (VND)</label>
                                <div className="relative">
                                    <input
                                        {...register('price', {
                                            required: 'Giá không được để trống',
                                            min: { value: 0, message: 'Giá không hợp lệ' },
                                            valueAsNumber: true
                                        })}
                                        type="number"
                                        className={`text-[16px] w-full bg-slate-50 border-none rounded-xl p-2 lg:p-3 text-slate-900 font-normal placeholder:text-slate-300 focus:ring-4 focus:ring-orange-500/10 transition-all font-sans ${errors.price ? 'ring-2 ring-red-500/20 bg-red-50/30' : ''}`}
                                        placeholder="0"
                                    />
                                    {watchedPrice > 0 && !errors.price && (
                                        <div className="mt-1.5 px-1 flex items-center justify-between animate-in fade-in slide-in-from-top-1 duration-300">
                                            <span className="text-[11px] font-black text-orange-500 uppercase tracking-widest">
                                                {formatPrice(watchedPrice)}đ
                                            </span>
                                        </div>
                                    )}
                                    {errors.price && (
                                        <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider mt-1 block px-1 animate-in fade-in duration-300">
                                            {errors.price.message}
                                        </span>
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
                                    {...register('category_id', { required: 'Vui lòng chọn danh mục' })}
                                    className={`text-[16px] w-full bg-slate-50 border-none rounded-xl p-2 lg:p-3 text-slate-900 font-normal appearance-none focus:ring-4 focus:ring-orange-500/10 transition-all cursor-pointer font-sans ${errors.category_id ? 'ring-2 ring-red-500/20 bg-red-50/30' : ''}`}
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
                            {errors.category_id && (
                                <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider mt-1 block px-1 animate-in fade-in duration-300">
                                    {errors.category_id.message}
                                </span>
                            )}
                        </div>

                        <div className="pt-4 flex items-center gap-4">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={processing || isCompressing}
                                className="flex-1 py-3 bg-slate-100 text-slate-500 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95 disabled:opacity-50"
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                disabled={processing || isCompressing || isSubmitting}
                                className="btn-submit flex-1 py-3 bg-orange-500 text-white rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-orange-600 transition-all shadow-xl shadow-orange-500/25 disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2"
                            >
                                {processing || isCompressing || isSubmitting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                        <span>{isCompressing ? 'Đang nén ảnh...' : 'Đang xử lý...'}</span>
                                    </>
                                ) : (
                                    product ? 'Lưu thay đổi' : 'Thêm món'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ProductFormModal;