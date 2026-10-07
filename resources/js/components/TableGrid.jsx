import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppSelector } from '../store/hooks';
import { selectTableIdToGroupKey } from '../store/selectors/tableSelectors';
import { getElapsedString } from '../shared/utils/formatTime';

// ── DefaultTableCard ──────────────────────────────────────────────────────────
/**
 * DefaultTableCard
 * [WHY] Extracted from TableGrid's inline default implementation so TableGrid
 * can remain a pure layout component (renderCard always required).
 * Used by StaffOrder and any consumer that doesn't supply its own renderCard.
 */
const DefaultTableCard = React.memo(({
    table,
    onTableClick,
    getElapsed,
    orderByGroupKey,
    tableIdToGroupKey,
}) => {
    const groupKey = tableIdToGroupKey[table.id.toString()];

    // [RULE] A table is busy if it has a direct order OR is part of a merge/group.
    const isBusy = !!table.active_order || !!groupKey;

    // [RULE] Primary = first ID in the dash-separated groupKey string.
    // If groupKey format changes, update this check and the selector together.
    const isPrimary = groupKey
        ? groupKey.split('-')[0] === table.id.toString()
        : true;

    // [FIX] Use pre-built orderByGroupKey map (O(1)) instead of tables.find() (O(N))
    // to avoid O(N²) complexity when rendering the full grid.
    const resolvedActiveOrder = table.active_order ||
        (groupKey ? orderByGroupKey[groupKey] : null);

    const statusText = !isBusy
        ? 'Bàn Trống'
        : !isPrimary
            ? 'Đang gộp'
            : resolvedActiveOrder?.created_at
                ? getElapsed(resolvedActiveOrder.created_at)
                : 'Đang xử lý';

    // [FIX] Replace /[^0-9]/g with prefix-only strip to preserve trailing letters
    // e.g. "Bàn 3A" → "3A" instead of "3"
    const displayName = table.name?.replace(/^[^\d]*/, '').trim() || table.name;

    return (
        <div
            onClick={() => onTableClick?.(table.id)}
            className={`bg-white p-2 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col items-center justify-center gap-2 cursor-pointer ${isBusy ? 'is-busy' : 'border border-gray-100'
                }`}
        >
            <span className="text-lg font-bold">{displayName}</span>
            <div className="w-full h-[1px] bg-current opacity-20 rounded-full" />
            <span className={`mt-1 text-[10px] uppercase tracking-wider font-semibold ${isBusy ? 'text-white' : 'text-gray-400'
                }`}>
                {statusText}
            </span>
        </div>
    );
});
DefaultTableCard.displayName = 'DefaultTableCard';


// ── TableGrid ─────────────────────────────────────────────────────────────────
/**
 * TableGrid
 * [WHY] Pure layout component — renders a responsive grid of table cards.
 * All card rendering is delegated to renderCard. If no renderCard is supplied,
 * falls back to DefaultTableCard which handles busy/group/elapsed logic.
 *
 * @param {Array}    tables        - Array of table objects from Redux/API
 * @param {Function} onTableClick  - Called with table.id when a card is clicked
 * @param {*}        error         - Truthy when the table list failed to load
 * @param {string}   gridClassName - Tailwind classes for the grid wrapper
 * @param {Function} renderCard    - (table, index, helpers) => JSX — optional
 */
const TableGrid = ({
    tables = [],
    onTableClick,
    error,
    gridClassName = 'list-tables w-full flex-1 grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4',
    renderCard,
}) => {
    const [now, setNow] = useState(new Date());
    const tableIdToGroupKey = useAppSelector(selectTableIdToGroupKey);

    // [WHY] 30s interval instead of 60s — getElapsedString may return seconds
    // for recent orders; 60s would make "Vừa xong" stale for too long.
    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 30000);
        return () => clearInterval(timer);
    }, []);

    // [FIX] useCallback so getElapsed reference is stable between renders
    // and only changes when `now` changes (every 30s).
    const getElapsed = useCallback(
        (timestamp) => getElapsedString(timestamp, now),
        [now]
    );

    // [FIX] Pre-build a groupKey → active_order map once per render cycle.
    // Replaces the O(N) tables.find() call inside the per-table map, reducing
    // overall complexity from O(N²) to O(N).
    const orderByGroupKey = useMemo(() => {
        const map = {};
        tables.forEach(t => {
            if (t.active_order) {
                const key = tableIdToGroupKey[t.id.toString()];
                if (key) map[key] = t.active_order;
            }
        });
        return map;
    }, [tables, tableIdToGroupKey]);

    return (
        <div className={gridClassName}>
            {/* Error state */}
            {error && (
                <div className="col-span-full py-20 text-center text-red-400 text-sm font-semibold">
                    Không thể tải dữ liệu bàn. Vui lòng thử lại.
                </div>
            )}

            {/* Empty state */}
            {!error && tables.length === 0 && (
                <div className="col-span-full py-20 text-center text-gray-400 text-sm">
                    Không tìm thấy dữ liệu bàn nào.
                </div>
            )}

            {/* Table cards */}
            {!error && tables.map((table, index) => {
                if (renderCard) {
                    // Consumer supplies full card — pass helpers in case they're useful
                    return renderCard(table, index, { getElapsed, orderByGroupKey, tableIdToGroupKey });
                }

                // Default StaffOrder-style card
                return (
                    <DefaultTableCard
                        key={table.id}
                        table={table}
                        onTableClick={onTableClick}
                        getElapsed={getElapsed}
                        orderByGroupKey={orderByGroupKey}
                        tableIdToGroupKey={tableIdToGroupKey}
                    />
                );
            })}
        </div>
    );
};

export default TableGrid;
export { DefaultTableCard };
