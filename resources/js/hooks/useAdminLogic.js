import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { getUsersApi, updateUserRoleApi } from '../services/userService';
import { useAppSelector } from '../store/hooks';

export const useAdminLogic = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(null);
    const { user: currentUser } = useAppSelector(state => state.auth);

    const [testingPrinter, setTestingPrinter] = useState(false);
    const [testingWS, setTestingWS] = useState(false);
    const [logs, setLogs] = useState([]);

    const addLog = useCallback((type, prefix, message) => {
        const time = new Date().toLocaleTimeString();
        setLogs(prev => [{ type, prefix, message, time }, ...prev].slice(0, 50));
    }, []);

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            const response = await getUsersApi();
            setUsers(response.data || []);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
        
        // Listen for system diagnostics
        if (window.Echo) {
            const channel = window.Echo.channel('system-diagnostics')
                .listen('SystemTestEvent', (e) => {
                    addLog('success', 'Echo', `Received: ${e.message}`);
                });
            return () => channel.stopListening('SystemTestEvent');
        }
    }, [fetchUsers, addLog]);

    const testPrinter = useCallback(async () => {
        setTestingPrinter(true);
        addLog('info', 'Printer', 'Starting connection test...');
        try {
            const res = await axios.get('/api/debug/printer');
            addLog('success', 'Printer', res.data.message);
        } catch (err) {
            const msg = err.response?.data?.message || err.message;
            addLog('error', 'Printer', msg);
        } finally {
            setTestingPrinter(false);
        }
    }, [addLog]);

    const testWebsocket = useCallback(async () => {
        setTestingWS(true);
        addLog('info', 'Pusher', 'Dispatching test broadcast...');
        try {
            const res = await axios.get('/api/debug/broadcast');
            addLog('success', 'Pusher', res.data.message);
        } catch (err) {
            addLog('error', 'Pusher', err.message);
        } finally {
            setTestingWS(false);
        }
    }, [addLog]);

    const handleRoleChange = useCallback(async (userId, newRole) => {
        try {
            setUpdating(userId);
            await updateUserRoleApi(userId, newRole);
            await fetchUsers(); // Refresh list
        } catch (error) {
            console.error('Failed to update role:', error);
            alert('Failed to update role');
        } finally {
            setUpdating(null);
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
