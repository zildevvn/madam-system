import React from 'react';
import DelayWarningSection from './DelayWarningSection';

/**
 * Orchestrates the list of delay warning sections.
 * Decoupled: Iterates over the 'sections' array to render each category dynamically.
 */
const DelayWarningsList = React.memo(({ 
    buckets, 
    sections, 
    currentTimeTs, 
    onItemClick, 
    maxHeight 
}) => {
    // Check if any section has items to display
    const hasAnyItems = sections.some(section => buckets[section.id]?.length > 0);

    return (
        <div
            className="p-4 md:px-2 overflow-y-auto lg:overflow-y-auto flex-1 mdt-scrollbar bg-gray-50/20"
            style={{ maxHeight }}
        >
            {hasAnyItems ? (
                <>
                    {sections.map(section => (
                        <DelayWarningSection
                            key={section.id}
                            items={buckets[section.id] || []}
                            type={section.id}
                            config={section}
                            currentTimeTs={currentTimeTs}
                            onCardClick={onItemClick}
                        />
                    ))}
                </>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-300 italic py-10 opacity-60">
                    <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="text-xs">Không có món nào đang chờ</p>
                </div>
            )}
        </div>
    );
});

export default DelayWarningsList;
