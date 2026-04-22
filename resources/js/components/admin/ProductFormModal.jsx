import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import ProductImageInput from './products/ProductImageInput';
import ProductFormFields from './products/ProductFormFields';

/**
 * Product Form Modal Component
 * WHY: Manages the lifecycle and submission of the product form.
 * Refactored to <150 lines by extracting sub-components as per project conventions.
 */
const ProductFormModal = ({ isOpen, onClose, onSubmit, categories, product = null, processing = false, serverError = null }) => {
    const [preview, setPreview] = useState(null);
    const [imageError, setImageError] = useState(null);
    const [isCompressing, setIsCompressing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    // WHY: Reset form state when modal opens/closes or product changes
    useEffect(() => {
        if (isOpen) {
            setPreview(product?.image ? `/storage/${product.image}` : null);
            setImageError(null);
            reset(product ? {
                name: product.name || '',
                price: product.price || 0,
                type: product.type || 'food',
                category_id: product.category_id || '',
                image: null
            } : {
                name: '',
                price: 0,
                type: 'food',
                category_id: categories.length > 0 ? categories[0].id : '',
                image: null
            });
        }
    }, [product, isOpen, reset, categories]);

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
            // WHY: Reset submission state if modal remains open due to error
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
                                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77-1.333.192-3 1.732-3z" /></svg>
                                <span>{serverError}</span>
                            </div>
                        )}

                        <ProductImageInput
                            preview={preview}
                            setPreview={setPreview}
                            setValue={setValue}
                            imageError={imageError}
                            setImageError={setImageError}
                            isCompressing={isCompressing}
                            setIsCompressing={setIsCompressing}
                        />

                        <ProductFormFields
                            register={register}
                            errors={errors}
                            watchedPrice={watchedPrice}
                            categories={categories}
                        />

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