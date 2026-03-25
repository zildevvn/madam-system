import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchTables } from '../store/slices/tableSlice';
import TableList from '../components/TableList';
import DelayWarnings from '../components/DelayWarnings';

const Bills = () => {
    const dispatch = useAppDispatch();
    const { status, error } = useAppSelector(state => state.table);
    const tables = useAppSelector(state => state.table.allIds.map(id => state.table.byId[id]));
    const [selectedTable, setSelectedTable] = useState(null);
    const [currentTime, setCurrentTime] = useState(new Date());

    // Reactive map automatically compiled directly from the live API response mapped onto the Table Redux Store
    const mockOrders = React.useMemo(() => {
        const orderDict = {};
        tables.forEach(t => {
            if (t.active_order && t.active_order.items) {
                const allDone = t.active_order.items.every(item => item.status === 'served');
                orderDict[t.id.toString()] = {
                    id: t.active_order.id,
                    startTime: new Date(t.active_order.created_at || t.active_order.updated_at),
                    served: allDone,
                    items: t.active_order.items.map(item => ({
                        id: item.id,
                        name: item.product?.name || 'Unknown',
                        quantity: item.quantity,
                        orderTime: new Date(item.created_at),
                        done: item.status === 'served',
                        status: item.status || 'pending'
                    }))
                };
            }
        });
        return orderDict;
    }, [tables]);

    const toggleItemStatus = async (tableId, itemIndex) => {
        const orderInfo = mockOrders[tableId.toString()];
        if (!orderInfo || !orderInfo.items[itemIndex]) return;

        const item = orderInfo.items[itemIndex];
        const nextStatus = item.status === 'served' ? 'ready' : 'served';

        try {
            await window.axios.put(`/api/order-items/${item.id}/status`, { status: nextStatus });
        } catch (error) {
            console.error('Failed to sync item status:', error);
        }
    };

    useEffect(() => {
        if (status === 'idle') {
            dispatch(fetchTables());
        }
    }, [status, dispatch]);

    useEffect(() => {
        if (window.Echo) {
            const channel = window.Echo.channel('orders');
            channel.listen('.OrderUpdated', (e) => {
                console.log('Real-time order update received:', e);
                dispatch(fetchTables());
            });

            return () => {
                window.Echo.leaveChannel('orders');
            };
        }
    }, [dispatch]);

    // Update current time every minute to refresh highlights
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

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
        <div className="md-management-page pb-20 bg-gray-50">
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
                <div className="w-full max-w-[1240px] mx-auto px-[20px]">
                    <div className="grid grid-cols-12 gap-6 md:gap-4">
                        {/* Left: Table List */}
                        <div className="col-span-12 md:col-span-8 lg:col-span-9 bg-gray-50/50 rounded-3xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
                            {error && (
                                <div className="w-full bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    {error}
                                </div>
                            )}

                            <TableList
                                tables={tables}
                                orders={mockOrders}
                                currentTime={currentTime}
                                onTableClick={handleTableClick}
                            />
                        </div>

                        {/* Right: Delay Warnings Sidebar */}
                        <div className="col-span-12 md:col-span-4 lg:col-span-3">
                            <DelayWarnings
                                tables={tables}
                                orders={mockOrders}
                                currentTime={currentTime}
                            />
                        </div>
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
                                        <div key={idx} className={`flex justify-between items-start p-4 rounded-2xl border transition-all duration-300 ${item.done ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-gray-100 shadow-sm hover:border-orange-200 group'}`}>
                                            <div className="flex items-center gap-4 flex-1">
                                                <div
                                                    onClick={() => toggleItemStatus(selectedTable.id, idx)}
                                                    className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all duration-300 ${item.done ? 'bg-green-500 border-green-500 shadow-lg shadow-green-100' : 'bg-white border-gray-200 hover:border-orange-400 group-hover:scale-110'}`}
                                                >
                                                    {item.done && (
                                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`font-bold transition-all duration-300 ${item.done ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                                                            {item.name}
                                                        </span>
                                                        <span className={`text-[11px] font-black px-2 py-0.5 rounded-lg transition-all duration-300 ${item.done ? 'bg-gray-100 text-gray-400' : 'bg-orange-50 text-orange-500'}`}>
                                                            x{item.quantity}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                                            {itemDiff} phút trước
                                                        </span>
                                                        {itemDiff >= 10 && !item.done && (
                                                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-1 ${itemDiff >= 15 ? 'bg-red-50 text-red-500' : 'bg-yellow-50 text-yellow-600'}`}>
                                                                <span className={`w-1 h-1 rounded-full animate-pulse ${itemDiff >= 15 ? 'bg-red-500' : 'bg-yellow-500'}`}></span>
                                                                TRỄ
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
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
