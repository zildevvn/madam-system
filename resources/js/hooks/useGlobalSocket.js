import { useEffect } from "react";
import { useAppDispatch } from "../store/hooks";
import { updateReservationFromSocket } from "../store/slices/reservationSlice";
import { updateOrderFromSocket } from "../store/slices/orderSlice";
import { updateTableFromSocket, fetchTables } from "../store/slices/tableSlice";
import { addNotificationFromSocket } from "../store/slices/notificationSlice";

/**
 * useGlobalSocket: Hook that encapsulates all Laravel Echo global socket listeners.
 * [WHY] Decouples socket registrations from the root App router, ensuring clean
 * separation of concerns and preventing bloat inside app.jsx.
 */
export const useGlobalSocket = () => {
    const dispatch = useAppDispatch();

    useEffect(() => {
        if (window.Echo) {
            // 1. Orders & Reservations (Public Channel)
            const orderChannel = window.Echo.channel('orders');
            
            orderChannel.listen('.reservation_updated', (data) => {
                dispatch(updateReservationFromSocket({
                    id: data.id.toString(),
                    reservation: data.reservation,
                    action: data.action
                }));

                if (data.reservation?.table_id) {
                    dispatch(updateTableFromSocket({
                        id: data.reservation.table_id,
                        status: data.action === 'confirmed' ? 'busy' : 'available'
                    }));
                }
            });

            const handleOrderEvent = (data) => {
                if (data.order) {
                    dispatch(updateOrderFromSocket(data.order));
                    if (data.order.table) {
                        dispatch(updateTableFromSocket(data.order.table));
                    }
                }
                dispatch(fetchTables());
            };

            orderChannel.listen('.order_created', handleOrderEvent);
            orderChannel.listen('.order_updated', handleOrderEvent);
            orderChannel.listen('.item_status_updated', handleOrderEvent);

            // 2. System Notifications (Public Channel)
            const notificationChannel = window.Echo.channel('system-notifications');
            
            notificationChannel.listen('.new-message', (data) => {
                const message = data.message || data;
                if (message) {
                    dispatch(addNotificationFromSocket(message));
                }
            });

            return () => {
                window.Echo.leaveChannel('orders');
                window.Echo.leaveChannel('system-notifications');
            };
        }
    }, [dispatch]);
};
