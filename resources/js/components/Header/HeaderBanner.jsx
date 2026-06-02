import React, { useState, useEffect } from 'react';
import { useAppSelector } from '../../store/hooks';
import { selectHasNewNotification, selectLatestNotification } from '../../store/slices/notificationSlice';
import Icon from '../shared/Icon';

/**
 * Global banner to show critical system messages.
 * [WHY] Subscribes directly to the Redux store for real-time notification updates.
 * [RULE] Must update instantly across all pages/tabs when a new message arrives via WebSockets.
 * [RULE] Banner only displays for 5 minutes from message creation regardless of read status.
 */
const BANNER_TIMEOUT_MS = 5 * 60 * 1000;

const HeaderBanner = () => {
    const hasNewNotification = useAppSelector(selectHasNewNotification);
    const latestMessage = useAppSelector(selectLatestNotification);
    const [isWithinTimeRange, setIsWithinTimeRange] = useState(true);

    useEffect(() => {
        if (!latestMessage) return;

        // 1. Calculate time difference
        let msgTime = new Date(latestMessage.created_at).getTime();
        // Fallback for different date formats
        if (isNaN(msgTime) && typeof latestMessage.created_at === 'string') {
            msgTime = new Date(latestMessage.created_at.replace(' ', 'T')).getTime();
        }

        if (isNaN(msgTime)) return;

        const updateVisibility = () => {
            const diff = Date.now() - msgTime;
            if (diff >= BANNER_TIMEOUT_MS) {
                setIsWithinTimeRange(false);
            } else {
                setIsWithinTimeRange(true);
                // 2. Schedule automatic hiding
                const remainingTime = BANNER_TIMEOUT_MS - diff;
                const timer = setTimeout(() => {
                    setIsWithinTimeRange(false);
                }, remainingTime);
                return timer;
            }
        };

        const timer = updateVisibility();
        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [latestMessage?.id, latestMessage?.created_at]);

    if (!hasNewNotification || !latestMessage || !isWithinTimeRange) return null;

    return (
        <div className="bg-orange-500 text-white py-1.5 overflow-hidden border-b border-orange-600 shadow-sm animate-in slide-in-from-top duration-500">
            <div className="w-full flex items-center justify-center whitespace-nowrap">
                <div className="flex items-center gap-3 px-8">
                    <span className="flex items-center gap-1.5 font-black uppercase tracking-[0.15em] text-[10px] bg-white/20 px-2 py-0.5 rounded-full">
                        <Icon name="bell" className="w-3 h-3" size={12} strokeWidth={3} />
                        Message
                    </span>
                    <span className="text-[11px] md:text-[12px] font-bold uppercase tracking-wide">
                        {latestMessage.user?.name}: {latestMessage.content}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default HeaderBanner;
