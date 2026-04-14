import React, { useState, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { updateItemStatusAsync } from '../store/slices/orderSlice';
import { patchItemsStatus } from '../store/slices/tableSlice';
import { useConsolidatedOrders } from '../hooks/useConsolidatedOrders';
import TableDetailModal from '../components/TableDetailModal';
import BillsStatusBar from '../components/Bills/BillsStatusBar';
import BillsContent from '../components/Bills/BillsContent';

const Bar = () => {
    const dispatch = useAppDispatch();
    const [selectedTable, setSelectedTable] = useState(null);

    // Use consolidated logic hook for drinks with composite key grouping
    const {
        orders,
        orderDict: activeOrders,
        activeTablesToDisplay,
        allTables,
        currentTime,
        status,
        error
    } = useConsolidatedOrders('drink', true);

    const handleTableClick = (table) => {
        if (activeOrders[table.id.toString()]) {
            setSelectedTable(table);
        }
    };

    const handleToggleItemStatus = async (item, nextStatus) => {
        const ids = item.allIds || [item.id];
        const tableId = selectedTable.id;

        // Optimistic Redux update
        dispatch(patchItemsStatus({ tableId, itemIds: ids, status: nextStatus }));

        try {
            // Confirm via API
            await Promise.all(ids.map(id =>
                dispatch(updateItemStatusAsync({ itemId: id, status: nextStatus, tableId })).unwrap()
            ));
        } catch (error) {
            // Revert optimistic patch on failure
            const revertStatus = nextStatus === 'served' ? 'ready' : (nextStatus === 'ready' ? 'cooking' : 'pending');
            dispatch(patchItemsStatus({ tableId, itemIds: ids, status: revertStatus }));
            console.error('Failed to sync item status:', error);
        }
    };

    const statusCounts = useMemo(() => {
        const counts = { active: 0, alert: 0, warning: 0, critical: 0, served: 0, total: 0 };
        const handledOrderIds = new Set();

        orders.forEach(order => {
            if (handledOrderIds.has(order.id)) return;
            handledOrderIds.add(order.id);

            order.items.forEach(item => {
                if (item.product?.type !== 'drink' && item.type !== 'drink') return;
                
                counts.total += item.quantity;
                if (item.status === 'ready' || item.status === 'served') {
                    counts.served += item.quantity;
                } else {
                    const diffMinutes = Math.max(1, Math.floor((currentTime - item.orderTime) / 60000));
                    // Bar logic: >= 5 mins is critical
                    if (diffMinutes >= 5) counts.critical++;
                    else counts.active++;
                }
            });
        });
        return counts;
    }, [orders, currentTime]);

    if (status === 'loading' && allTables.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    return (
        <div className="md-management-page mdt-bar-page pb-20 bg-gray-50">
            <BillsStatusBar statusCounts={statusCounts} isBar={true} />

            <BillsContent
                activeTablesToDisplay={activeTablesToDisplay}
                activeOrders={activeOrders}
                currentTime={currentTime}
                handleTableClick={handleTableClick}
                allTables={allTables}
                error={error}
                isBar={true}
            />

            {selectedTable && activeOrders[selectedTable.id.toString()] && (
                <TableDetailModal
                    tableId={selectedTable.id}
                    tableIndex={allTables.findIndex(t => t.id === selectedTable.id)}
                    mergedTables={activeOrders[selectedTable.id.toString()].mergedTables}
                    orderItems={activeOrders[selectedTable.id.toString()].items}
                    currentTime={currentTime}
                    onClose={() => setSelectedTable(null)}
                    onToggleStatus={handleToggleItemStatus}
                />
            )}
        </div>
    );
};

export default Bar;
