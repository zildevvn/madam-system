import React from 'react';
import { useAppSelector } from '../../store/hooks';
import { selectHasNewNotification, selectLatestNotification } from '../../store/slices/notificationSlice';

/**
 * HeaderBanner Component
 * [WHY] Subscribes directly to the Redux store for real-time notification updates.
 * [RULE] Must update instantly across all pages/tabs when a new message arrives via WebSockets.
 */
const HeaderBanner = () => {
    const hasNewNotification = useAppSelector(selectHasNewNotification);
    const latestMessage = useAppSelector(selectLatestNotification);

    if (!hasNewNotification || !latestMessage) return null;

    return (
        <div className="bg-orange-500 text-white py-1.5 overflow-hidden border-b border-orange-600 shadow-sm animate-in slide-in-from-top duration-500">
            <div className="w-full flex items-center justify-center whitespace-nowrap">
                <div className="flex items-center gap-3 px-8">
                    <span className="flex items-center gap-1.5 font-black uppercase tracking-[0.15em] text-[10px] bg-white/20 px-2 py-0.5 rounded-full">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                        </svg>
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
