import React from 'react';
import DelayWarningCard from './DelayWarningCard';

/**
 * Renders a specific delay category section (Critical, Warning, etc.)
 */
const DelayWarningSection = React.memo(({ 
    items, 
    type, 
    config, 
    currentTimeTs, 
    onCardClick 
}) => {
    if (items.length === 0) return null;

    return (
        <div className="mb-6 animate-[fadeIn_0.3s_ease-out]">
            <div className={`px-3 py-1 flex items-center justify-between font-black text-[12px] border-l-4 rounded-r-md bg-white mb-3 shadow-sm border-[rgba(0,0,0,0.05)] ${config.color === 'text-red-600' ? 'mdt-border-red ' : config.color === 'text-yellow-700' ? 'border-yellow-600' : config.color === 'text-blue-600' ? 'border-blue-600' : 'border-gray-400'}`}>
                <span>{config.title}</span>
                <span className={`px-2 py-0.5 rounded-full text-white ${config.bg}`}>{items.length} món</span>
            </div>

            <div className="space-y-3">
                {items.map((item, idx) => (
                    <DelayWarningCard
                        key={item.id ?? `${item.name}-${idx}`}
                        item={item}
                        type={type}
                        config={config}
                        currentTimeTs={currentTimeTs}
                        onCardClick={onCardClick}
                    />
                ))}
            </div>
        </div>
    );
});

export default DelayWarningSection;
