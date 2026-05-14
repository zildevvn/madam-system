import { useState, useCallback, useEffect, useRef } from 'react';
import axios from 'axios';
import { reservationApi } from '../services/reservationApi';
import orderApi from '../services/orderApi';

/**
 * useCashierData
 * [WHY] Handles data fetching and real-time synchronization for the Cashier dashboard.
 * [RULE] Tách logic fetching ra khỏi UI component — README.md Component Rule.
 */
export const useCashierData = (status) => {
    const [reservations, setReservations] = useState([]);
    const [historyOrders, setHistoryOrders] = useState([]);
    const [isLoadingRes, setIsLoadingRes] = useState(false);

    const lastRanRef = useRef(0);
    const throttleTimerRef = useRef(null);
    const reservationAbortRef = useRef(null);
    const historyAbortRef = useRef(null);

    const loadReservations = useCallback(async () => {
        // [WHY] Prevent race conditions by aborting previous pending requests
        if (reservationAbortRef.current) reservationAbortRef.current.abort();
        const controller = new AbortController();
        reservationAbortRef.current = controller;

        setIsLoadingRes(true);
        try {
            const res = await reservationApi.getAll({}, {
                signal: controller.signal
            });

            // [WHY] Only update state if this specific request is still the latest and hasn't been aborted
            if (!controller.signal.aborted) {
                setReservations(res.data || []);
            }
        } catch (err) {
            if (axios.isCancel(err)) return;
            console.error("Failed to fetch reservations:", err);
        } finally {
            if (!controller.signal.aborted) {
                setIsLoadingRes(false);
            }
        }
    }, []);

    const loadHistory = useCallback(async () => {
        // [WHY] Ensure only the latest request updates the state
        if (historyAbortRef.current) historyAbortRef.current.abort();
        const controller = new AbortController();
        historyAbortRef.current = controller;

        try {
            const res = await orderApi.fetchHistory(15, {
                signal: controller.signal
            });

            if (!controller.signal.aborted) {
                setHistoryOrders(res.data || []);
            }
        } catch (err) {
            if (axios.isCancel(err)) return;
            console.error("Failed to fetch history:", err);
        }
    }, []);
    // [WHY] Shared refresh function for consistency and maintainability
    const refreshAllData = useCallback(() => {
        loadReservations();
        loadHistory();
    }, [loadReservations, loadHistory]);

    // [WHY] Throttled refresh with trailing behavior to prevent request storms while guaranteeing final updates
    const throttledRefresh = useCallback(() => {
        const now = Date.now();
        const limit = 500; // Throttle to once every 2 seconds

        const executeRefresh = () => {
            lastRanRef.current = Date.now();
            refreshAllData();
        };

        if (throttleTimerRef.current) {
            clearTimeout(throttleTimerRef.current);
        }

        if (!lastRanRef.current || (now - lastRanRef.current >= limit)) {
            // [WHY] Sufficient time has passed, execute immediately
            executeRefresh();
        } else {
            // [WHY] Within throttle window, schedule a trailing execution to capture the latest state
            throttleTimerRef.current = setTimeout(() => {
                executeRefresh();
                throttleTimerRef.current = null;
            }, limit - (now - lastRanRef.current));
        }
    }, [refreshAllData]);

    // [WHY] Initial fetch and refresh on status change
    useEffect(() => {
        refreshAllData();
        return () => {
            if (throttleTimerRef.current) clearTimeout(throttleTimerRef.current);
        };
    }, [refreshAllData, status]);

    // [WHY] Real-time synchronization via Echo
    useEffect(() => {
        if (window.Echo) {
            const channel = window.Echo.channel('orders');

            // [WHY] Use throttled version to handle high-frequency events without indefinite delay
            const handleUpdate = () => {
                throttledRefresh();
            };

            channel.listen('.order_created', handleUpdate)
                .listen('.order_updated', handleUpdate)
                .listen('.item_status_updated', handleUpdate)
                .listen('.reservation_updated', handleUpdate);

            return () => {
                // [FIX] Surgical cleanup to avoid killing shared 'orders' subscribers
                channel.stopListening('.order_created', handleUpdate)
                    .stopListening('.order_updated', handleUpdate)
                    .stopListening('.item_status_updated', handleUpdate)
                    .stopListening('.reservation_updated', handleUpdate);

                if (throttleTimerRef.current) clearTimeout(throttleTimerRef.current);

                // [WHY] Abort all pending requests on unmount
                if (reservationAbortRef.current) reservationAbortRef.current.abort();
                if (historyAbortRef.current) historyAbortRef.current.abort();
            };
        }
    }, [throttledRefresh]);

    return {
        reservations,
        historyOrders,
        isLoadingRes,
        refreshData: throttledRefresh
    };
};
