import React from 'react';
import TableGrid from '../TableGrid';
import OrderList from '../OrderList';

const StaffOrderView = ({ data, ui, actions }) => {
    const { tables, busyTables, stats } = data;
    const { isLoading, activeTab } = ui;
    const { onTableClick } = actions;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    const isOrdersTab = activeTab === 'orders';

    return (
        <div className="md-management-page pb-20">
            {/* Header */}
            <div className="bg-white py-3 border-t border-b border-gray-200 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 w-full max-w-[1200px] mx-auto px-[20px] justify-between">
                    <p className="text-sm">
                        Tổng số đơn: {stats.busy}
                    </p>

                    <p className="text-sm">
                        Bàn trống {stats.empty}/{stats.total}
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="py-8">
                <div className="max-w-[1200px] mx-auto px-[20px] flex gap-4">
                    {isOrdersTab ? (
                        <OrderList
                            tables={busyTables}
                            allTables={tables}
                            onTableClick={onTableClick}
                        />
                    ) : (
                        <TableGrid
                            tables={tables}
                            onTableClick={onTableClick}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default React.memo(StaffOrderView);