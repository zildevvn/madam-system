import React from 'react';
import { safeParseDate } from '../../shared/utils/dateUtils';
import { ADDITIONAL_ITEM_THRESHOLD_MS, NEW_ORDER_PULSING_TIMEOUT_S } from '../../shared/constants/orderThresholds';
import Icon from '../shared/Icon';

/**
 * Individual card representing a delayed dish and the tables waiting for it.
 * Memoized to prevent unnecessary re-renders.
 */
const DelayWarningCard = React.memo(({
    item,
    type,
    config,
    currentTimeTs,
    onCardClick
}) => {
    return (
        <div
            className={`item-food p-3 rounded-2xl border-2 transition-all bg-white cursor-pointer group ${config.border}`}
            onClick={() => onCardClick(item)}
        >
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <span className="text-[14px] font-black text-gray-800 leading-none">{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg text-white shadow-sm transition-all duration-300 ${config.bg}`}>
                        {item.maxDiff}P
                    </span>
                </div>
            </div>
            <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-1 items-center max-w-[70%]">
                    {item.tables.slice().sort((a, b) => a.orderTimeTs - b.orderTimeTs).map((t, tid) => {
                        const isAdditional = (t.orderTimeTs - t.orderStartTimeTs) > ADDITIONAL_ITEM_THRESHOLD_MS;
                        const isNew = (!t.status || t.status === 'pending') && isAdditional;
                        const isPulsing = isNew && ((currentTimeTs - t.orderTimeTs) / 1000 < NEW_ORDER_PULSING_TIMEOUT_S);
                        const hasNote = item.tableNotes?.some(tn => tn.tableName === t.name);

                        return (
                            <span key={tid} className={`text-[12px] font-bold text-gray-900 bg-gray-50 px-1.5 py-0.5 rounded uppercase flex items-center gap-1`}>
                                {isNew && (
                                    <Icon name="plusCircle" className={`w-2.5 h-2.5 text-red-500 ${isPulsing ? 'animate-pulse' : ''}`} size={10} />
                                )}
                                Bàn {t.name.toString().replace(/^Bàn\s+/i, '')}
                                {hasNote && (
                                    <span className="text-orange-600 ml-1 flex items-center">
                                        <Icon name="message" className="w-3 h-3" size={12} />
                                    </span>
                                )}
                            </span>
                        );
                    })}
                </div>
                <span className={`text-[14px] font-black group-hover:scale-110 transition-transform ${config.color}`}>x{item.totalQuantity}</span>
            </div>
        </div>
    );
});

export default DelayWarningCard;
