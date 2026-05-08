import { useState, useEffect, useCallback } from 'react';
import { getSystemMessagesApi, markSystemMessageAsReadApi } from '../services/systemMessageService';

/**
 * useNotificationSystem Hook
 * [WHY] Decouples notification logic (fetching, marking as read, Echo listeners) 
 * from the Header component to adhere to SRP.
 */
export const useNotificationSystem = (user) => {
    const [hasNewNotification, setHasNewNotification] = useState(false);
    const [latestMessage, setLatestMessage] = useState(null);
    const [lastEventTime, setLastEventTime] = useState(0);

    const checkNotifications = useCallback(async () => {
        if (!user) return;
        try {
            const response = await getSystemMessagesApi(user.id);
            const messages = response.data || [];
            const now = Date.now();
            
            let hasRecentUnread = false;
            let foundLatest = null;
            let latestUnreadRecentTime = 0;
            let earliestUnreadRecentTime = Infinity;
            const expiredIds = [];

            messages.forEach(msg => {
                if (msg.is_read) return;
                
                let msgTime = new Date(msg.created_at).getTime();
                // Fallback for different date formats
                if (isNaN(msgTime) && msg.created_at) {
                    msgTime = new Date(msg.created_at.replace(' ', 'T')).getTime();
                }

                if (isNaN(msgTime)) return;

                const diff = now - msgTime;
                // Indicator shows for messages created in the last 10 minutes
                if (diff < 10 * 60 * 1000) {
                    hasRecentUnread = true;
                    if (msgTime > latestUnreadRecentTime) {
                        latestUnreadRecentTime = msgTime;
                        foundLatest = msg;
                    }
                    if (msgTime < earliestUnreadRecentTime) {
                        earliestUnreadRecentTime = msgTime;
                    }
                } else {
                    // Automatically mark as read if older than 10 minutes
                    expiredIds.push(msg.id);
                }
            });

            setHasNewNotification(hasRecentUnread);
            setLatestMessage(foundLatest);
            
            // Set lastEventTime to the earliest unread message to trigger timer for the first one that will expire
            if (hasRecentUnread) {
                setLastEventTime(earliestUnreadRecentTime);
            } else {
                setLastEventTime(0);
            }

            // Sync expired notifications to backend
            if (expiredIds.length > 0) {
                expiredIds.forEach(id => {
                    markSystemMessageAsReadApi(id, user.id).catch(err => 
                        console.error(`Failed to auto-mark message ${id} as read:`, err)
                    );
                });
            }
        } catch (error) {
            console.error('Error checking notifications:', error);
        }
    }, [user]);

    // Initial check
    useEffect(() => {
        if (user) {
            checkNotifications();
        }
    }, [user, checkNotifications]);

    // Real-time listener
    useEffect(() => {
        if (window.Echo) {
            const channel = window.Echo.channel('system-notifications');
            channel.listen('.new-message', (e) => {
                // When a new message arrives, we trigger a full check to update states and timers
                checkNotifications();
            });
            return () => window.Echo.leaveChannel('system-notifications');
        }
    }, [checkNotifications]);

    // Expiry timer
    useEffect(() => {
        if (hasNewNotification && lastEventTime > 0) {
            const now = Date.now();
            const elapsed = now - lastEventTime;
            const remaining = Math.max(0, 10 * 60 * 1000 - elapsed);
            
            const timer = setTimeout(() => {
                checkNotifications();
            }, remaining + 500); // 500ms buffer
            return () => clearTimeout(timer);
        }
    }, [hasNewNotification, lastEventTime, checkNotifications]);

    return {
        hasNewNotification,
        latestMessage,
        checkNotifications
    };
};
