import React, { useState, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchTables } from '../store/slices/tableSlice';
import ActiveOrderTableList from '../components/ActiveOrderTableList';
import DelayWarnings from '../components/DelayWarnings';

const Bar = () => {
    const dispatch = useAppDispatch();
    const { status: tableStatus } = useAppSelector(state => state.table);
    const tables = useAppSelector(state => state.table.allIds.map(id => state.table.byId[id]));
    const [currentTime, setCurrentTime] = useState(new Date());

    const orders = useMemo(() => {
        const handledOrderIds = new Set();
        return tables
            .filter(t => {
                if (t.active_order && t.active_order.items) {
                    if (handledOrderIds.has(t.active_order.id)) return false;
                    handledOrderIds.add(t.active_order.id);
                    return true;
                }
                return false;
            })
            .map(t => ({
                id: t.active_order.id,
                tableId: t.id,
                tableName: t.name || `Bàn ${t.id}`,
                startTime: new Date(t.active_order.created_at || t.active_order.updated_at),
                items: t.active_order.items
                    .filter(item => (item.product?.type === 'drink') || (item.type === 'drink'))
                    .map(item => ({
                        id: item.id,
                        name: item.product?.name || 'Unknown',
                        quantity: item.quantity,
                        status: item.status || 'pending',
                        orderTime: new Date(item.created_at),
                        product: item.product,
                        type: item.type || item.product?.type
                    }))
            }))
            .filter(o => o.items.length > 0);
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

    const consolidatedItems = useMemo(() => {
        const itemMap = {};
        orders.forEach(order => {
            order.items.forEach(item => {
                if (item.status === 'served') return;
                if (!itemMap[item.name]) {
                    itemMap[item.name] = { 
                        name: item.name, 
                        quantity: 0, 
                        pending: 0, 
                        cooking: 0, 
                        ready: 0,
                        tables: [] 
                    };
                }
                itemMap[item.name].quantity += item.quantity;
                itemMap[item.name][item.status] += item.quantity;
                
                const tableIdentifier = order.mergedTables || order.tableName?.replace(/[^0-9]/g, '') || order.tableId;
                if (!itemMap[item.name].tables.includes(tableIdentifier)) {
                    itemMap[item.name].tables.push(tableIdentifier);
                }
            });
        });
        return Object.values(itemMap).sort((a, b) => b.quantity - a.quantity);
    }, [orders]);

    return (
        <div className="md-management-page mdt-bar-page pb-20 bg-gray-50 min-h-screen">
            {/* FIRST CHILD: Fixed Status Bar (Automatic positioning via CSS) */}
            <div className="bg-white py-3 border-t border-b border-gray-200">
                <div className="flex items-center gap-2 w-full max-w-[1600px] mx-auto px-4 lg:px-6 justify-between overflow-x-auto no-scrollbar">
                    <div className="flex items-center gap-4">
                        <p className="item-info flex items-center gap-1 m-0 text-sm text-orange-500 font-bold">
                            <span className="w-2 h-2 mdt-bg-red rounded-full"></span>
                            <span>Bar: <span className="text-gray-900">{consolidatedItems.length} loại đồ uống</span></span>
                        </p>
                        <p className="item-info flex items-center gap-1 m-0 text-sm text-blue-500 font-bold">
                            <span className="w-2 h-2 mdt-bg-blue rounded-full"></span>
                            <span>Trạng thái: <span className="text-gray-900">Đang hoạt động</span></span>
                        </p>
                    </div>
                </div>
            </div>

            {/* SECOND CHILD: Scrollable Content Wrapper */}
            <div className="md-management-page__content py-4 lg:py-8">
                <div className="max-w-[1600px] mx-auto px-4 lg:px-6">
                    <div className="grid grid-cols-12 gap-4 lg:gap-6">

                        {/* LEFT COLUMN: Table List (Adaptive Width) */}
                        <div className="col-span-12 md:col-span-4 lg:col-span-3 bg-gray-50/50 rounded-3xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
                            <ActiveOrderTableList
                                tables={tables}
                                orders={orders}
                                currentTime={currentTime}
                                filterType="drink"
                                title="Quầy Bar"
                            />
                        </div>

                        {/* CENTER COLUMN: Drink List (Adaptive Width) */}
                        <div className="col-span-12 md:col-span-8 lg:col-span-6 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
                            <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                                <h5 className="tracking-widest m-0"> Danh sách Thức uống </h5>
                                <span className="text-xs font-bold bg-orange-100 mdt-text-primary px-3 py-1 rounded-full uppercase">
                                    {consolidatedItems.length} loại đồ uống
                                </span>
                            </div>
                            <div className="p-6 flex-1">
                                {consolidatedItems.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                                        {consolidatedItems.map((item, idx) => (
                                            <div key={idx} className="flex items-center justify-between px-2 py-3 bg-gray-50 rounded-xl border border-transparent hover:border-orange-200 transition-colors group">
                                            <div className="flex flex-col gap-1 flex-1">
                                                <h6 className="m-0 text-sm md:text-base font-bold text-gray-800">{item.name}</h6>
                                                <div className="flex flex-wrap gap-1">
                                                    {item.tables.map((t, tid) => (
                                                        <span key={tid} className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-500 uppercase tracking-tighter">
                                                            Bàn {t}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-center text-sm font-black text-blue-600 bg-blue-50 w-10 h-10 rounded-xl shadow-sm border border-blue-100">
                                                X{item.quantity}
                                            </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-gray-300 italic py-20">
                                        <svg className="w-16 h-16 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 21a9 9 0 0 0 9-9H3a9 9 0 0 0 9 9Z" /><path d="M7 21h10" /><path d="M12 3v5" /></svg>
                                        <p>Không có đồ uống nào đang chờ</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Time Warnings (Full width on Tablet, 1/4 on Desktop) */}
                        <div className="col-span-12 lg:col-span-3">
                            <DelayWarnings
                                tables={tables}
                                orders={orders}
                                currentTime={currentTime}
                                onItemClick={handleItemStatusChange}
                                filterType="drink"
                                title="Đồ uống trễ"
                            />
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default Bar;
