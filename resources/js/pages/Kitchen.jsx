import React, { useMemo } from 'react';
import { useAppDispatch } from '../store/hooks';
import { updateItemStatusAsync } from '../store/slices/orderSlice';
import { useConsolidatedOrders } from '../hooks/useConsolidatedOrders';
import ActiveOrderTableList from '../components/ActiveOrderTableList';
import DelayWarnings from '../components/DelayWarnings';
import KitchenDishList from '../components/Kitchen/KitchenDishList';

const Kitchen = () => {
    const dispatch = useAppDispatch();
    // Use consolidated logic hook
    const {
        orders,
        orderDict: activeOrders,
        activeTablesToDisplay,
        allTables,
        currentTime,
        status: tableStatus
    } = useConsolidatedOrders('food');

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
        <div className="page-kitchen min-h-screen bg-gray-50 overflow-hidden">
            <div className="md-management-page__content h-[calc(100vh-60px)] p-4 lg:p-6 overflow-hidden">
                <div className="max-w-[1600px] mx-auto h-full">
                    <div className="grid grid-cols-12 gap-4 lg:gap-6 h-full">
                        <div className="col-span-12 md:col-span-4 lg:col-span-3 bg-gray-50/50 rounded-3xl shadow-sm border border-gray-100 flex flex-col overflow-hidden h-full">
                            <ActiveOrderTableList
                                tables={activeTablesToDisplay}
                                orders={activeOrders}
                                currentTime={currentTime}
                                filterType="food"
                            />
                        </div>

                        <KitchenDishList consolidatedItems={consolidatedItems} />

                        <div className="col-span-12 lg:col-span-3 h-full flex flex-col overflow-hidden">
                            <DelayWarnings
                                tables={allTables}
                                orders={activeOrders}
                                currentTime={currentTime}
                                onItemClick={handleItemStatusChange}
                                filterType="food"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Kitchen;