import React from 'react';

const TableGrid = ({
    tables,
    onTableClick,
    error,
    gridClassName = "list-tables w-full flex-1 grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4",
    renderCard
}) => {
    return (
        <div className={gridClassName}>
            {tables.map((table, index) => {
                if (renderCard) {
                    return renderCard(table, index);
                }

                // Default StaffOrder-style card implementation (Logic remains intact)
                const isBusy = table.status?.toLowerCase() === 'busy';
                const statusText = (!table.status || table.status.toLowerCase() === 'available' || table.status.toLowerCase() === 'empty')
                    ? 'Bàn Trống'
                    : '20 minutes';

                return (
                    <div
                        key={table.id}
                        onClick={() => onTableClick && onTableClick(table.id)}
                        className={`bg-white p-2 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col items-center justify-center gap-2 cursor-pointer ${isBusy ? 'is-busy' : 'border border-gray-100'}`}
                    >
                        <span className="text-lg font-bold">{index + 1}</span>
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
