import React from 'react';
import { formatPrice } from '../shared/utils/formatCurrency';
import TimeElapsed from './shared/TimeElapsed';
import Icon from './shared/Icon';

const OrderList = ({ tables, allTables, onTableClick }) => {

    if (tables.length === 0) {
        return (
            <div className="w-full flex-1 flex flex-col items-center justify-center py-20 text-gray-400 italic">
                <Icon name="clipboardList" size={64} className="w-16 h-16 mb-4 opacity-20" strokeWidth={1} />
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
                                    <Icon name="conciergeBell" size={16} className="w-4 h-4 text-white" />
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
                                    {table.tableName || originalIndex + 1}
                                </h2>
                            </div>

                            {/* Vertical Divider */}
                            <div className="w-[1px] h-20 bg-gray-200 mx-2"></div>

                            {/* Details - Right Side */}
                            <div className="flex-[1.5] flex flex-col justify-center pl-3 gap-3">
                                {/* Time Row */}
                                <div className="flex items-center gap-2">
                                    <Icon name="clock" size={18} strokeWidth={1.5} className="text-black" />
                                    <TimeElapsed timestamp={startTime} />
                                </div>

                                {/* Shared Horizontal Detail Divider */}
                                <div className="h-[1px] bg-gray-100 w-full"></div>

                                {/* Amount Row */}
                                <div className="flex items-center gap-2">
                                    <Icon name="dollarSign" size={18} strokeWidth={1.5} className="text-black" />
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
