import { useEffect, useRef } from 'react';
import axios from 'axios';
import { printDrinkTicket, isBarPrinterStation } from '../services/barPrinterService.js';

// Set of request IDs currently processing or processed to prevent duplicate prints
const processedRequestIds = new Set();
const inFlightRequestIds = new Set();

/**
 * useBarPrinterListener: Hook running at the POS application root.
 * Listens for centralized '.drink_print_requested' broadcasts and automatically
 * prints drink tickets via QZ Tray if this POS station is designated as the Bar Printer.
 */
export const useBarPrinterListener = () => {
    const isFetchingPending = useRef(false);

    useEffect(() => {
        // Process a print request payload received from broadcast or pending queue
        const processPrintRequest = async (data) => {
            if (!data || !data.request_id || !data.items || data.items.length === 0) {
                return;
            }

            // Only designated Bar Printer stations process printing
            if (!isBarPrinterStation()) {
                return;
            }

            const reqId = data.request_id;

            // Prevent duplicate processing of the same request ID
            if (processedRequestIds.has(reqId) || inFlightRequestIds.has(reqId)) {
                console.warn('[BarPrinter] Request ID already processed or in-flight, skipping:', reqId);
                return;
            }

            inFlightRequestIds.add(reqId);

            try {
                const result = await printDrinkTicket({
                    orderId: data.order_id,
                    tableName: data.table_name,
                    items: data.items,
                    orderNote: data.order_note || '',
                    title: data.title || 'PHIẾU PHA CHẾ',
                    staffName: data.staff_name || ''
                });

                if (result.success || result.reason === 'duplicate_prevented') {
                    processedRequestIds.add(reqId);
                    try {
                        await axios.post('/api/bar-printer/acknowledge', {
                            request_id: reqId,
                            status: 'printed'
                        });
                    } catch (ackErr) {
                        console.error('[BarPrinter] Failed to acknowledge printed status:', ackErr);
                    }
                } else if (result.reason !== 'in_flight') {
                    try {
                        await axios.post('/api/bar-printer/acknowledge', {
                            request_id: reqId,
                            status: 'failed',
                            error_message: result.error || result.reason || 'Unknown error'
                        });
                    } catch (ackErr) {
                        console.error('[BarPrinter] Failed to acknowledge failed status:', ackErr);
                    }
                }
            } catch (err) {
                console.error('[BarPrinter] Exception during print execution:', err);
                try {
                    await axios.post('/api/bar-printer/acknowledge', {
                        request_id: reqId,
                        status: 'failed',
                        error_message: err?.message || String(err)
                    });
                } catch (ackErr) {
                    console.error('[BarPrinter] Failed to acknowledge exception status:', ackErr);
                }
            } finally {
                inFlightRequestIds.delete(reqId);
            }
        };

        // Catch-up function: fetch pending requests from backend (for when POS was offline)
        const fetchPendingRequests = async () => {
            if (!isBarPrinterStation() || isFetchingPending.current) return;
            isFetchingPending.current = true;
            try {
                const res = await axios.get('/api/bar-printer/pending');
                const pendingList = res.data?.data || res.data || [];
                if (Array.isArray(pendingList) && pendingList.length > 0) {
                    console.log(`[BarPrinter] Found ${pendingList.length} pending print request(s) to process`);
                    for (const req of pendingList) {
                        await processPrintRequest(req);
                    }
                }
            } catch (err) {
                console.error('[BarPrinter] Failed to fetch pending bar print requests:', err);
            } finally {
                isFetchingPending.current = false;
            }
        };

        // 1. Catch-up on mount if designated as bar printer
        fetchPendingRequests();

        // 2. Listen to real-time broadcast on public 'orders' channel
        if (window.Echo) {
            const orderChannel = window.Echo.channel('orders');
            orderChannel.listen('.drink_print_requested', (eventData) => {
                console.log('[BarPrinter] Received .drink_print_requested broadcast:', eventData);
                processPrintRequest(eventData);
            });
        }

        // 3. Catch-up when browser comes back online
        const handleOnline = () => {
            fetchPendingRequests();
        };
        window.addEventListener('online', handleOnline);

        return () => {
            window.removeEventListener('online', handleOnline);
            if (window.Echo) {
                window.Echo.channel('orders').stopListening('.drink_print_requested');
            }
        };
    }, []);
};

export const _testBarPrinterHooks = {
    processedRequestIds,
    inFlightRequestIds,
    clearState: () => {
        processedRequestIds.clear();
        inFlightRequestIds.clear();
    }
};

export default useBarPrinterListener;
