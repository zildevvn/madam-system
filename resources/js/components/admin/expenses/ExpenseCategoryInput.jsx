import React from 'react';

const ExpenseCategoryInput = ({ 
    type, 
    register, 
    setValue, 
    categories, 
    currentCategory, 
    isFixedOther,
    error 
}) => {
    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <label className="block text-[11px] font-black text-gray-600 uppercase tracking-[0.2em] mb-2">
                    Danh mục ({type === 'fixed' ? 'Cố định' : 'Biến đổi'})
                </label>
                <div className="relative group">
                    {type === 'fixed' ? (
                        <>
                            <select
                                {...register('category', { required: true })}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setValue('category', val === 'other_fixed' ? '' : val);
                                }}
                                value={categories.fixed.some(c => c.value === currentCategory) ? currentCategory : 'other_fixed'}
                                className="text-[16px] w-full bg-slate-50 border-none rounded-xl p-3 text-slate-900 font-normal appearance-none transition-all shadow-inner uppercase tracking-tight"
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
                            className={`text-[16px] w-full bg-slate-50 border-none rounded-xl p-3 text-slate-900 font-normal placeholder:text-slate-300 transition-all shadow-inner ${error ? 'ring-2 ring-red-500/20 bg-red-50/20' : ''}`}
                        />
                    )}
                </div>
            </div>

            {isFixedOther && (
                <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                    <label className="block text-[11px] font-black text-orange-500 uppercase tracking-[0.2em] mb-2">Tên danh mục cố định khác</label>
                    <input
                        {...register('category', { required: true })}
                        type="text"
                        placeholder="Ví dụ: Bảo hiểm, Thuế..."
                        className="text-[16px] w-full bg-orange-50/50 border-none rounded-xl p-3 text-slate-900 font-normal transition-all"
                    />
                </div>
            )}
        </div>
    );
};

export default ExpenseCategoryInput;
