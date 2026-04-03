import React from 'react';

const KitchenDishList = ({ consolidatedItems }) => {
    return (
        <div className="col-span-12 md:col-span-8 lg:col-span-6 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col overflow-hidden h-full">
            <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                <h5 className="tracking-widest m-0"> Danh sách món </h5>
                <span className="text-xs font-bold bg-orange-100 mdt-text-primary px-3 py-1 rounded-full uppercase">
                    {consolidatedItems.length} loại món
                </span>
            </div>
            <div className="p-6 overflow-y-auto flex-1 hide-scrollbar">
                {consolidatedItems.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                        {consolidatedItems.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between px-2 py-3 bg-gray-50 rounded-xl border border-transparent hover:border-orange-200 transition-colors group">
                                <div className="flex flex-col gap-1 flex-1">
                                    <h6 className="m-0 text-sm md:text-base font-bold text-gray-800">{item.name}</h6>
                                    <div className="flex flex-wrap gap-1">
                                        {item.tables.map((t, tid) => (
                                            <span key={tid} className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-700 uppercase tracking-tighter">
                                                Bàn {t}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex items-center justify-center text-sm font-black mdt-text-primary bg-orange-50 w-10 h-10 rounded-xl shadow-sm border border-orange-100">
                                    X{item.quantity}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-300 italic py-20">
                        <svg className="w-16 h-16 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p>Không có món nào đang chờ xử lý</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default KitchenDishList;
