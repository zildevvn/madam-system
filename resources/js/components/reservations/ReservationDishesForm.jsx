import React from 'react';

const ReservationDishesForm = ({ fields, register, append, remove, inputClasses, sectionTitle }) => {
    return (
        <div>
            <div className={sectionTitle}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20v-6M9 20v-4M15 20v-8M18 20V4M6 20v-2" /></svg>
                Dishes Selection
            </div>
            <div className="space-y-4">
                {fields.map((field, index) => (
                    <div key={field.id} className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm md:shadow-none md:border-none md:p-0 md:bg-transparent flex flex-col md:flex-row gap-3 items-stretch md:items-end animate-in fade-in slide-in-from-left-2 duration-200">
                        <div className="md:w-24">
                            <label className={`text-[10px] font-black text-gray-400 uppercase mb-1 ${index === 0 ? 'block' : 'block md:hidden'}`}>ID</label>
                            <input
                                type="number"
                                {...register(`dishes.${index}.product_id`)}
                                className={`${inputClasses} bg-gray-50/50 cursor-not-allowed text-gray-500`}
                                placeholder="ID"
                                readOnly
                            />
                        </div>
                        <div className="flex-1">
                            <label className={`text-[10px] font-black text-gray-700 uppercase mb-1 ${index === 0 ? 'block' : 'block md:hidden'}`}>Dish Name</label>
                            <input {...register(`dishes.${index}.name`)} className={inputClasses} placeholder="Dish Name" />
                        </div>
                        <div className="flex md:w-52 gap-3">
                            <div className="flex-1 md:w-20">
                                <label className={`text-[10px] font-black text-gray-400 uppercase mb-1 ${index === 0 ? 'block' : 'block md:hidden'}`}>Qty</label>
                                <input type="number" {...register(`dishes.${index}.quantity`)} className={inputClasses} />
                            </div>
                            <div className="flex-[2] md:w-32 relative">
                                <label className={`text-[10px] font-black text-gray-400 uppercase mb-1 ${index === 0 ? 'block' : 'block md:hidden'}`}>Price (VND)</label>
                                <div className="relative">
                                    <input type="number" {...register(`dishes.${index}.price`)} className={`${inputClasses} pr-10`} />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400">₫</div>
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
                        const maxId = fields.reduce((max, item) => {
                            const pid = parseInt(item.product_id);
                            return isNaN(pid) ? max : Math.max(max, pid);
                        }, 1000);
                        append({ product_id: maxId + 1, name: '', quantity: 1, price: 0 });
                    }}
                    className="w-full py-3.5 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl text-xs font-black text-gray-400 hover:border-orange-300 hover:text-orange-500 hover:bg-white transition-all cursor-pointer flex items-center justify-center gap-2 group"
                >
                    <svg className="group-hover:rotate-90 transition-transform duration-300" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
                    ADD CUSTOM DISH
                </button>
            </div>
        </div>
    );
};

export default ReservationDishesForm;
