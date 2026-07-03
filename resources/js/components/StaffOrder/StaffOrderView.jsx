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

    const renderOrderSelectionModal = () => {
        if (!ui.pendingOrders) return null;

        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-5 sm:p-6 flex flex-col max-h-[90vh]">
                    <h5 className="text-xl font-extrabold text-gray-900 mb-2">Chọn đơn hàng</h5>
                    <p className="text-gray-600 mb-4 text-[14px]">Bàn này có nhiều đơn (do đã tách). Vui lòng chọn đơn bạn muốn thêm món:</p>

                    <div className="space-y-3 overflow-y-auto pr-1 custom-scrollbar flex-1">
                        {ui.pendingOrders.map((order, index) => {
                            const isMain = !order.parent_order_id;
                            const label = isMain ? 'Đơn gốc (Main)' : `Đơn tách ${index}`; // or calculate split index properly

                            return (
                                <div key={order.id} className="flex flex-col sm:flex-row sm:items-center justify-between w-full p-3 sm:p-4 border border-gray-200 rounded-xl hover:border-orange-500 hover:bg-orange-50 hover:shadow-sm transition-all gap-3 sm:gap-2">
                                    <button
                                        onClick={() => actions.onSelectOrder(order)}
                                        className="flex-1 text-left flex items-center justify-between w-full group"
                                    >
                                        <div className="text-left">
                                            <div className="font-bold text-gray-900 text-sm sm:text-base">{isMain ? 'Đơn gốc' : `Đơn tách ${index}`}</div>
                                            <div className="text-[11px] sm:text-xs text-gray-500 font-medium">Mã đơn: #{order.id}</div>
                                        </div>
                                        <div className="text-orange-600 font-bold text-sm sm:mr-3 ml-2 sm:ml-0 whitespace-nowrap flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                            Chọn <span>&rarr;</span>
                                        </div>
                                    </button>

                                    {!isMain && (
                                        <button
                                            onClick={() => actions.onMergeBack(order.id)}
                                            className="w-full sm:w-auto sm:ml-2 text-xs font-bold px-4 py-2.5 sm:py-1.5 bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 transition-colors whitespace-nowrap flex items-center justify-center shadow-sm"
                                            disabled={ui.isProcessingMerge}
                                        >
                                            {ui.isProcessingMerge ? 'Đang gộp...' : 'Gộp vào gốc'}
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-5 pt-4 border-t border-gray-100">
                        <button
                            onClick={actions.onCancelSelection}
                            className="w-full py-2 sm:py-1.5 text-gray-600 font-bold bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                        >
                            Hủy
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="md-management-page pb-24 sm:pb-20 bg-gray-50 min-h-screen">
            {renderOrderSelectionModal()}
            {/* Header */}
            <div className="bg-white py-3 sm:py-4 border-b border-gray-200 shadow-sm sticky top-0 z-40">
                <div className="flex items-center justify-between gap-4 w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-2 bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-100">
                        <span className="text-xs sm:text-sm text-orange-800 font-medium">Tổng số đơn:</span>
                        <span className="text-sm sm:text-base font-black text-orange-600">{stats.busy}</span>
                    </div>

                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                        <span className="text-xs sm:text-sm text-gray-600 font-medium">Bàn trống:</span>
                        <span className="text-sm sm:text-base font-bold text-gray-800">{stats.empty}<span className="text-gray-400 font-medium text-xs mx-0.5">/</span>{stats.total}</span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="py-6 sm:py-8">
                <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
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