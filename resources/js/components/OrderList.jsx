import React from 'react';
import { getElapsedString } from '../shared/utils/formatTime';
import { formatPrice } from '../shared/utils/formatCurrency';

const OrderList = ({ tables, allTables, onTableClick, now }) => {
    if (tables.length === 0) {
        return (
            <div className="w-full flex-1 flex flex-col items-center justify-center py-20 text-gray-400 italic">
                <svg className="w-16 h-16 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                <p>Chưa có bàn nào đặt món</p>
            </div>
        );
    }

    return (
        <div className="list-orders w-full flex-1 grid grid-cols-1 gap-3">
            {tables.map((table) => {
                const originalIndex = allTables.findIndex(t => t.id === table.id);
                const startTime = table.active_order?.created_at;
                const totalPrice = table.active_order?.total_price || 0;

                return (
                    <div
                        key={table.id}
                        onClick={() => onTableClick && onTableClick(table.id)}
                        className="order-item bg-white rounded-[12px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 cursor-pointer border border-gray-100 overflow-hidden flex flex-col group relative"
                    >
                        <div className="line-top w-full"></div>

                        <div className="flex items-center px-4 pt-0 pb-5">
                            {/* Ribbon Icon Container */}
                            <div className="order-item__icon  relative">
                                <div className="bg text-white p-2 relative z-10">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M22 19H2V17H22V19M2 15C2 13.9 2.9 13 4 13H20C21.1 13 22 13.9 22 15V16H2V15M12 2C8.69 2 6 4.69 6 8V11H18V8C18 4.69 15.31 2 12 2Z" />
                                    </svg>
                                </div>
                                <div className="graphic-left absolute top-full left-0 w-0 h-0 border-l-[18px] border-l-[#007bff] border-b-[8px] border-b-transparent"></div>
                                <div className="graphic-right absolute top-full right-0 w-0 h-0 border-r-[18px] border-r-[#007bff] border-b-[8px] border-b-transparent"></div>
                            </div>
                            <h6 className="pt-1 pl-3">BÀN</h6>
                        </div>

                        {/* Dotted Divider */}
                        <div className="mx-4 border-b border-dashed border-gray-200"></div>

                        <div className="flex items-center p-4 pt-2">
                            {/* Table Number - Left Side */}
                            <div className="flex-1 flex justify-center items-center">
                                <h2>
                                    {table.active_order?.merged_tables || originalIndex + 1}
                                </h2>
                            </div>

                            {/* Vertical Divider */}
                            <div className="w-[1px] h-20 bg-gray-200 mx-2"></div>

                            {/* Details - Right Side */}
                            <div className="flex-[1.5] flex flex-col justify-center pl-3 gap-3">
                                {/* Time Row */}
                                <div className="flex items-center gap-2">
                                    <svg width="18px" height="18px" strokeWidth="1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="#000000"><path d="M12 6L12 12L18 12" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path><path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                                    <span className='text-[14px]'>
                                        {getElapsedString(startTime, now)}
                                    </span>
                                </div>

                                {/* Shared Horizontal Detail Divider */}
                                <div className="h-[1px] bg-gray-100 w-full"></div>

                                {/* Amount Row */}
                                <div className="flex items-center gap-2">
                                    <svg width="18px" height="18px" strokeWidth="1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="#000000"><path d="M3 20.4V3.6C3 3.26863 3.26863 3 3.6 3H20.4C20.7314 3 21 3.26863 21 3.6V20.4C21 20.7314 20.7314 21 20.4 21H3.6C3.26863 21 3 20.7314 3 20.4Z" stroke="#000000" strokeWidth="1.5"></path><path d="M15 8.5C14.315 7.81501 13.1087 7.33855 12 7.30872M9 15C9.64448 15.8593 10.8428 16.3494 12 16.391M12 7.30872C10.6809 7.27322 9.5 7.86998 9.5 9.50001C9.5 12.5 15 11 15 14C15 15.711 13.5362 16.4462 12 16.391M12 7.30872V5.5M12 16.391V18.5" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                                    <span className="text-[14px] font-bold">
                                        {formatPrice(totalPrice)}<span className="underline ml-0.5 text-[12px]">đ</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default OrderList;
