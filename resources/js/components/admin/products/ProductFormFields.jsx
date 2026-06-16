import React from 'react';
import { formatPrice } from '../../../shared/utils/formatCurrency';
import Icon from '../../shared/Icon';

/**
 * Product Form Fields Component
 * WHY: Adheres to component granularity rules by separating standard input fields from the modal container.
 */
const ProductFormFields = ({ register, errors, watchedPrice, categories }) => {
    return (
        <>
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

            <div>
                <label className="block text-[11px] font-black text-gray-600 uppercase tracking-[0.2em] mb-2">Tên món tiếng Việt</label>
                <input
                    {...register('name_vi')}
                    type="text"
                    className={`text-[16px] w-full bg-slate-50 border-none rounded-xl p-2 lg:p-3 text-slate-900 font-normal placeholder:text-slate-300 focus:ring-4 focus:ring-orange-500/10 transition-all font-sans`}
                    placeholder="Vd: Phở Bò Chín"
                />
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
                            <option value="food">Food</option>
                            <option value="drink">Drink</option>
                            <option value="packaged_drink">Packaged Drink</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 flex items-center justify-center">
                            <Icon name="chevronDown" className="w-4 h-4" size={16} />
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
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 flex items-center justify-center">
                        <Icon name="chevronDown" className="w-4 h-4" size={16} />
                    </div>
                </div>
                {errors.category_id && (
                    <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider mt-1 block px-1 animate-in fade-in duration-300">
                        {errors.category_id.message}
                    </span>
                )}
            </div>
        </>
    );
};

export default ProductFormFields;
