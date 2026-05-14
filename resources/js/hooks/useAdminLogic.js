import { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import { getUsersApi, updateUserRoleApi } from '../services/userService';
import { useAppSelector } from '../store/hooks';

/**
 * @typedef {Object} AdminUser
 * @property {number} id
 * @property {string} name
 * @property {string} email
 * @property {'admin' | 'order_staff' | 'kitchen' | 'bar' | 'cashier'} role
 * @property {string} [created_at]
 */

/**
 * @typedef {Object} AdminLog
 * @property {'info' | 'success' | 'error' | 'warning'} type
 * @property {string} prefix
 * @property {string} message
 * @property {string} time
 */

/**
 * @typedef {Object} AdminStats
 * @property {number} total_revenue
 * @property {number} total_orders
 * @property {number} individual_orders
 * @property {number} group_orders
 * @property {number} cash_revenue
 * @property {number} bank_revenue
 * @property {number} card_revenue
 * @property {number} debt_revenue
 * @property {number} fixed_expenses
 * @property {number} variable_expenses
 * @property {number} total_expenses
 * @property {Array<{description: string, category: string, amount: number, date: string}>} [fixed_items]
 * @property {Array<{description: string, category: string, amount: number, date: string, created_at: string}>} [variable_items]
 */

export const useAdminLogic = () => {
    /** @type {[AdminUser[], React.Dispatch<React.SetStateAction<AdminUser[]>>]} */
    const [users, setUsers] = useState([]);

    /** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} */
    const [loading, setLoading] = useState(true);

    /** @type {[number|null, React.Dispatch<React.SetStateAction<number|null>>]} */
    const [updating, setUpdating] = useState(null);

    const { user: currentUser } = useAppSelector(state => state.auth);

    const [testingPrinter, setTestingPrinter] = useState(false);
    const [testingWS, setTestingWS] = useState(false);

    /** @type {[AdminLog[], React.Dispatch<React.SetStateAction<AdminLog[]>>]} */
    const [logs, setLogs] = useState([]);

    const [todayRevenue, setTodayRevenue] = useState(0);
    const usersAbortControllerRef = useRef(null);
    const statsAbortControllerRef = useRef(null);
    const cleanupAbortControllerRef = useRef(new AbortController());
    const logBufferRef = useRef([]);
    const flushTimerRef = useRef(null);

    // [RULE] Use AbortController for clean lifecycle management instead of isMounted anti-pattern
    useEffect(() => {
        return () => {
            cleanupAbortControllerRef.current.abort();
            if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
        };
    }, []);

    // [WHY] Batch log updates to prevent UI lag during heavy websocket traffic
    const flushLogs = useCallback(() => {
        if (cleanupAbortControllerRef.current.signal.aborted || logBufferRef.current.length === 0) {
            logBufferRef.current = [];
            return;
        }

        const buffered = [...logBufferRef.current];
        logBufferRef.current = [];

        setLogs(prev => {
            const combined = [...buffered, ...prev];
            return combined.slice(0, 50);
        });
    }, []);

    /**
     * @param {'info' | 'success' | 'error' | 'warning'} type
     * @param {string} prefix
     * @param {string} message
     */
    const addLog = useCallback((type, prefix, message) => {
        if (cleanupAbortControllerRef.current.signal.aborted) return;

        const time = new Date().toLocaleTimeString();
        logBufferRef.current.push({ type, prefix, message, time });

        if (!flushTimerRef.current) {
            flushTimerRef.current = setTimeout(() => {
                if (!cleanupAbortControllerRef.current.signal.aborted) {
                    flushLogs();
                }
                flushTimerRef.current = null;
            }, 500); // Batch updates every 500ms
        }
    }, [flushLogs]);

    const fetchUsers = useCallback(async () => {
        if (usersAbortControllerRef.current) {
            usersAbortControllerRef.current.abort();
        }
        usersAbortControllerRef.current = new AbortController();

        try {
            setLoading(true);
            const response = await getUsersApi({ 
                signal: usersAbortControllerRef.current.signal 
            });
            
            if (!cleanupAbortControllerRef.current.signal.aborted) {
                setUsers(response.data || []);
            }
        } catch (error) {
            if (axios.isCancel(error)) return;
            console.error('Failed to fetch users:', error);
        } finally {
            if (!cleanupAbortControllerRef.current.signal.aborted) {
                setLoading(false);
            }
        }
    }, []);

    const fetchStats = useCallback(async () => {
        if (statsAbortControllerRef.current) {
            statsAbortControllerRef.current.abort();
        }
        statsAbortControllerRef.current = new AbortController();

        try {
            const res = await axios.get('/api/stats/today-revenue', {
                signal: statsAbortControllerRef.current.signal
            });
            if (!cleanupAbortControllerRef.current.signal.aborted) {
                setTodayRevenue(res.data.data.revenue || 0);
            }
        } catch (error) {
            if (axios.isCancel(error)) return;
            console.error('Failed to fetch revenue stats:', error);
        }
    }, []);

    /**
     * @param {{message: string}} e
     */
    const handleSystemTest = useCallback((e) => {
        addLog('success', 'Echo', `Received: ${e.message}`);
    }, [addLog]);

    useEffect(() => {
        fetchUsers();
        fetchStats();

        // Listen for system diagnostics
        if (window.Echo) {
            const channel = window.Echo.channel('system-diagnostics');
            channel.listen('SystemTestEvent', handleSystemTest);

            return () => {
                channel.stopListening('SystemTestEvent');
                // [WHY] Abort all pending requests on unmount
                if (usersAbortControllerRef.current) usersAbortControllerRef.current.abort();
                if (statsAbortControllerRef.current) statsAbortControllerRef.current.abort();
                cleanupAbortControllerRef.current.abort();
            };
        }

        return () => {
            if (usersAbortControllerRef.current) usersAbortControllerRef.current.abort();
            if (statsAbortControllerRef.current) statsAbortControllerRef.current.abort();
            cleanupAbortControllerRef.current.abort();
        };
    }, [fetchUsers, fetchStats, handleSystemTest]);

    const testPrinter = useCallback(async () => {
        setTestingPrinter(true);
        addLog('info', 'Printer', 'Starting connection test...');
        try {
            const res = await axios.get('/api/debug/printer', {
                signal: cleanupAbortControllerRef.current.signal
            });
            if (!cleanupAbortControllerRef.current.signal.aborted) {
                addLog('success', 'Printer', res.data.message);
            }
        } catch (err) {
            if (axios.isCancel(err)) return;
            const msg = err.response?.data?.message || err.message;
            addLog('error', 'Printer', msg);
        } finally {
            if (!cleanupAbortControllerRef.current.signal.aborted) {
                setTestingPrinter(false);
            }
        }
    }, [addLog]);

    const testWebsocket = useCallback(async () => {
        setTestingWS(true);
        addLog('info', 'Pusher', 'Dispatching test broadcast...');
        try {
            const res = await axios.get('/api/debug/broadcast', {
                signal: cleanupAbortControllerRef.current.signal
            });
            if (!cleanupAbortControllerRef.current.signal.aborted) {
                addLog('success', 'Pusher', res.data.message);
            }
        } catch (err) {
            if (axios.isCancel(err)) return;
            addLog('error', 'Pusher', err.message);
        } finally {
            if (!cleanupAbortControllerRef.current.signal.aborted) {
                setTestingWS(false);
            }
        }
    }, [addLog]);

    /**
     * @param {number} userId
     * @param {AdminUser['role']} newRole
     */
    const handleRoleChange = useCallback(async (userId, newRole) => {
        try {
            setUpdating(userId);
            await updateUserRoleApi(userId, newRole);
            if (!cleanupAbortControllerRef.current.signal.aborted) {
                await fetchUsers(); // Refresh list
            }
        } catch (error) {
            if (axios.isCancel(error)) return;
            console.error('Failed to update role:', error);
            alert('Failed to update role');
        } finally {
            if (!cleanupAbortControllerRef.current.signal.aborted) {
                setUpdating(null);
            }
        }
    }, [fetchUsers]);

    const roles = [
        { value: 'admin', label: 'Admin' },
        { value: 'order_staff', label: 'Order Staff' },
        { value: 'kitchen', label: 'Kitchen' },
        { value: 'bar', label: 'Bar' },
        { value: 'cashier', label: 'Cashier' }
    ];

    return {
        users,
        todayRevenue,
        loading,
        updating,
        currentUser,
        testingPrinter,
        testingWS,
        logs,
        setLogs,
        addLog,
        testPrinter,
        testWebsocket,
        fetchUsers,
        handleRoleChange,
        roles
    };
};
