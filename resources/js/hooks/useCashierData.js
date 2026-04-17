import { useState, useCallback, useEffect } from 'react';
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

    const loadReservations = useCallback(async () => {
        setIsLoadingRes(true);
        try {
            const res = await reservationApi.getAll();
            setReservations(res.data || []);
        } catch (err) {
            console.error("Failed to fetch reservations:", err);
        } finally {
            setIsLoadingRes(false);
        }
    }, []);

    const loadHistory = useCallback(async () => {
        try {
            const res = await orderApi.getHistory(15);
            setHistoryOrders(res.data || []);
        } catch (err) {
            console.error("Failed to fetch history:", err);
        }
    }, []);

    // [WHY] Initial fetch and refresh on status change
    useEffect(() => {
        loadReservations();
        loadHistory();
    }, [loadReservations, loadHistory, status]);

    // [WHY] Real-time synchronization via Echo
    useEffect(() => {
        if (window.Echo) {
            const channel = window.Echo.channel('orders');
            const handleUpdate = () => {
                loadReservations();
                loadHistory();
            };

            channel.listen('.order_created', handleUpdate)
                .listen('.order_updated', handleUpdate)
                .listen('.item_status_updated', handleUpdate)
                .listen('.reservation_updated', handleUpdate);

            return () => window.Echo.leaveChannel('orders');
        }
    }, [loadReservations, loadHistory]);

    return {
        reservations,
        historyOrders,
        isLoadingRes,
        refreshData: () => {
            loadReservations();
            loadHistory();
        }
    };
};
