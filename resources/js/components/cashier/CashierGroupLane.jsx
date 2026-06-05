import React from 'react';
import ActiveOrderTableList from '../ActiveOrderTableList';
import LaneWrapper from './LaneWrapper';

/**
 * CashierGroupLane: Renders the right lane of the Cashier dashboard 
 * dedicated to group reservations and merged table orders.
 */
const CashierGroupLane = ({
    containerClassName,
    isCollapsed,
    groupTables,
    groupOrders,
    currentTime,
    onTableClick,
    onToggleCollapse
}) => {
    return (
        <LaneWrapper
            containerClassName={containerClassName}
            isCollapsed={isCollapsed}
            onToggleCollapse={onToggleCollapse}
            title="Khách Đoàn"
            collapsedTitle="Đoàn"
            subtitle="Group Reservations"
            count={groupTables.length}
            countLabel="Đoàn"
            accentColor="orange"
            align="right"
        >
            <ActiveOrderTableList
                tables={groupTables}
                orders={groupOrders}
                currentTime={currentTime}
                onTableClick={onTableClick}
                showSimpleView={true}
                showPrintedState={true}
                className="mdt-list-tables__bg-primary"
            />
        </LaneWrapper>
    );
};

export default React.memo(CashierGroupLane);
