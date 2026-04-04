import React, { useMemo } from 'react';
import { useAppDispatch } from '../store/hooks';
import { updateItemStatusAsync } from '../store/slices/orderSlice';
import { useConsolidatedOrders } from '../hooks/useConsolidatedOrders';
import ActiveOrderTableList from '../components/ActiveOrderTableList';
import DelayWarnings from '../components/DelayWarnings';

const Bar = () => {
    const dispatch = useAppDispatch();
    // Use consolidated logic hook for drinks
    const { 
        orders, 
        orderDict: activeOrders, 
        activeTablesToDisplay, 
        allTables,
        currentTime,
        status: tableStatus
    } = useConsolidatedOrders('drink');

    const handleItemStatusChange = async (orderId, itemIds) => {
        const ids = Array.isArray(itemIds) ? itemIds : [itemIds];
        const targetOrder = orders.find(o => o.id === orderId);
        if (!targetOrder) return;
        
        // Find the first item to determine the next status cycle for the whole group
        const firstItem = targetOrder.items.find(i => ids.includes(i.id));
        if (!firstItem) return;

        let nextStatus = 'pending';
        if (firstItem.status === 'pending') nextStatus = 'cooking';
        else if (firstItem.status === 'cooking') nextStatus = 'ready';
        else if (firstItem.status === 'ready') nextStatus = 'served';

        try {
            await Promise.all(ids.map(id => dispatch(updateItemStatusAsync({ itemId: id, status: nextStatus })).unwrap()));
        } catch (error) {
            console.error('Failed to batch update item status:', error);
        }
    };

    const consolidatedItems = useMemo(() => {
        const itemMap = {};
        orders.forEach(order => {
            order.items.forEach(item => {
                if (item.status === 'served') return;
                if (!itemMap[item.name]) {
                    itemMap[item.name] = { name: item.name, quantity: 0, tables: [] };
                }
                itemMap[item.name].quantity += item.quantity;
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
            <div className="bg-white py-3 border-t border-b border-gray-200">
                <div className="flex items-center gap-2 w-full max-w-[1600px] mx-auto px-4 lg:px-6 justify-between overflow-x-auto no-scrollbar">
                    <div className="flex items-center gap-4">
                        <p className="item-info flex items-center gap-1 m-0 text-sm mdt-text-primary font-bold">
                            <span className="w-2 h-2 mdt-bg-red rounded-full"></span>
                            <span>Bar: <span className="text-gray-900">{consolidatedItems.length} loại đồ uống</span></span>
                        </p>
                    </div>
                </div>
            </div>

            <div className="md-management-page__content py-4 lg:py-8">
                <div className="max-w-[1600px] mx-auto px-4 lg:px-6">
                    <div className="grid grid-cols-12 gap-4 lg:gap-6">
                        <div className="col-span-12 md:col-span-4 lg:col-span-3 bg-gray-50/50 rounded-3xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
                            <ActiveOrderTableList
                                tables={activeTablesToDisplay}
                                orders={activeOrders}
                                currentTime={currentTime}
                                filterType="drink"
                                title="Quầy Bar"
                            />
                        </div>

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

                        <div className="col-span-12 lg:col-span-3">
                            <DelayWarnings
                                tables={allTables}
                                orders={activeOrders}
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
