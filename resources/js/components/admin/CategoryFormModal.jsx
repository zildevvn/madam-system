import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { CATEGORY_ICONS, DEFAULT_ICON } from '../../shared/constants/categoryIcons';

const CategoryFormModal = ({ isOpen, onClose, onSubmit, category = null, processing = false }) => {
    const { register, handleSubmit, reset, watch, setValue } = useForm({
        defaultValues: {
            name: '',
            type: 'food',
            icon: DEFAULT_ICON
        }
    });

    const selectedIcon = watch('icon');

    useEffect(() => {
        if (isOpen) {
            reset(category ? {
                name: category.name || '',
                type: category.type || 'food',
                icon: category.icon || DEFAULT_ICON
            } : {
                name: '',
                type: 'food',
                icon: DEFAULT_ICON
            });
        }
    }, [category, isOpen, reset]);

    const onFormSubmit = (data) => {
        onSubmit(data);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-[16px] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col">
                <div className="px-3 py-2 lg:px-6 lg:py-4 border-b border-gray-50 flex items-center justify-between flex-shrink-0">
                    <h4 className="text-gray-900 mb-0">
                        {category ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
                    </h4>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-all" type="button">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit(onFormSubmit)} className="px-3 py-2 lg:px-6 lg:py-4 space-y-3 lg:space-y-4">
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="lg:col-span-2">
                            <label className="block text-[11px] font-black text-gray-600 uppercase tracking-[0.2em] mb-2">Tên danh mục</label>
                            <input
                                {...register('name', { required: true })}
                                type="text"
                                className="text-[14px] lg:text-[16px] w-full bg-slate-50 border-none rounded-xl p-2 lg:p-3 text-slate-900 font-normal placeholder:text-slate-300 focus:ring-4 focus:ring-orange-500/10 transition-all"
                                placeholder="Vd: Khai vị, Đồ uống có cồn..."
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-black text-gray-600 uppercase tracking-[0.2em] mb-2">Loại hình</label>
                            <div className="relative">
                                <select
                                    {...register('type', { required: true })}
                                    className="text-[14px] lg:text-[16px] w-full bg-slate-50 border-none rounded-xl p-2 lg:p-3 text-slate-900 font-normal appearance-none focus:ring-4 focus:ring-orange-500/10 transition-all cursor-pointer"
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
                        <label className="block text-[11px] font-black text-gray-600 uppercase tracking-[0.2em] mb-1">Chọn Icon</label>
                        <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                            {Object.entries(CATEGORY_ICONS).map(([name, IconComponent]) => (
                                <button
                                    key={name}
                                    type="button"
                                    onClick={() => setValue('icon', name)}
                                    className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all border-2 cursor-pointer ${selectedIcon === name
                                        ? 'bg-orange-500 text-white border-orange-500 shadow-md scale-110'
                                        : 'bg-white text-slate-400 border-transparent hover:border-orange-200 hover:text-orange-400'
                                        }`}
                                >
                                    <IconComponent width="20" height="20" />
                                </button>
                            ))}
                        </div>
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
                                category ? 'Lưu thay đổi' : 'Thêm danh mục'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CategoryFormModal;
