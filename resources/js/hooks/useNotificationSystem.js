import { useState, useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { 
    fetchNotificationsAsync, 
    markNotificationAsReadAsync,
    selectHasNewNotification,
    selectLatestNotification,
    selectNotificationLastUpdated,
    selectNotificationSequence
} from '../store/slices/notificationSlice';
import { markSystemMessageAsReadApi } from '../services/systemMessageService';

/**
 * useNotificationSystem Hook
 * [WHY] Decouples notification logic (expiry timers, API synchronization) 
 * from the Header component while adhering to Rule 412 (Redux as source of truth).
 */
export const useNotificationSystem = (user) => {
    const dispatch = useAppDispatch();
    
    // [RULE] Select from Redux state instead of local useState
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

    // [WHY] Automatic expiry of notifications (older than 10 mins)
    useEffect(() => {
        if (!user || !hasNewNotification || !lastUpdated) return;

        const now = Date.now();
        const diff = now - lastUpdated;
        const remaining = Math.max(0, 10 * 60 * 1000 - diff);
        
        const timer = setTimeout(() => {
            checkNotifications();
        }, remaining + 1000); 

        return () => clearTimeout(timer);
    }, [user, hasNewNotification, lastUpdated, checkNotifications]);

    return {
        hasNewNotification,
        latestMessage,
        checkNotifications,
        socketSequence
    };
};
