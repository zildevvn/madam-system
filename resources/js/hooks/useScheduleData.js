import { useState, useEffect } from 'react';
import { getUsersApi } from '../services/userService';
import { getLeaveRequestsApi } from '../services/leaveService';
import toast from 'react-hot-toast';

/**
 * useScheduleData Micro-Hook
 * [WHY] Single responsibility of handling API data fetching, error trapping, and baseline state.
 * [RULE] Adheres to micro-hooks composition model under 200 lines.
 */
export default function useScheduleData() {
    const [employees, setEmployees] = useState([]);
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadData = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const [usersRes, leavesRes] = await Promise.all([
                getUsersApi(),
                getLeaveRequestsApi()
            ]);
            if (usersRes?.data) setEmployees(usersRes.data);
            if (leavesRes?.data) setLeaves(leavesRes.data);
        } catch (error) {
            console.error('Failed to load schedule metadata:', error);
            toast.error('Không thể tải dữ liệu lịch làm việc');
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        loadData();

        if (window.Echo) {
            const channel = window.Echo.channel('orders');
            const handleLeaveUpdate = () => {
                loadData(true);
            };
            channel.listen('.leave_updated', handleLeaveUpdate);
            return () => {
                channel.stopListening('.leave_updated', handleLeaveUpdate);
            };
        }
    }, []);

    return { employees, leaves, loading, loadData };
}
