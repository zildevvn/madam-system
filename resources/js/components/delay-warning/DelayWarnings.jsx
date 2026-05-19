import React, { useState } from 'react';
import { safeParseDate } from '../../shared/utils/dateUtils';
import { useDelayWarningsData } from '../../shared/hooks/useDelayWarningsData';
import DelayWarningsHeader from './DelayWarningsHeader';
import DelayWarningsList from './DelayWarningsList';
import DelayWarningModal from './DelayWarningModal';

/**
 * Main sidebar orchestrator for delayed orders.
 * Refactored into a highly modular structure to prevent "God Component" patterns.
 */
const DelayWarnings = ({
    onItemClick,
    title = "Cảnh báo trễ",
    maxHeight = "calc(100vh - 150px)",
    tables,
    orders,
    currentTime,
    filterType = null,
    isBar = false,
    onToggleStatus
}) => {
    const [selectedItem, setSelectedItem] = useState(null);

    // 1. Logic Layer: Data processing
    const buckets = useDelayWarningsData(orders, tables, currentTime, filterType, isBar);
    const currentTimeTs = React.useMemo(() => safeParseDate(currentTime).getTime(), [currentTime]);

    // 2. Configuration Layer: UI Styles (Ordered array to decouple from specific keys)
    const sections = React.useMemo(() => [
        {
            id: 'critical',
            title: isBar ? 'Thức uống trễ (>= 5p)' : 'Món ăn trễ (>= 20p)',
            color: 'text-red-600',
            bg: 'mdt-bg-red ',
            border: 'mdt-border-red shadow-red-100'
        },
        {
            id: 'warning',
            title: 'Món ăn trễ (10p - 20p)',
            color: 'text-yellow-700',
            bg: 'bg-yellow-500',
            border: 'border-yellow-200 shadow-yellow-100'
        },
        {
            id: 'alert',
            title: 'Món ăn trễ (5p - 10p)',
            color: 'text-blue-600',
            bg: 'bg-blue-500',
            border: 'border-blue-200 shadow-blue-100'
        },
        {
            id: 'active',
            title: isBar ? 'Thức uống (1p - 5p)' : 'Món ăn (1p - 5p)',
            color: 'text-gray-500',
            bg: 'bg-gray-400',
            border: 'border-gray-200 shadow-gray-100'
        }
    ], [isBar]);

    // 3. UI Layer: Orchestration
    return (
        <div className="mdt-delay-warnings bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col lg:overflow-hidden lg:h-full">
            <DelayWarningsHeader title={title} />
            
            <DelayWarningsList 
                buckets={buckets}
                sections={sections}
                currentTimeTs={currentTimeTs}
                onItemClick={setSelectedItem}
                maxHeight={maxHeight}
            />

            <DelayWarningModal
                item={selectedItem}
                onClose={() => setSelectedItem(null)}
                onToggleStatus={onToggleStatus}
                currentTime={currentTime}
            />
        </div>
    );
};

export default DelayWarnings;
