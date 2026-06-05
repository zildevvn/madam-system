import React from 'react';
import Icon from '../shared/Icon';

/**
 * LaneWrapper: Shared component for Cashier dashboard lanes.
 * Standardizes collapse styling, header layout, sizing, and animations.
 */
const LaneWrapper = ({
    children,
    containerClassName = '',
    isCollapsed,
    onToggleCollapse,
    title,
    collapsedTitle,
    subtitle,
    count,
    countLabel = 'Bàn',
    accentColor = 'gray', // 'gray' or 'orange'
    align = 'left', // 'left' (collapses left) or 'right' (collapses right)
}) => {
    const isExpanded = !isCollapsed;

    // Accent-specific visual classes
    const wrapperBorderClass = accentColor === 'orange' ? 'border-orange-100' : 'border-gray-100';
    const listBorderClass = accentColor === 'orange' ? 'border-orange-50' : 'border-gray-100';
    const titleColorClass = accentColor === 'orange' ? 'text-orange-600' : 'text-gray-900';
    const subtitleColorClass = accentColor === 'orange' ? 'text-orange-300' : 'text-gray-400';
    const buttonHoverClass = accentColor === 'orange' 
        ? 'hover:bg-orange-50 text-orange-400 hover:text-orange-600' 
        : 'hover:bg-gray-50 text-gray-400 hover:text-gray-600';
    const badgeClass = accentColor === 'orange' ? 'bg-orange-50 text-orange-600' : 'bg-gray-100 text-gray-500';

    // Chevron direction depends on alignment and state
    const chevronIcon = align === 'left'
        ? (isExpanded ? 'chevronLeft' : 'chevronRight')
        : (isExpanded ? 'chevronRight' : 'chevronLeft');

    return (
        <div className={`transition-all duration-500 ease-[cubic-bezier(0.23, 1, 0.32, 1)] ${containerClassName}`}>
            <div className={`py-4 ${isExpanded ? 'px-2' : 'px-1'} flex flex-col gap-6 bg-white rounded-[16px] shadow-sm border ${wrapperBorderClass} overflow-hidden min-h-[500px] min-w-full ${isExpanded ? 'lg:min-w-[400px]' : 'lg:min-w-[150px]'}`}>
                <div className="flex items-center justify-between px-2">
                    <div className="flex flex-col">
                        <h5 className={`mb-0 font-black uppercase tracking-tight ${titleColorClass} ${isExpanded ? 'text-[15px]' : 'text-[12px]'}`}>
                            {isExpanded ? title : collapsedTitle}
                        </h5>
                        {isExpanded && (
                            <span className={`text-[10px] font-bold uppercase tracking-widest leading-none mt-1 ${subtitleColorClass}`}>
                                {subtitle}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={onToggleCollapse}
                            className={`p-2 rounded-lg transition-colors flex items-center justify-center border-none bg-transparent cursor-pointer ${buttonHoverClass}`}
                            title={isExpanded ? 'Collapse View' : 'Expand View'}
                        >
                            <Icon name={chevronIcon} className="w-[18px] h-[18px]" size={18} />
                        </button>
                        <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${badgeClass}`}>
                            {count} {isExpanded ? countLabel : ''}
                        </span>
                    </div>
                </div>

                <div className={`cashier-page__list-tables bg-white rounded-[32px] shadow-sm border ${listBorderClass} flex flex-col overflow-hidden min-h-[400px]`}>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default React.memo(LaneWrapper);
