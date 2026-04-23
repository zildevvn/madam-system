import React, { useEffect } from 'react';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import ExpenseTypeSelector from './expenses/ExpenseTypeSelector';
import ExpenseCategoryInput from './expenses/ExpenseCategoryInput';
import { formatPrice } from '../../shared/utils/formatCurrency';

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
            date: format(new Date(), 'yyyy-MM-dd'),
            description: ''
        }
    });

    const currentType = watch('type');
    const currentCategory = watch('category');
    const watchedAmount = watch('amount');

    const formatWithCommas = (value) => {
        if (value === undefined || value === null || value === '') return '';
        return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };

    const handleAmountChange = (e) => {
        const rawValue = e.target.value.replace(/\D/g, "");
        const numValue = rawValue ? parseInt(rawValue, 10) : '';
        setValue('amount', numValue, { shouldValidate: true, shouldDirty: true });
    };

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
                date: format(new Date(), 'yyyy-MM-dd'),
                description: ''
            });
        }
    }, [expense, isOpen, reset]);

    const handleTypeChange = (newType) => {
        const defaultCategory = newType === 'fixed' ? 'rent' : '';
        setValue('type', newType);
        setValue('category', defaultCategory);
    };

    if (!isOpen) return null;

    const isFixedOther = currentType === 'fixed' &&
        !categories.fixed.filter(c => c.value !== 'other_fixed').some(c => c.value === currentCategory);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="relative w-full max-w-xl bg-white rounded-[16px] shadow-2xl border border-slate-100 flex flex-col max-h-[85vh] md:max-h-[90vh] overflow-hidden animate-in zoom-in-95 fade-in duration-300">
                <div className="px-3 py-2 lg:px-6 lg:py-4 border-b border-gray-50 flex items-center justify-between flex-shrink-0 bg-white z-10">
                    <h4 className="text-gray-900 mb-0">
                        {expense ? 'Cập nhật chi tiêu' : 'Thêm chi tiêu mới'}
                    </h4>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:text-gray-600 transition-all">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
                    <div className="flex-1 overflow-y-auto px-3 py-2 lg:px-6 lg:py-4 space-y-4 lg:space-y-6 custom-scrollbar">
                        <ExpenseTypeSelector currentType={currentType} onTypeChange={handleTypeChange} />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="block text-[11px] font-black text-gray-600 uppercase tracking-[0.2em] mb-2">Số tiền (VND)</label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="0"
                                    value={formatWithCommas(watchedAmount)}
                                    onChange={handleAmountChange}
                                    className={`text-[16px] w-full bg-slate-50 border-none rounded-xl p-3 text-slate-900 font-normal shadow-inner ${errors.amount ? 'ring-2 ring-red-500/20 bg-red-50/20' : ''}`}
                                />
                                <input type="hidden" {...register('amount', { required: true, min: 1 })} />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[11px] font-black text-gray-600 uppercase tracking-[0.2em] mb-2">Ngày tháng</label>
                                <input
                                    {...register('date', { required: true })}
                                    type="date"
                                    className="text-[16px] w-full bg-slate-50 border-none rounded-xl p-3 text-slate-900 font-normal shadow-inner"
                                />
                            </div>
                        </div>

                        <ExpenseCategoryInput
                            type={currentType}
                            register={register}
                            setValue={setValue}
                            categories={categories}
                            currentCategory={currentCategory}
                            isFixedOther={isFixedOther}
                            error={errors.category}
                        />

                        <div className="space-y-2">
                            <label className="block text-[11px] font-black text-gray-600 uppercase tracking-[0.2em] mb-2">Mô tả chi tiết</label>
                            <textarea
                                {...register('description')}
                                rows="3"
                                placeholder="Nhập nội dung chi tiêu tại đây..."
                                className="text-[16px] w-full bg-slate-50 border-none rounded-xl p-3 text-slate-900 font-normal shadow-inner resize-none appearance-none"
                            ></textarea>
                        </div>
                    </div>

                    <div className="py-3 px-3 lg:px-6 border-t border-slate-50 flex gap-4 flex-shrink-0 bg-white">
                        <button type="button" onClick={onClose} className="mdt-btn w-full cursor-pointer !bg-slate-100 !text-slate-500 !hover:bg-slate-200">Hủy</button>
                        <button type="submit" disabled={processing} className="mdt-btn w-full cursor-pointer">
                            {processing ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                    <span>Đang xử lý...</span>
                                </div>
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

