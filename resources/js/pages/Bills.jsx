import React, { useState, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { updateItemStatusAsync } from '../store/slices/orderSlice';
import { patchItemsStatus } from '../store/slices/tableSlice';
import { useConsolidatedOrders } from '../hooks/useConsolidatedOrders';
import TableDetailModal from '../components/TableDetailModal';
import BillsStatusBar from '../components/Bills/BillsStatusBar';
import BillsContent from '../components/Bills/BillsContent';

const Bills = () => {
    const dispatch = useAppDispatch();
    const [selectedTable, setSelectedTable] = useState(null);

    // Use consolidated logic hook with composite key grouping (product + note)
    const {
        orders,
        orderDict: activeOrders,
        activeTablesToDisplay,
        allTables,
        currentTime,
        status,
        error
    } = useConsolidatedOrders('food', true);

    const handleTableClick = (table) => {
        if (activeOrders[table.id.toString()]) {
            setSelectedTable(table);
        }
    };

    const handleToggleItemStatus = async (item, nextStatus) => {
        const ids = item.allIds || [item.id];
        const tableId = selectedTable.id;

        // 1. Optimistic Redux update — instant UI response, no waiting for API.
        //    patchItemsStatus also registers tableId in pendingTableIds to guard
        //    against stale fetchTables overwrites (race condition fix).
        dispatch(patchItemsStatus({ tableId, itemIds: ids, status: nextStatus }));

        try {
            // 2. Confirm via API. tableSlice.addMatcher handles the surgical store patch
            //    and clears the pendingTableIds counter on fulfillment.
            //    tableId is passed so the rejected matcher can also clear the guard.
            await Promise.all(ids.map(id =>
                dispatch(updateItemStatusAsync({ itemId: id, status: nextStatus, tableId })).unwrap()
            ));
        } catch (error) {
            // 3. Revert optimistic patch on failure.
            const revertStatus = nextStatus === 'served' ? 'ready' : 'served';
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
                counts.total += item.quantity;
                if (item.status === 'ready' || item.status === 'served') {
                    counts.served += item.quantity;
                } else {
                    const diffMinutes = Math.max(1, Math.floor((currentTime - item.orderTime) / 60000));
                    if (diffMinutes >= 20) counts.critical++;
                    else if (diffMinutes >= 10) counts.warning++;
                    else if (diffMinutes >= 5) counts.alert++;
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
        <div className="page-bill md-management-page pb-20 bg-gray-50">
            <BillsStatusBar statusCounts={statusCounts} />

            <BillsContent
                activeTablesToDisplay={activeTablesToDisplay}
                activeOrders={activeOrders}
                currentTime={currentTime}
                handleTableClick={handleTableClick}
                allTables={allTables}
                error={error}
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

export default Bills;
