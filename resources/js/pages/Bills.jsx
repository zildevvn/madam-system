import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchTables } from '../store/slices/tableSlice';

const Bills = () => {
    const dispatch = useAppDispatch();
    const { items: tables, status, error } = useAppSelector(state => state.table);
    const [selectedTable, setSelectedTable] = useState(null);
    const [currentTime, setCurrentTime] = useState(new Date());

    // Mock order data for demonstration
    // In a real app, this would come from an API or the Redux store
    // Generate mock order data to ensure various states are represented
    // Generate mock order data to ensure various states are represented
    const mockOrders = React.useMemo(() => {
        const now = new Date().getTime();
        return {
            "1": {
                startTime: new Date(now - 12 * 60000), // 12 mins ago (Yellow)
                served: false,
                items: [
                    { name: "Bún bò đặc biệt", quantity: 2, orderTime: new Date(now - 12 * 60000) },
                    { name: "Trà đào", quantity: 1, orderTime: new Date(now - 8 * 60000) }
                ]
            },
            "2": {
                startTime: new Date(now - 17 * 60000), // 17 mins ago (Red)
                served: false,
                items: [
                    { name: "Lẩu hải sản", quantity: 1, orderTime: new Date(now - 17 * 60000) },
                    { name: "Coca Cola", quantity: 4, orderTime: new Date(now - 15 * 60000) }
                ]
            },
            "3": {
                startTime: new Date(now - 25 * 60000), // 25 mins ago (Red)
                served: false,
                items: [
                    { name: "Set menu gia đình", quantity: 1, orderTime: new Date(now - 25 * 60000) },
                    { name: "Rượu vang đỏ", quantity: 1, orderTime: new Date(now - 20 * 60000) }
                ]
            },
            "4": {
                startTime: new Date(now - 5 * 60000), // 5 mins ago (Blue/Busy)
                served: false,
                items: [
                    { name: "Nem lụi Huế", quantity: 3, orderTime: new Date(now - 5 * 60000) },
                    { name: "Nước cam", quantity: 2, orderTime: new Date(now - 2 * 60000) }
                ]
            },
            "5": {
                startTime: new Date(now - 11 * 60000), // 11 mins ago (Yellow)
                served: false,
                items: [
                    { name: "Bánh bèo", quantity: 2, orderTime: new Date(now - 11 * 60000) },
                    { name: "Nước chanh", quantity: 2, orderTime: new Date(now - 5 * 60000) }
                ]
            },
            "6": {
                startTime: new Date(now - 30 * 60000), // 30 mins ago (Served - Green)
                served: true,
                items: [
                    { name: "Phở bò", quantity: 2, orderTime: new Date(now - 30 * 60000) },
                    { name: "Cà phê sữa đá", quantity: 2, orderTime: new Date(now - 25 * 60000) }
                ]
            },
            "7": {
                startTime: new Date(now - 45 * 60000), // 45 mins ago (Served - Green)
                served: true,
                items: [
                    { name: "Gỏi cuốn", quantity: 4, orderTime: new Date(now - 45 * 60000) },
                    { name: "Bia Saigon", quantity: 6, orderTime: new Date(now - 40 * 60000) }
                ]
            },
            "8": {
                startTime: new Date(now - 20 * 60000), // 20 mins ago (Served - Green)
                served: true,
                items: [
                    { name: "Chả giò", quantity: 2, orderTime: new Date(now - 20 * 60000) },
                    { name: "Trà đá", quantity: 2, orderTime: new Date(now - 15 * 60000) }
                ]
            },
            "15": {
                startTime: new Date(now - 2 * 60000), // 2 mins ago (Blue/Busy)
                served: false,
                items: [
                    { name: "Cơm chiên", quantity: 1, orderTime: new Date(now - 2 * 60000) }
                ]
            },
            "20": {
                startTime: new Date(now - 12 * 60000), // 12 mins ago (Yellow)
                served: false,
                items: [
                    { name: "Bún bò đặc biệt", quantity: 2, orderTime: new Date(now - 12 * 60000) },
                    { name: "Trà đào", quantity: 1, orderTime: new Date(now - 10 * 60000) }
                ]
            },
        };
    }, []);

    useEffect(() => {
        if (status === 'idle') {
            dispatch(fetchTables());
        }
    }, [status, dispatch]);

    // Update current time every minute to refresh highlights
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const getTableHighlightClass = (tableId) => {
        const order = mockOrders[tableId.toString()];

        // Scenario: No order ==> white background (matches StaffOrder base style)
        if (!order) return '';

        // Order present
        // Priority 0: All items served ==> green (overrides all waiting times)
        if (order.served) return '!bg-green-400 !border-green-400';

        const startTime = order.startTime;
        const diffMinutes = Math.floor((currentTime - startTime) / 60000);

        // Priority 1: Any item >= 15 min ==> light red
        if (diffMinutes >= 15) return '!bg-red-400  !border-red-400';

        // Priority 2: Items >= 10 min < 15 min ==> light yellow
        if (diffMinutes >= 10) return '!bg-yellow-100 !text-yellow-700 !border-yellow-200';

        // Priority 3: All items < 10 min ==> is-busy
        return 'is-busy';
    };

    const getDurationText = (tableId) => {
        const order = mockOrders[tableId.toString()];
        if (!order) return 'Bàn Trống';

        if (order.served) return 'Hoàn tất';

        const startTime = order.startTime;
        const diffMinutes = Math.floor((currentTime - startTime) / 60000);
        return `${diffMinutes} phút`;
    };

    const handleTableClick = (table) => {
        const order = mockOrders[table.id.toString()];
        if (order) {
            setSelectedTable(table);
        }
    };

    // Calculate status counts
    const statusCounts = React.useMemo(() => {
        const counts = { total: tables.length, empty: 0, active: 0, warning: 0, critical: 0, served: 0 };
        tables.forEach(table => {
            const order = mockOrders[table.id.toString()];
            if (!order) {
                counts.empty++;
            } else if (order.served) {
                counts.served++;
            } else {
                const startTime = order.startTime;
                const diffMinutes = Math.floor((currentTime - startTime) / 60000);
                if (diffMinutes >= 15) counts.critical++;
                else if (diffMinutes >= 10) counts.warning++;
                else counts.active++;
            }
        });
        return counts;
    }, [tables, mockOrders, currentTime]);

    if (status === 'loading') {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    return (
        <div className="md-management-page pb-20">
            <div className="bg-white py-3 border-t border-b border-gray-200">
                <div className="flex items-center gap-2 w-full max-w-[1200px] mx-auto px-[20px] justify-between overflow-x-auto no-scrollbar">
                    <div className="flex items-center gap-4">
                        <p className="item-info flex items-center gap-1 m-0 text-sm text-blue-500 font-bold">
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            <span>&lt; 10p: <span className="text-gray-900">{statusCounts.active}</span></span>
                        </p>
                        <p className="item-info flex items-center gap-1 m-0 text-sm text-yellow-500 font-bold">
                            <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                            <span>&ge; 10p: <span className="text-gray-900">{statusCounts.warning}</span></span>
                        </p>
                        <p className="item-info flex items-center gap-1 m-0 text-sm text-red-500 font-bold">
                            <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                            <span>&ge; 15p: <span className="text-gray-900">{statusCounts.critical}</span></span>
                        </p>
                    </div>
                </div>
            </div>
            <div className="md-management-page__content py-4 md:py-8">
                <div className="w-full max-w-[1200px] mx-auto px-[20px] flex items-start gap-3 md:gap-4 flex-col">
                    {error && (
                        <div className="w-full bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            {error}
                        </div>
                    )}

                    <div className="list-tables w-full flex-1 grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
                        {tables.map((table, index) => {
                            const highlightClass = getTableHighlightClass(table.id);

                            return (
                                <div
                                    key={table.id}
                                    onClick={() => handleTableClick(table)}
                                    className={`bg-white p-2 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col items-center justify-center gap-2 cursor-pointer ${highlightClass}`}
                                >
                                    <span className="text-lg font-bold">{index + 1}</span>
                                    <div className="w-full h-[1px] bg-current opacity-20 rounded-full"></div>
                                    <span className="mt-1 text-[10px] uppercase tracking-wider font-semibold">
                                        {getDurationText(table.id)}
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
                </div>
            </div>

            {/* Detail Popup Modal */}
            {selectedTable && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="p-4 md:p-6 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h5>Chi tiết bàn {tables.findIndex(t => t.id === selectedTable.id) + 1}</h5>
                            </div>
                            <button
                                onClick={() => setSelectedTable(null)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors border-none bg-transparent cursor-pointer"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="px-2 py-4 md:p-6">
                            <div className="space-y-4">
                                {mockOrders[selectedTable.id.toString()].items.map((item, idx) => {
                                    const itemDiff = Math.floor((currentTime - item.orderTime) / 60000);

                                    return (
                                        <div key={idx} className="flex justify-between items-start bg-gray-50 p-4 rounded-2xl border border-gray-100 group hover:border-orange-200 transition-colors">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-gray-800">{item.name}</span>
                                                    <span className="text-[11px] font-black text-orange-500 bg-orange-50 px-2 py-0.5 rounded-lg">x{item.quantity}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 mt-2 text-[11px] text-gray-400 font-bold uppercase tracking-wider">
                                                    <svg className="w-3.5 h-3.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                    <span>Đã đặt: <span className="text-gray-600">{itemDiff} phút trước</span></span>
                                                </div>
                                            </div>
                                            <div className={`w-2 h-2 rounded-full mt-2 ${itemDiff >= 15 ? 'bg-red-400' : itemDiff >= 10 ? 'bg-yellow-400' : 'bg-blue-500'}`}></div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="py-4 px-2 md:p-6 pt-0">
                            <button
                                onClick={() => setSelectedTable(null)}
                                className="w-full mdt-btn"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Bills;
