import { useEffect, useRef } from 'react';
import axios from 'axios';
import { printDrinkTicket, isBarPrinterStation } from '../services/barPrinterService.js';

// Set of request IDs currently processing or processed to prevent duplicate prints within the tab
const processedRequestIds = new Set();
const inFlightRequestIds = new Set();

/**
 * Execute an async callback under a cross-tab lock keyed by request_id.
 * Uses Web Locks API (navigator.locks) when available, with a resilient localStorage fallback.
 *
 * @param {string} reqId
 * @param {Function} callback
 * @returns {Promise<{ acquired: boolean, result?: any, reason?: string, error?: any }>}
 */
export const runWithCrossTabLock = async (reqId, callback) => {
    const lockName = `madam_bar_print_${reqId}`;

    // 1. Preferred modern mechanism: Web Locks API (supported by Chrome, Edge, Safari, Firefox)
    if (typeof navigator !== 'undefined' && navigator.locks && typeof navigator.locks.request === 'function') {
        return new Promise((resolve) => {
            navigator.locks.request(lockName, { ifAvailable: true }, async (lock) => {
                if (!lock) {
                    console.warn('[BarPrinter] Cross-tab Web Lock already held by another tab for request:', reqId);
                    resolve({ acquired: false, reason: 'lock_held_by_other_tab' });
                    return;
                }
                try {
                    const result = await callback();
                    resolve({ acquired: true, result });
                } catch (err) {
                    resolve({ acquired: true, error: err });
                }
            }).catch((err) => {
                console.error('[BarPrinter] navigator.locks.request error:', err);
                resolve({ acquired: false, error: err });
            });
        });
    }

    // 2. Safe Fallback for legacy or environments without navigator.locks: localStorage mutex with TTL
    const lockKey = `lock_${lockName}`;
    const now = Date.now();
    const LOCK_TTL_MS = 30000; // 30s lock expiration

    let tabId = 'tab_default';
    try {
        if (typeof sessionStorage !== 'undefined') {
            tabId = sessionStorage.getItem('tab_instance_id');
            if (!tabId) {
                tabId = 'tab_' + Math.random().toString(36).substring(2, 9);
                sessionStorage.setItem('tab_instance_id', tabId);
            }
        }
    } catch {
        // Ignore sessionStorage access errors
    }

    try {
        if (typeof localStorage !== 'undefined') {
            const existingLockStr = localStorage.getItem(lockKey);
            if (existingLockStr) {
                try {
                    const existing = JSON.parse(existingLockStr);
                    if (existing && existing.expiresAt && existing.expiresAt > now && existing.tabId !== tabId) {
                        console.warn('[BarPrinter] Fallback cross-tab lock held by tab:', existing.tabId, 'for request:', reqId);
                        return { acquired: false, reason: 'lock_held_by_other_tab' };
                    }
                } catch {
                    // Invalid JSON, will overwrite
                }
            }

            // Acquire fallback lock
            localStorage.setItem(lockKey, JSON.stringify({ tabId, expiresAt: now + LOCK_TTL_MS }));
        }

        try {
            const result = await callback();
            return { acquired: true, result };
        } finally {
            if (typeof localStorage !== 'undefined') {
                try {
                    const cur = JSON.parse(localStorage.getItem(lockKey) || '{}');
                    if (cur.tabId === tabId) {
                        localStorage.removeItem(lockKey);
                    }
                } catch {
                    localStorage.removeItem(lockKey);
                }
            }
        }
    } catch (lsErr) {
        console.error('[BarPrinter] localStorage fallback lock error:', lsErr);
        // If storage is completely inaccessible, proceed with execution; backend claim will enforce exclusivity
        const result = await callback();
        return { acquired: true, result };
    }
};

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

            // 1. In-tab check: Prevent duplicate processing within the current tab
            if (processedRequestIds.has(reqId) || inFlightRequestIds.has(reqId)) {
                console.warn('[BarPrinter] Request ID already processed or in-flight in this tab, skipping:', reqId);
                return;
            }

            // 2. Cross-tab check: Acquire exclusive lock for this request_id across browser tabs
            await runWithCrossTabLock(reqId, async () => {
                inFlightRequestIds.add(reqId);
                let claimToken = null;

                try {
                    // 3. Backend Atomic Claim: Ensure only ONE station/tab claims and prints this request
                    try {
                        const claimRes = await axios.post('/api/bar-printer/claim', {
                            request_id: reqId
                        });

                        if (!claimRes.data || !claimRes.data.success) {
                            console.warn('[BarPrinter] Failed to claim request from backend, skipping print:', reqId);
                            return;
                        }

                        claimToken = claimRes.data?.data?.claim_token;
                        if (!claimToken) {
                            console.error('[BarPrinter] No claim_token returned from claim response, skipping print:', reqId);
                            return;
                        }
                    } catch (claimErr) {
                        const status = claimErr.response?.status;
                        const claimData = claimErr.response?.data?.data || claimErr.response?.data || {};
                        const conflictReason = claimData.reason || claimData.status;

                        if (status === 409) {
                            if (conflictReason === 'already_printed') {
                                console.warn('[BarPrinter] Request already printed by another station:', reqId);
                                // Mark as completed locally so this station never re-attempts
                                processedRequestIds.add(reqId);
                            } else {
                                // Claimed by another active station (claimed_by_another_station).
                                // DO NOT add to processedRequestIds, so that if the other station crashes or becomes stale,
                                // future pending catch-up calls can rescue and claim the ticket.
                                console.warn('[BarPrinter] Request currently claimed by another station:', reqId);
                            }
                            return;
                        }

                        console.error('[BarPrinter] Network/Server error claiming request from backend:', claimErr);
                        // Network error claiming: do NOT print to avoid double printing without holding the claim
                        return;
                    }

                    // 4. Dispatch print job via QZ Tray
                    const isReprint = Boolean(data.is_reprint || (reqId && reqId.startsWith('pr-rep-')));
                    const result = await printDrinkTicket({
                        orderId: data.order_id,
                        tableName: data.table_name,
                        items: data.items,
                        orderNote: data.order_note || '',
                        title: data.title || 'PHIẾU PHA CHẾ',
                        staffName: data.staff_name || '',
                        isReprint
                    });

                    // 5. Acknowledge result with fencing token
                    if (result.success || result.reason === 'duplicate_prevented') {
                        processedRequestIds.add(reqId);
                        try {
                            await axios.post('/api/bar-printer/acknowledge', {
                                request_id: reqId,
                                claim_token: claimToken,
                                status: 'printed'
                            });
                        } catch (ackErr) {
                            const ackStatus = ackErr.response?.status;
                            const ackData = ackErr.response?.data?.data || ackErr.response?.data || {};
                            if (ackStatus === 409 && (ackData.status === 'claim_superseded' || ackData.reason === 'token_mismatch')) {
                                console.warn('[BarPrinter] Acknowledge rejected (claim superseded by another station):', reqId);
                            } else {
                                console.error('[BarPrinter] Failed to acknowledge printed status:', ackErr);
                            }
                        }
                    } else if (result.reason !== 'in_flight') {
                        try {
                            await axios.post('/api/bar-printer/acknowledge', {
                                request_id: reqId,
                                claim_token: claimToken,
                                status: 'failed',
                                error_message: result.error || result.reason || 'Unknown error'
                            });
                        } catch (ackErr) {
                            console.error('[BarPrinter] Failed to acknowledge failed status:', ackErr);
                        }
                    }
                } catch (err) {
                    console.error('[BarPrinter] Exception during print execution:', err);
                    if (claimToken) {
                        try {
                            await axios.post('/api/bar-printer/acknowledge', {
                                request_id: reqId,
                                claim_token: claimToken,
                                status: 'failed',
                                error_message: err?.message || String(err)
                            });
                        } catch (ackErr) {
                            console.error('[BarPrinter] Failed to acknowledge exception status:', ackErr);
                        }
                    }
                } finally {
                    inFlightRequestIds.delete(reqId);
                }
            });
        };

        // Catch-up function: fetch pending requests from backend (for when POS was offline, reconnecting, or recovering stale)
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

        // 2. Periodic catch-up polling every 60 seconds to recover any stale or missed requests
        const intervalId = setInterval(() => {
            fetchPendingRequests();
        }, 60000);

        // 3. Listen to real-time broadcast on public 'orders' channel
        if (window.Echo) {
            const orderChannel = window.Echo.channel('orders');
            orderChannel.listen('.drink_print_requested', (eventData) => {
                console.log('[BarPrinter] Received .drink_print_requested broadcast:', eventData);
                processPrintRequest(eventData);
            });
        }

        // 4. Catch-up when browser comes back online
        const handleOnline = () => {
            fetchPendingRequests();
        };
        window.addEventListener('online', handleOnline);

        return () => {
            clearInterval(intervalId);
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
    runWithCrossTabLock,
    clearState: () => {
        processedRequestIds.clear();
        inFlightRequestIds.clear();
    }
};

export default useBarPrinterListener;
