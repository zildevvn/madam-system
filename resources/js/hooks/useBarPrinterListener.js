import { useEffect, useRef } from 'react';
import axios from 'axios';
import qz from 'qz-tray';
import { printDrinkTicket, isBarPrinterStation } from '../services/barPrinterService.js';
import { setupQzSecurity } from '../services/qzSecurityService.js';

// In-memory sets to prevent duplicate print processing within the current tab
const processedRequestIds = new Set();
const inFlightRequestIds = new Set();
const unconfirmedTimeoutRequestIds = new Set();

const SESSION_ACKS_KEY = 'madam_bar_pending_acks';
let isFlushingAcks = false;

/**
 * Read the pending acknowledgments queue from sessionStorage.
 * Resilient across tab reloads (F5) within the designated POS station tab.
 * Automatically cleared when the browser tab is closed.
 *
 * @returns {Array<{ requestId: string, claimToken: string, status: string, errorMessage?: string, attempts: number, nextRetryAt: number, exhausted?: boolean }>}
 */
export const getPendingAcksQueue = () => {
    if (typeof sessionStorage === 'undefined') return [];
    try {
        const raw = sessionStorage.getItem(SESSION_ACKS_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

/**
 * Save pending acknowledgments queue to sessionStorage.
 * Caps at 50 items to prevent storage bloat.
 *
 * @param {Array} queue
 */
export const savePendingAcksQueue = (queue) => {
    if (typeof sessionStorage === 'undefined') return;
    try {
        if (!queue || queue.length === 0) {
            sessionStorage.removeItem(SESSION_ACKS_KEY);
        } else {
            // Keep the most recent 50 items instead of dropping new ones
            sessionStorage.setItem(SESSION_ACKS_KEY, JSON.stringify(queue.slice(-50)));
        }
    } catch {
        // Ignore storage write errors
    }
};

/**
 * Add or update a pending acknowledgment in the sessionStorage queue.
 */
export const enqueuePendingAck = ({ requestId, claimToken, status, errorMessage }) => {
    const queue = getPendingAcksQueue();
    const existingIndex = queue.findIndex(item => item.requestId === requestId);
    const ackItem = {
        requestId,
        claimToken,
        status,
        errorMessage: errorMessage || null,
        attempts: existingIndex >= 0 ? queue[existingIndex].attempts : 1,
        nextRetryAt: Date.now() + 2000,
        createdAt: existingIndex >= 0 ? queue[existingIndex].createdAt : Date.now()
    };

    if (existingIndex >= 0) {
        queue[existingIndex] = ackItem;
    } else {
        queue.push(ackItem);
    }
    savePendingAcksQueue(queue);
};

/**
 * Remove an acknowledged item from the queue.
 */
export const removePendingAck = (requestId) => {
    const queue = getPendingAcksQueue();
    const filtered = queue.filter(item => item.requestId !== requestId);
    savePendingAcksQueue(filtered);
};

/**
 * Flush all ready pending acknowledgments with exponential backoff.
 * Backoff steps: 2s -> 5s -> 10s -> 20s -> 30s (Max 5 attempts).
 * Only retries acknowledging state to backend; NEVER re-triggers qz.print().
 */
export const flushPendingAcks = async () => {
    if (isFlushingAcks || typeof sessionStorage === 'undefined') return;
    isFlushingAcks = true;

    try {
        const queue = getPendingAcksQueue();
        if (queue.length === 0) return;

        const now = Date.now();
        const updatedQueue = [];

        for (const item of queue) {
            // Keep in queue if already exhausted or waiting for backoff window
            if (item.exhausted || (item.nextRetryAt && item.nextRetryAt > now)) {
                updatedQueue.push(item);
                continue;
            }

            try {
                const payload = {
                    request_id: item.requestId,
                    claim_token: item.claimToken,
                    status: item.status
                };
                if (item.errorMessage) {
                    payload.error_message = item.errorMessage;
                }

                const res = await axios.post('/api/bar-printer/acknowledge', payload);
                if (res.status === 200) {
                    if (item.status === 'printed') {
                        processedRequestIds.add(item.requestId);
                    }
                    // Succeeded, omit from updatedQueue
                    continue;
                }
            } catch (err) {
                const status = err.response?.status;
                const errErrors = err.response?.data?.errors;
                const reason = errErrors?.reason || errErrors?.status;

                // 409 already_printed: Backend is already in printed state
                if (status === 409 && reason === 'already_printed') {
                    processedRequestIds.add(item.requestId);
                    continue; // Succeeded, omit from queue
                }

                // 409 claim_superseded, token_mismatch, unconfirmed_timeout, or unconfirmed_stale_printing: Token permanently invalidated
                if (status === 409 && (reason === 'claim_superseded' || reason === 'token_mismatch' || reason === 'unconfirmed_timeout' || reason === 'unconfirmed_stale_printing')) {
                    console.warn('[BarPrinter] Pending ack aborted (token superseded or unconfirmed state):', item.requestId);
                    continue; // Omit from queue, do not retry
                }

                // 422 Unprocessable Content: Malformed data, will never succeed
                if (status === 422) {
                    console.error('[BarPrinter] Pending ack validation error (422), discarding item:', item.requestId, err.response?.data);
                    continue;
                }

                // Network error / 5xx: increment attempt count and apply backoff
                const attempts = (item.attempts || 1) + 1;
                const backoffDelays = [2000, 5000, 10000, 20000, 30000];
                const delay = backoffDelays[Math.min(attempts - 1, backoffDelays.length - 1)];

                if (attempts > 5) {
                    console.warn('[BarPrinter] Pending ack reached max retry attempts (5), marking as exhausted:', item.requestId);
                    updatedQueue.push({
                        ...item,
                        attempts,
                        exhausted: true
                    });
                } else {
                    updatedQueue.push({
                        ...item,
                        attempts,
                        nextRetryAt: now + delay
                    });
                }
            }
        }

        savePendingAcksQueue(updatedQueue);
    } catch (globalErr) {
        console.error('[BarPrinter] Error during flushPendingAcks:', globalErr);
    } finally {
        isFlushingAcks = false;
    }
};

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

            // 1b. Unconfirmed timeout check: Do NOT auto-claim or auto-print requests with indeterminate physical output
            if (unconfirmedTimeoutRequestIds.has(reqId)) {
                console.warn('[BarPrinter] Request previously encountered indeterminate timeout, skipping auto-print:', reqId);
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

                        if (!claimRes.data || !claimRes.data.data) {
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
                        const errErrors = claimErr.response?.data?.errors;
                        const conflictReason = errErrors?.reason || errErrors?.status || claimErr.response?.data?.reason;

                        if (status === 409) {
                            if (conflictReason === 'already_printed') {
                                console.warn('[BarPrinter] Request already printed by another station:', reqId);
                                processedRequestIds.add(reqId);
                                removePendingAck(reqId);
                            } else if (conflictReason === 'unconfirmed_timeout' || conflictReason === 'unconfirmed_stale_printing') {
                                console.warn('[BarPrinter] Request in unconfirmed state, auto-claim rejected by backend (manual reprint required):', reqId, conflictReason);
                                unconfirmedTimeoutRequestIds.add(reqId);
                            } else {
                                // Claimed by another active station (claimed_by_another_station).
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
                        requestId: reqId,
                        orderId: data.order_id,
                        tableName: data.table_name,
                        items: data.items,
                        orderNote: data.order_note || '',
                        title: data.title || 'PHIẾU PHA CHẾ',
                        staffName: data.staff_name || '',
                        isReprint
                    });

                    // 5. Acknowledge result with fencing token
                    const hasConfirmedPrintProof = result.reason === 'duplicate_prevented' && result.wasPrinted && result.requestId === reqId;

                    if (result.success || hasConfirmedPrintProof) {
                        try {
                            const ackRes = await axios.post('/api/bar-printer/acknowledge', {
                                request_id: reqId,
                                claim_token: claimToken,
                                status: 'printed'
                            });

                            if (ackRes.status === 200) {
                                processedRequestIds.add(reqId);
                                removePendingAck(reqId);
                            }
                        } catch (ackErr) {
                            const ackStatus = ackErr.response?.status;
                            const errErrors = ackErr.response?.data?.errors;
                            const reason = errErrors?.reason || errErrors?.status;

                            if (ackStatus === 409 && (reason === 'claim_superseded' || reason === 'token_mismatch')) {
                                console.warn('[BarPrinter] Acknowledge rejected (claim superseded by another station):', reqId);
                                removePendingAck(reqId);
                            } else if (ackStatus === 409 && reason === 'already_printed') {
                                processedRequestIds.add(reqId);
                                removePendingAck(reqId);
                            } else if (ackStatus === 422) {
                                console.error('[BarPrinter] Acknowledge validation error (422):', ackErr.response?.data);
                                removePendingAck(reqId);
                            } else {
                                console.error('[BarPrinter] Network/Server error acknowledging printed status, enqueueing for retry:', ackErr);
                                enqueuePendingAck({
                                    requestId: reqId,
                                    claimToken: claimToken,
                                    status: 'printed'
                                });
                            }
                        }
                    } else if (result.reason === 'indeterminate_timeout') {
                        unconfirmedTimeoutRequestIds.add(reqId);
                        const timeoutErrMsg = result.error || 'QZ_INDETERMINATE_TIMEOUT: Print job timed out after 20s. Physical output unconfirmed.';

                        try {
                            await axios.post('/api/bar-printer/acknowledge', {
                                request_id: reqId,
                                claim_token: claimToken,
                                status: 'failed',
                                error_message: timeoutErrMsg
                            });
                            removePendingAck(reqId);
                        } catch (ackErr) {
                            const ackStatus = ackErr.response?.status;
                            const errErrors = ackErr.response?.data?.errors;
                            const reason = errErrors?.reason || errErrors?.status;

                            if (ackStatus === 409 || ackStatus === 422) {
                                console.warn('[BarPrinter] Acknowledge timeout rejected or superseded:', reason || ackStatus);
                                removePendingAck(reqId);
                            } else {
                                console.error('[BarPrinter] Network error acknowledging indeterminate timeout, enqueueing for retry:', ackErr);
                                enqueuePendingAck({
                                    requestId: reqId,
                                    claimToken: claimToken,
                                    status: 'failed',
                                    errorMessage: timeoutErrMsg
                                });
                            }
                        }
                    } else if (result.reason !== 'in_flight') {
                        try {
                            const errorMsg = String(result.error || result.reason || 'Unknown error').substring(0, 1000);
                            await axios.post('/api/bar-printer/acknowledge', {
                                request_id: reqId,
                                claim_token: claimToken,
                                status: 'failed',
                                error_message: errorMsg
                            });
                            removePendingAck(reqId);
                        } catch (ackErr) {
                            const ackStatus = ackErr.response?.status;
                            if (ackStatus === 422) {
                                console.error('[BarPrinter] Acknowledge failed validation error (422):', ackErr.response?.data);
                                removePendingAck(reqId);
                            } else {
                                console.error('[BarPrinter] Failed to acknowledge failed status:', ackErr);
                            }
                        }
                    }
                } catch (err) {
                    console.error('[BarPrinter] Exception during print execution:', err);
                    if (claimToken) {
                        try {
                            const errorMsg = String(err?.message || err || 'Unknown exception').substring(0, 1000);
                            await axios.post('/api/bar-printer/acknowledge', {
                                request_id: reqId,
                                claim_token: claimToken,
                                status: 'failed',
                                error_message: errorMsg
                            });
                            removePendingAck(reqId);
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
                // First flush any pending acknowledgments from previous network drops
                await flushPendingAcks();

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

        // 1. Proactively configure QZ Tray security & connection on mount if designated Bar Station
        if (isBarPrinterStation()) {
            setupQzSecurity();
            if (!qz.websocket.isActive()) {
                qz.websocket.connect().catch((err) => {
                    console.warn('[BarPrinter] Initial QZ Tray connection failed on mount:', err);
                });
            }
        }

        // 2. Catch-up on mount if designated as bar printer
        fetchPendingRequests();

        // 3. Periodic catch-up polling every 60 seconds to recover any stale or missed requests and retry pending acks
        const intervalId = setInterval(() => {
            fetchPendingRequests();
        }, 60000);

        // 4. Listen to real-time broadcast on public 'orders' channel
        if (window.Echo) {
            const orderChannel = window.Echo.channel('orders');
            orderChannel.listen('.drink_print_requested', (eventData) => {
                console.log('[BarPrinter] Received .drink_print_requested broadcast:', eventData);
                processPrintRequest(eventData);
            });
        }

        // 5. Catch-up when browser comes back online
        const handleOnline = () => {
            flushPendingAcks();
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
    unconfirmedTimeoutRequestIds,
    runWithCrossTabLock,
    getPendingAcksQueue,
    savePendingAcksQueue,
    enqueuePendingAck,
    removePendingAck,
    flushPendingAcks,
    clearState: () => {
        processedRequestIds.clear();
        inFlightRequestIds.clear();
        unconfirmedTimeoutRequestIds.clear();
        if (typeof sessionStorage !== 'undefined') {
            sessionStorage.removeItem(SESSION_ACKS_KEY);
        }
    }
};

export default useBarPrinterListener;
