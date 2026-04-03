import React, { useState, useEffect } from 'react';
import { getElapsedString } from '../utils/time';

const TableGrid = ({
    tables,
    onTableClick,
    error,
    gridClassName = "list-tables w-full flex-1 grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4",
    renderCard
}) => {
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const getElapsed = (timestamp) => getElapsedString(timestamp, now);

    // Build global merge map for visual status consistency
    const tableIdToGroupKey = {};
    tables.forEach(t => {
        if (t.active_order && t.active_order.merged_tables) {
            const groupKey = t.active_order.merged_tables;
            groupKey.split('-').forEach(id => {
                tableIdToGroupKey[id.toString()] = groupKey;
            });
        }
    });

    return (
        <div className={gridClassName}>
            {tables.map((table, index) => {
                if (renderCard) {
                    return renderCard(table, index);
                }

                // Default StaffOrder-style card implementation (Logic remains intact)
                const groupKey = tableIdToGroupKey[table.id.toString()];
                const isBusy = !!table.active_order || !!groupKey;
                
                // Identify if this table is the "primary" in a merge group
                // In string-based merging, the first ID in the dash-separated string is the primary
                const isPrimary = groupKey ? groupKey.split('-')[0] === table.id.toString() : true;

                const statusText = (!isBusy)
                    ? 'Bàn Trống'
                    : (!isPrimary 
                        ? 'Đang gộp' 
                        : (table.active_order?.created_at 
                            ? getElapsed(table.active_order.created_at) 
                            : 'Đang xử lý'));

                return (
                    <div
                        key={table.id}
                        onClick={() => onTableClick && onTableClick(table.id)}
                        className={`bg-white p-2 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col items-center justify-center gap-2 cursor-pointer ${isBusy ? 'is-busy' : 'border border-gray-100'}`}
                    >
                        <span className="text-lg font-bold">{table.name?.replace(/[^0-9]/g, '') || table.id}</span>
                        <div className="w-full h-[1px] bg-current opacity-20 rounded-full"></div>
                        <span className={`mt-1 text-[10px] uppercase tracking-wider font-semibold ${isBusy ? 'text-white' : 'text-gray-400'}`}>
                            {statusText}
                        </span>
                    </div>
                );
            })}

            {tables.length === 0 && !error && (
                <div className="col-span-full py-20 text-center text-gray-400">
                    Không tìm thấy dữ liệu bàn nào.
                </div>
            )}
        </div>
    );
};

export default TableGrid;
