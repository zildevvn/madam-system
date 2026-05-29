import React from 'react';
import { calculateTableStatus } from '../shared/utils/activeOrderUtils';
import Icon from './shared/Icon';

const NewOrderIcon = () => (
    <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md border border-gray-100 overflow-hidden">
        <Icon name="plus" size={14} className="text-black" strokeWidth={3} />
    </div>
);

const NoteIcon = () => (
    <Icon name="message" size={12} strokeWidth={2.5} />
);

const ActiveOrderTableCard = React.memo(({
    table,
    order,
    currentTimeTs,
    onTableClick,
    options = {}
}) => {
    const { statusClass, duration, isNewOrder } = calculateTableStatus(order, currentTimeTs, options);

    const getDisplayName = () => {
        // [RULE] If the consolidation logic already provided a tableName, use it.
        // This is the most reliable source as it has already handled the ID-to-Name mapping.
        if (order?.tableName) {
            return order.tableName.replace(/^Bàn\s+/i, '');
        }

        // [FALLBACK] If tableName is missing (unlikely), manually resolve table_ids to names.
        if (order?.reservation?.type === 'group' && Array.isArray(order.reservation.table_ids)) {
            // NOTE: We don't have access to allTables here, so we hope the backend or 
            // previous consolidation step provided the name. 
            // If not, we resort to the merged_tables string which contains IDs.
            const raw = order.mergedTables || order.reservation.table_ids.join('-');
            return raw.toString().replace(/^Bàn\s+/i, '');
        }
        return (table.name || table.id.toString()).toString().replace(/^Bàn\s+/i, '');
    };

    const itemCounts = React.useMemo(() => {
        if (!options.showItemCounts || !order?.items) return null;

        const counts = order.items.reduce((acc, item) => {
            if (['pending', 'processing'].includes(item.status)) {
                acc.notCompleted += item.quantity;
            } else if (item.status === 'completed') {
                acc.notServed += item.quantity;
            }
            return acc;
        }, { notCompleted: 0, notServed: 0 });

        return counts;
    }, [order?.items, options.showItemCounts]);

    return (
        <div
            onClick={() => onTableClick && onTableClick(table)}
            className={`relative bg-white p-3 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col items-center justify-center gap-1 cursor-pointer ${statusClass} ${!statusClass ? 'border border-gray-100' : ''} ${table.isGroupLinked ? 'is-group-linked' : ''} ${table.groupColorIndex ? `is-group-color-${table.groupColorIndex}` : ''} ${table.isSplit ? 'is-split-bill' : ''}`}
        >

            <div className="absolute -top-1 -right-1 z-10">
                {isNewOrder && <NewOrderIcon />}
            </div>
            <span className={`label-table text-[18px] font-black text-center flex items-center justify-center gap-1.5 ${!statusClass ? 'text-gray-900' : ''}`}>

                {getDisplayName()}
            </span>

            <div className="flex items-center gap-2">

                <div className="flex items-center gap-2">
                    {order?.guestCount > 0 && (
                        <span className={`text-[10px] font-bold flex items-center gap-1 ${!statusClass ? 'text-gray-400' : ''}`}>
                            <Icon name="users" size={10} className="w-2.5 h-2.5" />
                            {order.guestCount}
                        </span>
                    )}

                    {(order?.orderNote || order?.items?.some(i => i.note)) && (
                        <span className={`text-[10px] font-bold flex items-center gap-1 ${!statusClass ? 'text-gray-400' : ''}`}>
                            <NoteIcon />
                        </span>
                    )}
                </div>

                {options.showItemCounts && itemCounts && (itemCounts.notCompleted > 0 || itemCounts.notServed > 0) && (
                    <div className="not-completed-count flex items-center gap-2">
                        {itemCounts.notCompleted > 0 && (
                            <span className={`text-[10px] font-bold flex items-center gap-0.5 ${!statusClass ? 'text-red-500' : ''}`} title="Chưa làm xong">
                                <Icon name="clock" size={10} className="w-2.5 h-2.5" />
                                {itemCounts.notCompleted}
                            </span>
                        )}
                        {itemCounts.notServed > 0 && (
                            <span className={`text-[10px] font-bold flex items-center gap-0.5 ${!statusClass ? 'text-orange-500' : ''}`} title="Chờ phục vụ (Chưa bưng)">
                                <Icon name="check" size={10} className="w-2.5 h-2.5" />
                                {itemCounts.notServed}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {duration && (
                <>
                    <div className="w-full h-[1px] bg-current opacity-20 rounded-full"></div>
                    <span className={`text-[8px] font-bold uppercase tracking-wider ${!statusClass ? 'text-gray-400' : ''}`}>
                        {duration}
                    </span>
                </>
            )}
        </div>
    );
});

export default ActiveOrderTableCard;
