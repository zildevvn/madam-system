import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';

const ExpenseFormModal = ({ isOpen, onClose, onSubmit, expense, categories, processing }) => {
    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors }
    } = useForm({
        defaultValues: {
            amount: '',
            type: 'variable',
            category: '',
            date: new Date().toISOString().split('T')[0],
            description: ''
        }
    });

    const currentType = watch('type');
    const currentCategory = watch('category');

    useEffect(() => {
        if (expense && isOpen) {
            reset({
                amount: expense.amount,
                type: expense.type || 'variable',
                category: expense.category,
                date: expense.date,
                description: expense.description || ''
            });
        } else if (isOpen) {
            reset({
                amount: '',
                type: 'variable',
                category: '',
                date: new Date().toISOString().split('T')[0],
                description: ''
            });
        }
    }, [expense, isOpen, reset]);

    const handleTypeChange = (newType) => {
        const defaultCategory = newType === 'fixed' ? 'rent' : '';
        setValue('type', newType);
        setValue('category', defaultCategory);
    };

    const onFormSubmit = (data) => {
        onSubmit(data);
    };

    if (!isOpen) return null;

    // Determine if we show the "Other" fixed category input
    const isFixedOther = currentType === 'fixed' &&
        !categories.fixed.filter(c => c.value !== 'other_fixed').some(c => c.value === currentCategory);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="relative w-full max-w-xl bg-white rounded-[16px] shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 fade-in duration-300">
                {/* Header - Fixed at top */}
                <div className="px-3 py-2 lg:px-6 lg:py-4 border-b border-gray-50 flex items-center justify-between flex-shrink-0 bg-white z-10">
                    <h4 className="text-gray-900 mb-0">
                        {expense ? 'Cập nhật chi tiêu' : 'Thêm chi tiêu mới'}
                    </h4>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:text-gray-600 transition-all border border-transparent"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit(onFormSubmit)} className="flex flex-col flex-1 overflow-hidden">
                    {/* Scrollable Content Area */}
                    <div className="flex-1 overflow-y-auto px-3 py-2 lg:px-6 lg:py-4 space-y-4 lg:space-y-6 custom-scrollbar">
                        {/* Cost Type Selector */}
                        <div className="space-y-3">
                            <label className="block text-[11px] font-black text-gray-600 uppercase tracking-[0.2em] mb-2">Loại chi phí</label>
                            <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-50 rounded-xl border border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => handleTypeChange('variable')}
                                    className={`cursor-pointer py-3 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${currentType === 'variable'
                                        ? 'bg-white text-slate-900 shadow-sm'
                                        : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    Biến đổi
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleTypeChange('fixed')}
                                    className={`cursor-pointer py-3 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${currentType === 'fixed'
                                        ? 'bg-white text-slate-900 shadow-sm'
                                        : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    Cố định
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Amount */}
                            <div className="space-y-2">
                                <label className="block text-[11px] font-black text-gray-600 uppercase tracking-[0.2em] mb-2">Số tiền (VND)</label>
                                <input
                                    {...register('amount', { required: true })}
                                    type="number"
                                    placeholder="0"
                                    className={`text-[16px] w-full bg-slate-50 border-none rounded-xl p-3 text-slate-900 font-normal placeholder:text-slate-300  transition-all shadow-inner ${errors.amount ? 'ring-2 ring-red-500/20 bg-red-50/20' : ''}`}
                                />
                            </div>

                            {/* Date */}
                            <div className="space-y-2">
                                <label className="block text-[11px] font-black text-gray-600 uppercase tracking-[0.2em] mb-2">Ngày tháng</label>
                                <input
                                    {...register('date', { required: true })}
                                    type="date"
                                    className="text-[16px] w-full bg-slate-50 border-none rounded-xl p-3 text-slate-900 font-normal  transition-all shadow-inner"
                                />
                            </div>
                        </div>

                        {/* Category */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="block text-[11px] font-black text-gray-600 uppercase tracking-[0.2em] mb-2">Danh mục ({currentType === 'fixed' ? 'Cố định' : 'Biến đổi'})</label>
                                <div className="relative group">
                                    {currentType === 'fixed' ? (
                                        <>
                                            <select
                                                {...register('category', { required: true })}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setValue('category', val === 'other_fixed' ? '' : val);
                                                }}
                                                value={categories.fixed.some(c => c.value === currentCategory) ? currentCategory : 'other_fixed'}
                                                className="text-[16px] w-full bg-slate-50 border-none rounded-xl p-3 text-slate-900 font-normal appearance-none  transition-all shadow-inner uppercase tracking-tight"
                                            >
                                                {categories.fixed.map(cat => (
                                                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                                            </div>
                                        </>
                                    ) : (
                                        <input
                                            {...register('category', { required: true })}
                                            type="text"
                                            placeholder="Nhập tên danh mục..."
                                            className={`text-[16px] w-full bg-slate-50 border-none rounded-xl p-3 text-slate-900 font-normal placeholder:text-slate-300  transition-all shadow-inner ${errors.category ? 'ring-2 ring-red-500/20 bg-red-50/20' : ''}`}
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Custom Category Input for Fixed "Other" */}
                            {isFixedOther && (
                                <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                                    <label className="block text-[11px] font-black text-orange-500 uppercase tracking-[0.2em] mb-2">Tên danh mục cố định khác</label>
                                    <input
                                        {...register('category', { required: true })}
                                        type="text"
                                        placeholder="Ví dụ: Bảo hiểm, Thuế..."
                                        className="text-[16px] w-full bg-orange-50/50 border-none rounded-xl p-3 text-slate-900 font-normal  transition-all"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <label className="block text-[11px] font-black text-gray-600 uppercase tracking-[0.2em] mb-2">Mô tả chi tiết</label>
                            <textarea
                                {...register('description')}
                                rows="3"
                                placeholder="Nhập nội dung chi tiêu tại đây..."
                                className="text-[14px] w-full bg-slate-50 border-none rounded-xl p-3 text-slate-900 font-normal placeholder:text-slate-300  transition-all shadow-inner resize-none appearance-none"
                            ></textarea>
                        </div>
                    </div>

                    {/* Footer - Fixed at bottom */}
                    <div className="py-3 px-3 lg:px-6 border-t border-slate-50 flex gap-4 flex-shrink-0 bg-white">
                        <button
                            type="button"
                            onClick={onClose}
                            className="mdt-btn w-full cursor-pointer !bg-slate-100 !text-slate-500 !hover:bg-slate-200 w-full"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="mdt-btn w-full cursor-pointer"
                        >
                            {processing ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                    <span>Đang xử lý...</span>
                                </>
                            ) : (
                                <span>{expense ? 'Lưu' : 'Thêm'}</span>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ExpenseFormModal;

