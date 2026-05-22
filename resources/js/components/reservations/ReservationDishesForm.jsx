import React from 'react';
import { useWatch } from 'react-hook-form';
import { formatPrice } from '../../shared/utils/formatCurrency';

const ReservationDishesForm = ({ fields, register, watch, setValue, append, remove, inputClasses, sectionTitle }) => {

    const handlePriceChange = (index, value) => {
        const cleanValue = value.replace(/[^0-9]/g, '');
        const numValue = cleanValue ? parseInt(cleanValue) : 0;
        const isChild = watch(`dishes.${index}.is_child`);

        setValue(`dishes.${index}.original_price`, numValue);
        setValue(`dishes.${index}.price`, isChild ? Math.round(numValue * 0.75) : numValue);
    };

    const handleChildToggle = (index, checked) => {
        setValue(`dishes.${index}.is_child`, checked);
        const originalPrice = watch(`dishes.${index}.original_price`) ?? watch(`dishes.${index}.price`) ?? 0;
        setValue(`dishes.${index}.original_price`, originalPrice);

        if (checked) {
            setValue(`dishes.${index}.price`, Math.round(originalPrice * 0.75));
            const currentName = watch(`dishes.${index}.name`) || '';
            if (!currentName.includes('(Trẻ em)')) {
                setValue(`dishes.${index}.name`, `${currentName} (Trẻ em)`.trim());
            }
        } else {
            setValue(`dishes.${index}.price`, originalPrice);
            const currentName = watch(`dishes.${index}.name`) || '';
            setValue(`dishes.${index}.name`, currentName.replace(/\s*\(Trẻ em\)/g, '').trim());
        }
    };
    return (
        <>
            <div className="mb-1">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20v-6M9 20v-4M15 20v-8M18 20V4M6 20v-2" /></svg>
                Dishes Selection
            </div>
            <div className="space-y-4">
                {fields.map((field, index) => (
                    <div key={field.id} className="item-dish relative p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-orange-200 transition-all animate-in fade-in slide-in-from-left-2 duration-200">
                        <div className="flex flex-col xl:flex-row gap-4 xl:items-start">

                            {/* Name & Category */}
                            <div className="flex-1 flex flex-col sm:flex-row gap-3">
                                <div className="flex-[2]">
                                    <input type="hidden" {...register(`dishes.${index}.id`)} />
                                    <label className="text-[10px] font-black text-gray-400 uppercase mb-1.5 tracking-wider block">Dish Name</label>
                                    <input {...register(`dishes.${index}.name`, { required: true })} className={inputClasses} placeholder="Enter dish name..." />
                                </div>

                                <div className="flex-1 sm:max-w-[160px]">
                                    <label className="text-[10px] font-black text-gray-400 uppercase mb-1.5 tracking-wider block">Category</label>
                                    <div className="relative group/select">
                                        <select
                                            {...register(`dishes.${index}.type`)}
                                            className={`${inputClasses} appearance-none pr-8 bg-gray-50/50 border-gray-200/50 text-gray-700 font-bold focus:bg-orange-50/30 focus:text-orange-600 focus:border-orange-200 transition-colors`}
                                        >
                                            <option value="food">Food</option>
                                            <option value="drink">Drink</option>
                                            <option value="packaged_drink">Packaged Drink</option>
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover/select:text-orange-500 transition-colors">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Pricing, Qty, Child Options */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4 xl:pt-0 border-t border-gray-50 xl:border-none">

                                <div className="flex items-start gap-3">
                                    <div className="w-20 shrink-0">
                                        <label className="text-[10px] font-black text-gray-400 uppercase mb-1.5 tracking-wider block text-center">Qty</label>
                                        <input type="number" {...register(`dishes.${index}.quantity`, { required: true, min: 1 })} className={`${inputClasses} px-2 text-center font-bold`} />
                                    </div>

                                    <div className="w-full sm:w-36 relative">
                                        <label className="text-[10px] font-black text-gray-400 uppercase mb-1.5 tracking-wider block">Price (VND)</label>
                                        <div className="relative">
                                            <input type="hidden" {...register(`dishes.${index}.price`, { required: true })} />
                                            <input
                                                type="text"
                                                value={formatPrice(watch(`dishes.${index}.original_price`) ?? watch(`dishes.${index}.price`))}
                                                onChange={(e) => handlePriceChange(index, e.target.value)}
                                                className={inputClasses}
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Child Toggle & Result */}
                                <div className="flex flex-row sm:flex-col items-center justify-between sm:justify-start gap-2 sm:pl-4 sm:border-l border-gray-100 ">
                                    <label className="flex items-center gap-2 cursor-pointer group/toggle mt-0 sm:mt-2 ">
                                        <input
                                            type="checkbox"
                                            checked={watch(`dishes.${index}.is_child`) || false}
                                            onChange={(e) => handleChildToggle(index, e.target.checked)}
                                            className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500 transition-all cursor-pointer"
                                        />
                                        <span className={`text-[10px] font-black uppercase tracking-wider transition-colors ${watch(`dishes.${index}.is_child`) ? 'text-orange-600' : 'text-gray-400 group-hover/toggle:text-gray-600'}`}>
                                            Child
                                        </span>
                                    </label>
                                </div>

                                {/* Remove Action */}
                                <button
                                    type="button"
                                    onClick={() => remove(index)}
                                    className="absolute -top-3 -right-3 xl:relative xl:top-auto xl:right-auto xl:mt-5 p-2 bg-white xl:bg-red-50 text-red-400 xl:text-red-500 rounded-full xl:rounded-xl hover:bg-red-500 hover:text-white transition-all border border-gray-100 xl:border-none shadow-sm xl:shadow-none cursor-pointer h-8 w-8 xl:h-[46px] xl:w-[46px] flex items-center justify-center shrink-0 z-10 group/delete"
                                    title="Remove Dish"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="hidden xl:block group-hover/delete:scale-110 transition-transform"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="block xl:hidden"><path d="M18 6L6 18M6 6l12 12" /></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
                <button
                    type="button"
                    onClick={() => {
                        append({ name: '', quantity: 1, price: 0, original_price: 0, type: 'food', is_child: false });
                    }}
                    className="w-full py-3 mdt-bg-primary text-white rounded-xl text-[11px] font-black text-orange-600 hover:border-orange-400 transition-all cursor-pointer flex items-center justify-center gap-2 group shadow-sm"
                >
                    <div className="bg-white text-orange-600 p-1 rounded-lg group-hover:scale-110 transition-transform shadow-sm">
                        <svg className="group-hover:rotate-90 transition-transform duration-500" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
                    </div>
                    <span className="uppercase tracking-widest">Add New Dish</span>
                </button>

                <div className="mt-6 pt-6 border-t border-gray-100 space-y-3 px-2">
                    {/* Calculation Logic */}
                    {(() => {
                        const dishes = watch('dishes') || [];
                        const applyVat = watch('apply_vat');
                        const vatPercentage = Number(watch('vat_percentage') || 0);
                        const vatRate = vatPercentage / 100;

                        const subtotal = dishes.reduce((sum, dish) => {
                            const qty = parseInt(dish.quantity) || 0;
                            const price = parseInt(dish.price) || 0;
                            return sum + (qty * price);
                        }, 0);

                        const vatAmount = applyVat ? subtotal * vatRate : 0;
                        const totalAmount = subtotal + vatAmount;

                        return (
                            <>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Subtotal</span>
                                    <span className="text-[14px] font-bold text-gray-700">
                                        {formatPrice(subtotal)}
                                        <span className="text-[10px] ml-1 opacity-60">VND</span>
                                    </span>
                                </div>

                                {applyVat && (
                                    <div className="flex items-center justify-between animate-in fade-in slide-in-from-top-1 duration-300">
                                        <span className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em]">VAT ({vatPercentage}%)</span>
                                        <span className="text-[14px] font-bold text-orange-500">
                                            {formatPrice(vatAmount)}
                                            <span className="text-[10px] ml-1 opacity-60">VND</span>
                                        </span>
                                    </div>
                                )}

                                <div className="flex items-center justify-between pt-2">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-gray-900 uppercase tracking-[0.2em]">Total Amount</span>
                                        <span className="text-[20px] font-black text-orange-600 tracking-tight">
                                            {formatPrice(totalAmount)}
                                            <span className="text-[12px] ml-1 opacity-60">VND</span>
                                        </span>
                                    </div>
                                </div>
                            </>
                        );
                    })()}
                </div>
            </div>
        </>
    );
};

export default ReservationDishesForm;
