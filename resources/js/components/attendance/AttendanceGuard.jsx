import React, { useState, useEffect, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logout } from '../../store/slices/authSlice';
import Icon from '../shared/Icon';
import { ROLES } from '../../shared/constants/roles';
import AttendanceBlockScreen from './AttendanceBlockScreen';
import { fetchTodayAttendanceStatus } from '../../store/slices/attendanceSlice';
import { attendanceApi } from '../../services/attendanceApi';
import { ATTENDANCE_STATUS } from '../../shared/constants/attendance';

/**
 * AttendanceGuard Component
 * [WHY] Enforces mandatory check-in validation for order_staff globally.
 * Blocks rendering of any child routes with a secure check-in request overlay modal.
 */
export default function AttendanceGuard({ children }) {
    const dispatch = useAppDispatch();
    const currentUser = useCurrentUser();
    const { todayStatus } = useAppSelector(state => state.attendance);
    const [requesting, setRequesting] = useState(false);

    const attendanceStatus = useMemo(() => {
        if (!currentUser || currentUser.role !== ROLES.ORDER_STAFF) {
            return 'approved';
        }
        if (todayStatus === null) {
            return 'loading';
        }
        if ([
            ATTENDANCE_STATUS.WORKING,
            ATTENDANCE_STATUS.OFF_DAY,
            ATTENDANCE_STATUS.CHECKOUT_PENDING,
            ATTENDANCE_STATUS.CHECKOUT_REJECTED
        ].includes(todayStatus)) {
            return 'approved';
        }
        return todayStatus;
    }, [currentUser, todayStatus]);

    const checkTodayStatus = useCallback((signal) => {
        if (currentUser && currentUser.role === ROLES.ORDER_STAFF) {
            dispatch(fetchTodayAttendanceStatus(signal));
        }
    }, [dispatch, currentUser]);

    useEffect(() => {
        const controller = new AbortController();
        checkTodayStatus(controller.signal);

        let interval;

        const startPolling = () => {
            if (interval) return;
            if (currentUser && currentUser.role === ROLES.ORDER_STAFF) {
                interval = setInterval(() => {
                    if (document.visibilityState === 'visible') {
                        checkTodayStatus(controller.signal);
                    }
                }, 10000); // Poll every 10s for real-time approval synchronization
            }
        };

        const stopPolling = () => {
            if (interval) {
                clearInterval(interval);
                interval = null;
            }
        };

        // Start polling initially if tab is active
        if (document.visibilityState === 'visible') {
            startPolling();
        }

        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                // Immediately refresh when re-focusing
                checkTodayStatus(controller.signal);
                startPolling();
            } else {
                stopPolling();
            }
        };

        document.addEventListener('visibilitychange', handleVisibility);

        return () => {
            controller.abort();
            stopPolling();
            document.removeEventListener('visibilitychange', handleVisibility);
        };
    }, [currentUser, checkTodayStatus]);

    const handleRequestCheckIn = async () => {
        setRequesting(true);
        try {
            const data = await attendanceApi.requestCheckIn();
            toast.success(data.message || 'Đã gửi yêu cầu check-in');
            checkTodayStatus();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Gửi yêu cầu thất bại');
        } finally {
            setRequesting(false);
        }
    };

    if (attendanceStatus === 'loading') {
        // Unauthenticated or non order_staff bypasses loader immediately
        if (!currentUser || currentUser.role !== ROLES.ORDER_STAFF) {
            return children;
        }

        return (
            <div className="fixed inset-0 bg-slate-900 z-[9999] flex flex-col items-center justify-center gap-3">
                <Icon name="spinner" className="w-10 h-10 text-orange-500 animate-spin" size={40} />
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Đang kiểm tra trạng thái chấm công...</span>
            </div>
        );
    }

    if ([
        ATTENDANCE_STATUS.NOT_CHECKED_IN,
        ATTENDANCE_STATUS.PENDING,
        ATTENDANCE_STATUS.REJECTED,
        ATTENDANCE_STATUS.CHECKED_OUT
    ].includes(attendanceStatus)) {
        return (
            <AttendanceBlockScreen
                attendanceStatus={attendanceStatus}
                requesting={requesting}
                onRequestCheckIn={handleRequestCheckIn}
                onRefreshStatus={checkTodayStatus}
                onLogout={() => dispatch(logout())}
            />
        );
    }

    return children;
}
