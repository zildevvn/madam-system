import React from 'react';
import { calculateTableStatus } from '../shared/utils/activeOrderUtils';

const NewOrderIcon = () => (
    <svg width="20px" height="20px" strokeWidth="1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="#fff">
        <path d="M22 14V8.5M6 13V6C6 4.34315 7.34315 3 9 3H14" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
        <path d="M16.9922 4H19.9922M22.9922 4L19.9922 4M19.9922 4V1M19.9922 4V7" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
        <path d="M12 21H6C3.79086 21 2 19.2091 2 17C2 14.7909 3.79086 13 6 13H17H18C15.7909 13 14 14.7909 14 17C14 19.2091 15.7909 21 18 21C20.2091 21 22 19.2091 22 17V14" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
    </svg>
);

const ActiveOrderTableCard = React.memo(({ 
    table, 
    order, 
    currentTimeTs, 
    onTableClick,
    options = {}
}) => {
    const { statusClass, duration, isNewOrder } = calculateTableStatus(order, currentTimeTs, options);

    const getDisplayName = () => {
        // 1. Detect Group Reservation range from table_ids
        if (order?.reservation?.type === 'group' && Array.isArray(order.reservation.table_ids)) {
            return order.reservation.table_ids
                .map(id => id.toString().replace(/^Bàn\s+/i, ''))
                .sort((a, b) => parseInt(a) - parseInt(b))
                .join('-');
        }
        // 2. Fallback to standard merged name or single table name
        return (order?.tableName || order?.mergedTables || table.name || table.id.toString()).toString().replace(/^Bàn\s+/i, '');
    };

    return (
        <div
            onClick={() => onTableClick && onTableClick(table)}
            className={`relative bg-white p-3 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col items-center justify-center gap-1 cursor-pointer ${statusClass} ${!statusClass ? 'border border-gray-100' : ''} ${table.isGroupLinked ? 'is-group-linked' : ''} ${table.groupColorIndex ? `is-group-color-${table.groupColorIndex}` : ''}`}
        >
            <span className={`label-table text-[16px] font-black text-center flex items-center justify-center gap-1.5 ${!statusClass ? 'text-gray-900' : ''}`}>
                <div className="icon-new">
                    {isNewOrder && <NewOrderIcon />}
                </div>
                {getDisplayName()}
            </span>

            {order?.guestCount > 0 && (
                <span className={`text-[10px] font-bold flex items-center gap-1 ${!statusClass ? 'text-gray-400' : ''}`}>
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    {order.guestCount}
                </span>
            )}

            {duration && (
                <>
                    <div className="w-full h-[1px] bg-current opacity-20 rounded-full"></div>
                    <span className={`text-[8px] font-bold uppercase tracking-wider ${!statusClass ? 'text-gray-400' : ''}`}>
                        {duration}
                    </span>
                </>
            )}
        </div>
    );
});

export default ActiveOrderTableCard;
