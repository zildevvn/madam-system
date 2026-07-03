import React from 'react';
import ActiveOrderTableList from '../ActiveOrderTableList';
import Icon from '../shared/Icon';
import LaneWrapper from './LaneWrapper';

/**
 * CashierIndividualLane: Renders the left lane of the Cashier dashboard 
 * dedicated to individual (non-group) tables.
 */
const CashierIndividualLane = ({
    containerClassName,
    isCollapsed,
    individualTables,
    individualOrders,
    currentTime,
    onTableClick,
    onToggleCollapse,
    onMergeBack
}) => {
    // [WHY] Sort tables strictly on the Cashier page to ensure 1 -> 2 -> 3 natural order
    const sortedIndividualTables = React.useMemo(() => {
        return [...individualTables].sort((a, b) =>
            String(a.name || '').localeCompare(String(b.name || ''), undefined, { numeric: true, sensitivity: 'base' })
        );
    }, [individualTables]);

    return (
        <LaneWrapper
            containerClassName={containerClassName}
            isCollapsed={isCollapsed}
            onToggleCollapse={onToggleCollapse}
            title="Khách Lẻ"
            collapsedTitle="Lẻ"
            subtitle="Individual Tables"
            count={sortedIndividualTables.length}
            countLabel="Bàn"
            accentColor="gray"
            align="left"
        >
            <ActiveOrderTableList
                tables={sortedIndividualTables}
                orders={individualOrders}
                currentTime={currentTime}
                onTableClick={onTableClick}
                onMergeBack={onMergeBack}
                showSimpleView={true}
                showPrintedState={true}
            />
            {sortedIndividualTables.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 opacity-30">
                    <Icon name="grid" className="w-12 h-12" size={48} strokeWidth={1.5} />
                    <p className="text-[11px] font-bold mt-4 uppercase tracking-widest">Không có khách lẻ</p>
                </div>
            )}
        </LaneWrapper>
    );
};

export default React.memo(CashierIndividualLane);
