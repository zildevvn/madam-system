import React, { useState, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchTables } from '../store/slices/tableSlice';
import ActiveOrderTableList from '../components/ActiveOrderTableList';
import DelayWarnings from '../components/DelayWarnings';

const STATUS_CONFIG = {
    pending: { label: 'Chờ', colorClass: 'bg-blue-50 text-blue-600 border-blue-100', dotClass: 'bg-blue-500' },
    cooking: { label: 'Gội', colorClass: 'bg-orange-50 text-orange-600 border-orange-100', dotClass: 'bg-orange-500 animate-pulse' },
    ready: { label: 'Xong', colorClass: 'bg-green-50 text-green-600 border-green-100', dotClass: 'bg-green-500' },
    served: { label: 'Đã giao', colorClass: 'bg-gray-50 text-gray-400 border-gray-100', dotClass: 'bg-gray-300' }
};

const Kitchen = () => {
    const dispatch = useAppDispatch();
    const { status: tableStatus } = useAppSelector(state => state.table);
    const tables = useAppSelector(state => state.table.allIds.map(id => state.table.byId[id]));
    const [currentTime, setCurrentTime] = useState(new Date());

    const orders = useMemo(() => {
        return tables
            .filter(t => t.active_order && t.active_order.items)
            .map(t => ({
                id: t.active_order.id,
                tableId: t.id,
                tableName: t.name || `Bàn ${t.id}`,
                startTime: new Date(t.active_order.created_at || t.active_order.updated_at),
                items: t.active_order.items.map(item => ({
                    id: item.id,
                    name: item.product?.name || 'Unknown',
                    quantity: item.quantity,
                    status: item.status || 'pending',
                    orderTime: new Date(item.created_at)
                }))
            }));
    }, [tables]);

    useEffect(() => {
        if (tableStatus === 'idle') {
            dispatch(fetchTables());
        }
    }, [tableStatus, dispatch]);

    useEffect(() => {
        if (window.Echo) {
            const channel = window.Echo.channel('orders');
            
            const handleUpdate = (e) => {
                console.log('Real-time order update received:', e);
                dispatch(fetchTables());
            };

            channel.listen('.order_created', handleUpdate)
                   .listen('.order_updated', handleUpdate)
                   .listen('.item_status_updated', handleUpdate);

            return () => {
                window.Echo.leaveChannel('orders');
            };
        }
    }, [dispatch]);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 10000);
        return () => clearInterval(timer);
    }, []);

    const handleItemStatusChange = async (orderId, itemId) => {
        // Find current status to calculate next shift
        const targetOrder = orders.find(o => o.id === orderId);
        if (!targetOrder) return;
        const targetItem = targetOrder.items.find(i => i.id === itemId);
        if (!targetItem) return;

        let nextStatus = 'pending';
        if (targetItem.status === 'pending') nextStatus = 'cooking';
        else if (targetItem.status === 'cooking') nextStatus = 'ready';
        else if (targetItem.status === 'ready') nextStatus = 'served';

        try {
            await window.axios.put(`/api/order-items/${itemId}/status`, { status: nextStatus });
        } catch (error) {
            console.error('Failed to update item status:', error);
        }
    };


    // --- CENTER COLUMN LOGIC (Consolidated Items) ---
    const consolidatedItems = useMemo(() => {
        const itemMap = {};
        orders.forEach(order => {
            order.items.forEach(item => {
                if (item.status === 'served') return;
                if (!itemMap[item.name]) {
                    itemMap[item.name] = { name: item.name, quantity: 0, pending: 0, cooking: 0, ready: 0 };
                }
                itemMap[item.name].quantity += item.quantity;
                itemMap[item.name][item.status] += item.quantity;
            });
        });
        return Object.values(itemMap).sort((a, b) => b.quantity - a.quantity);
    }, [orders]);


    return (
        <div className="md-management-page mdt-kitchen-page !pt-0 pb-20 min-h-screen bg-gray-50">
            <div className="max-w-[1600px] mx-auto px-6 py-4 h-[calc(100vh-40px)] overflow-hidden">
                <div className="grid grid-cols-12 gap-6 h-full">

                    {/* LEFT COLUMN: Table List (25%) */}
                    <div className="col-span-3 bg-gray-50/50 rounded-3xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
                        <ActiveOrderTableList
                            tables={tables}
                            orders={orders}
                            currentTime={currentTime}
                        />
                    </div>

                    {/* CENTER COLUMN: All Items Summary (50%) */}
                    <div className="col-span-6 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                            <h5 className="tracking-widest m-0">Tổng hợp món đang làm</h5>
                            <span className="text-xs font-bold bg-orange-100 text-orange-600 px-3 py-1 rounded-full uppercase">
                                {consolidatedItems.length} loại món
                            </span>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 hide-scrollbar">
                            {consolidatedItems.length > 0 ? (
                                <div className="space-y-3">
                                    {consolidatedItems.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-3xl border border-transparent hover:border-orange-200 transition-colors group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-xl font-black text-orange-500 shadow-sm border border-gray-100">
                                                    {item.quantity}
                                                </div>

                                                <h6 className="m-0">{item.name}</h6>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-gray-300 italic py-20">
                                    <svg className="w-16 h-16 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    <p>Không có món nào đang chờ xử lý</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Time Warnings (25%) */}
                    <div className="col-span-3">
                        <DelayWarnings
                            tables={tables}
                            orders={orders}
                            currentTime={currentTime}
                            onItemClick={handleItemStatusChange}
                            statusConfig={STATUS_CONFIG}
                        />
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Kitchen;