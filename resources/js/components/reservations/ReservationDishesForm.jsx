import React from 'react';
import { useWatch } from 'react-hook-form';

const ReservationDishesForm = ({ fields, register, watch, setValue, append, remove, inputClasses, sectionTitle }) => {
    const formatPrice = (val) => {
        if (val === undefined || val === null || val === '') return '';
        const numericStr = val.toString().replace(/[^0-9]/g, '');
        if (!numericStr) return '';
        // Use Vietnamese locale convention (dots as thousand separators) for VND familiarity
        return parseInt(numericStr).toLocaleString('vi-VN');
    };

    const handlePriceChange = (index, value) => {
        // Strip everything except numbers
        const cleanValue = value.replace(/[^0-9]/g, '');
        // Update the actual form state with the integer
        setValue(`dishes.${index}.price`, cleanValue ? parseInt(cleanValue) : 0);
    };
    return (
        <>
            <div className="mb-1">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20v-6M9 20v-4M15 20v-8M18 20V4M6 20v-2" /></svg>
                Dishes Selection
            </div>
            <div className="space-y-4">
                {fields.map((field, index) => (
                    <div key={field.id} className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm md:shadow-none md:border-none md:p-0 md:bg-transparent flex flex-col md:flex-row gap-3 items-stretch md:items-end animate-in fade-in slide-in-from-left-2 duration-200">
                        <div className="flex-1">
                            <label className={`text-[10px] font-black text-gray-700 uppercase mb-1 ${index === 0 ? 'block' : 'block md:hidden'}`}>Dish Name</label>
                            <input {...register(`dishes.${index}.name`, { required: true })} className={inputClasses} placeholder="Enter dish name..." />
                        </div>

                        <div className="md:w-24">
                            <label className={`text-[10px] font-black text-gray-700 uppercase mb-1 ${index === 0 ? 'block' : 'block md:hidden'}`}>Category</label>
                            <div className="relative group">
                                <select
                                    {...register(`dishes.${index}.type`)}
                                    className={`${inputClasses} appearance-none pr-10 bg-orange-50/30 border-orange-100/50 text-orange-600 font-bold px-2`}
                                >
                                    <option value="food">Food</option>
                                    <option value="drink">Drink</option>
                                </select>
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-orange-400 group-hover:text-orange-600 transition-colors">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                </div>
                            </div>
                        </div>

                        <div className="flex md:w-72 gap-3">
                            <div className="flex-1 md:w-24">
                                <label className={`text-[10px] font-black text-gray-400 uppercase mb-1 ${index === 0 ? 'block' : 'block md:hidden'}`}>Qty</label>
                                <input type="number" {...register(`dishes.${index}.quantity`, { required: true, min: 1 })} className={`${inputClasses} px-2 text-center font-bold`} />
                            </div>
                            <div className="flex-[3] md:w-40 relative">
                                <label className={`text-[10px] font-black text-gray-400 uppercase mb-1 ${index === 0 ? 'block' : 'block md:hidden'}`}>Price (VND)</label>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        {...register(`dishes.${index}.price`, { required: true })} 
                                        value={formatPrice(watch(`dishes.${index}.price`))}
                                        onChange={(e) => handlePriceChange(index, e.target.value)}
                                        className={inputClasses} 
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => remove(index)}
                                className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all border-none cursor-pointer self-end md:mb-1 h-[46px] w-[46px] flex items-center justify-center shrink-0"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
                            </button>
                        </div>
                    </div>
                ))}
                <button
                    type="button"
                    onClick={() => {
                        append({ name: '', quantity: 1, price: 0, type: 'food' });
                    }}
                    className="w-full py-3.5 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl text-xs font-black text-gray-400 hover:border-orange-300 hover:text-orange-500 hover:bg-white transition-all cursor-pointer flex items-center justify-center gap-2 group"
                >
                    <svg className="group-hover:rotate-90 transition-transform duration-300" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
                    ADD NEW DISH
                </button>
            </div>
        </>
    );
};

export default ReservationDishesForm;
