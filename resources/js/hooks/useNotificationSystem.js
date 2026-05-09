import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { 
    fetchNotificationsAsync, 
    markNotificationAsReadAsync,
    selectHasNewNotification,
    selectLatestNotification,
    selectNotificationLastUpdated,
    selectNotificationSequence
} from '../store/slices/notificationSlice';

/**
 * useNotificationSystem Hook
 * [WHY] Decouples notification logic (expiry timers, API synchronization) 
 * from the Header component while adhering to Rule 412 (Redux as source of truth).
 */
export const useNotificationSystem = (user) => {
    const dispatch = useAppDispatch();
    
    // [RULE] Select from Redux state instead of local useState
    const messages = useAppSelector(state => state.notification.messages);
    const hasNewNotification = useAppSelector(selectHasNewNotification);
    const latestMessage = useAppSelector(selectLatestNotification);
    const lastUpdated = useAppSelector(selectNotificationLastUpdated);
    const socketSequence = useAppSelector(selectNotificationSequence);

    const checkNotifications = useCallback(() => {
        if (!user) return;
        dispatch(fetchNotificationsAsync(user.id));
    }, [user, dispatch]);

    // Initial check
    useEffect(() => {
        if (user) {
            checkNotifications();
        }
    }, [user, checkNotifications]);

    const markAsRead = useCallback((messageId) => {
        if (!user) return;
        dispatch(markNotificationAsReadAsync({ messageId, userId: user.id }));
    }, [user, dispatch]);

    // Expiry timer and auto-mark-as-read logic (10-minute rule)
    useEffect(() => {
        if (hasNewNotification && messages.length > 0) {
            const now = Date.now();
            let earliestExpiry = Infinity;
            const expiredIds = [];

            messages.forEach(msg => {
                if (msg.is_read) return;
                let msgTime = new Date(msg.created_at).getTime();
                if (isNaN(msgTime) && msg.created_at) {
                    msgTime = new Date(msg.created_at.replace(' ', 'T')).getTime();
                }

                if (!isNaN(msgTime)) {
                    const expiry = msgTime + 10 * 60 * 1000;
                    if (expiry <= now) {
                        expiredIds.push(msg.id);
                    } else if (expiry < earliestExpiry) {
                        earliestExpiry = expiry;
                    }
                }
            });

            // 1. Handle already expired messages
            if (expiredIds.length > 0) {
                expiredIds.forEach(id => markAsRead(id));
            }

            // 2. Set timer for the next message that will expire
            if (earliestExpiry !== Infinity) {
                const remaining = earliestExpiry - now;
                const timer = setTimeout(() => {
                    checkNotifications();
                }, remaining + 500);
                return () => clearTimeout(timer);
            }
        }
    }, [hasNewNotification, messages, checkNotifications, markAsRead]);

    return {
        hasNewNotification,
        latestMessage,
        checkNotifications,
        markAsRead,
        socketSequence
    };
};
