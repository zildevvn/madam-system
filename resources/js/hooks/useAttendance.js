import { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { attendanceApi } from '../services/attendanceApi';
import toast from 'react-hot-toast';
import { ATTENDANCE_STATUS } from '../shared/constants/attendance';

/**
 * useAttendanceUI Custom Hook
 * [WHY] Manage all filters, queries, modal, dates, and selected record editing states.
 */
export const useAttendanceUI = (initialDate) => {
    const [selectedDate, setSelectedDate] = useState(initialDate);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState(ATTENDANCE_STATUS.ALL);

    // Editing states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState(null);
    const [checkInTime, setCheckInTime] = useState('');
    const [checkOutTime, setCheckOutTime] = useState('');
    const [recordStatus, setRecordStatus] = useState(ATTENDANCE_STATUS.WORKING);

    const changeDate = (days) => {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() + days);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        setSelectedDate(`${year}-${month}-${day}`);
    };

    return {
        selectedDate,
        setSelectedDate,
        searchQuery,
        setSearchQuery,
        statusFilter,
        setStatusFilter,
        isModalOpen,
        setIsModalOpen,
        editingRecord,
        setEditingRecord,
        checkInTime,
        setCheckInTime,
        checkOutTime,
        setCheckOutTime,
        recordStatus,
        setRecordStatus,
        changeDate
    };
};

/**
 * useAttendanceRecords Custom Hook
 * [WHY] Manage loading the list of attendances for a date and matching against search and status filters.
 */
export const useAttendanceRecords = (selectedDate, searchQuery, statusFilter) => {
    const [attendances, setAttendances] = useState([]);
    const [loading, setLoading] = useState(false);

    const loadAttendances = useCallback(async (signal) => {
        setLoading(true);
        try {
            const data = await attendanceApi.getAttendances(selectedDate, signal ? { signal } : {});
            setAttendances(data.data || []);
        } catch (error) {
            if (axios.isCancel(error)) return;
            toast.error('Không thể tải danh sách chấm công');
        } finally {
            setLoading(false);
        }
    }, [selectedDate]);

    useEffect(() => {
        const controller = new AbortController();
        loadAttendances(controller.signal);
        return () => controller.abort();
    }, [loadAttendances]);

    const filteredRecords = useMemo(() => {
        return attendances.filter(rec => {
            const matchesSearch = rec.employee_name.toLowerCase().includes(searchQuery.toLowerCase());
            let matchesStatus = false;
            if (statusFilter === ATTENDANCE_STATUS.ALL) {
                matchesStatus = true;
            } else if (statusFilter === ATTENDANCE_STATUS.WORKING) {
                matchesStatus = [
                    ATTENDANCE_STATUS.WORKING,
                    ATTENDANCE_STATUS.CHECKOUT_PENDING,
                    ATTENDANCE_STATUS.CHECKOUT_REJECTED
                ].includes(rec.status);
            } else {
                matchesStatus = rec.status === statusFilter;
            }
            return matchesSearch && matchesStatus;
        });
    }, [attendances, searchQuery, statusFilter]);

    const allPendingRequests = useMemo(() => {
        const pendingCheckIns = attendances.filter(r => r.status === ATTENDANCE_STATUS.PENDING);
        const pendingCheckOuts = attendances.filter(r => r.status === ATTENDANCE_STATUS.CHECKOUT_PENDING);
        return [
            ...pendingCheckIns.map(r => ({ ...r, type: 'check_in' })),
            ...pendingCheckOuts.map(r => ({ ...r, type: 'check_out' }))
        ];
    }, [attendances]);

    return {
        attendances,
        setAttendances,
        loading,
        filteredRecords,
        allPendingRequests,
        loadAttendances
    };
};

/**
 * useAttendanceStats Custom Hook
 * [WHY] Computes daily summary statistics for UI dashboard indicators.
 */
export const useAttendanceStats = (attendances) => {
    const stats = useMemo(() => ({
        total: attendances.length,
        working: attendances.filter(r => [
            ATTENDANCE_STATUS.WORKING,
            ATTENDANCE_STATUS.CHECKOUT_PENDING,
            ATTENDANCE_STATUS.CHECKOUT_REJECTED
        ].includes(r.status)).length,
        checkedOut: attendances.filter(r => r.status === ATTENDANCE_STATUS.CHECKED_OUT).length,
        missing: attendances.filter(r => r.status === ATTENDANCE_STATUS.MISSING_CHECKOUT).length,
        off: attendances.filter(r => r.status === ATTENDANCE_STATUS.OFF_DAY).length,
    }), [attendances]);

    return stats;
};

/**
 * useAttendanceActions Custom Hook
 * [WHY] Handles all API actions, check-in, check-out, manual corrections, and check-in/out approvals.
 */
export const useAttendanceActions = ({
    selectedDate,
    editingRecord,
    setEditingRecord,
    checkInTime,
    setCheckInTime,
    checkOutTime,
    setCheckOutTime,
    recordStatus,
    setRecordStatus,
    setIsModalOpen,
    loadAttendances
}) => {
    const [submitting, setSubmitting] = useState(false);

    const handleQuickCheckIn = useCallback(async (record) => {
        const now = new Date();
        const checkIn = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        try {
            await attendanceApi.saveAttendance({
                user_id: record.employee_id,
                date: selectedDate,
                check_in: checkIn,
                check_out: null,
                status: ATTENDANCE_STATUS.WORKING
            });
            toast.success(`Đã check-in cho ${record.employee_name} lúc ${checkIn}`);
            loadAttendances();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Check-in thất bại');
        }
    }, [selectedDate, loadAttendances]);

    const handleQuickCheckOut = useCallback(async (record) => {
        const now = new Date();
        const checkOut = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        try {
            await attendanceApi.saveAttendance({
                user_id: record.employee_id,
                date: selectedDate,
                check_in: record.check_in || '08:00',
                check_out: checkOut,
                status: ATTENDANCE_STATUS.CHECKED_OUT
            });
            toast.success(`Đã check-out cho ${record.employee_name} lúc ${checkOut}`);
            loadAttendances();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Check-out thất bại');
        }
    }, [selectedDate, loadAttendances]);

    const openEditModal = useCallback((record) => {
        setEditingRecord(record);
        setCheckInTime(record.check_in ? record.check_in.substring(0, 5) : '08:00');
        setCheckOutTime(record.check_out ? record.check_out.substring(0, 5) : '');
        setRecordStatus(record.status === ATTENDANCE_STATUS.NOT_CHECKED_IN ? ATTENDANCE_STATUS.WORKING : record.status);
        setIsModalOpen(true);
    }, [setEditingRecord, setCheckInTime, setCheckOutTime, setRecordStatus, setIsModalOpen]);

    const handleSave = useCallback(async (e) => {
        if (e) e.preventDefault();

        if (checkInTime && checkOutTime) {
            if (checkOutTime <= checkInTime) {
                toast.error('Giờ check-out phải sau giờ check-in.');
                return;
            }
        }

        setSubmitting(true);
        try {
            await attendanceApi.saveAttendance({
                user_id: editingRecord.employee_id,
                date: selectedDate,
                check_in: checkInTime || null,
                check_out: checkOutTime || null,
                status: recordStatus
            });
            toast.success('Cập nhật chấm công thành công');
            setIsModalOpen(false);
            loadAttendances();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Cập nhật thất bại');
        } finally {
            setSubmitting(false);
        }
    }, [checkInTime, checkOutTime, editingRecord, selectedDate, recordStatus, setIsModalOpen, loadAttendances]);

    const handleResetRecord = useCallback(async () => {
        if (!editingRecord) return;
        setSubmitting(true);
        try {
            await attendanceApi.saveAttendance({
                user_id: editingRecord.employee_id,
                date: selectedDate,
                check_in: null,
                check_out: null,
                status: ATTENDANCE_STATUS.NOT_CHECKED_IN
            });
            toast.success('Đã khôi phục chấm công về mặc định');
            setIsModalOpen(false);
            loadAttendances();
        } catch (err) {
            toast.error('Không thể khôi phục chấm công');
        } finally {
            setSubmitting(false);
        }
    }, [editingRecord, selectedDate, setIsModalOpen, loadAttendances]);

    const handleApproveRequest = useCallback(async (attendanceId, name) => {
        try {
            const res = await attendanceApi.approveRequest(attendanceId);
            toast.success(res.message || `Đã phê duyệt thành công cho ${name}`);
            loadAttendances();
        } catch (err) {
            toast.error('Phê duyệt thất bại');
        }
    }, [loadAttendances]);

    const handleRejectRequest = useCallback(async (attendanceId, name) => {
        try {
            const res = await attendanceApi.rejectRequest(attendanceId);
            toast.success(res.message || `Đã từ chối yêu cầu của ${name}`);
            loadAttendances();
        } catch (err) {
            toast.error('Từ chối thất bại');
        }
    }, [loadAttendances]);

    return {
        submitting,
        handleQuickCheckIn,
        handleQuickCheckOut,
        openEditModal,
        handleSave,
        handleResetRecord,
        handleApproveRequest,
        handleRejectRequest
    };
};

/**
 * useAttendance Orchestration Hook
 * [WHY] Backward compatible orchestrator composed of modular UI, Records, Stats, and Actions hooks.
 */
export const useAttendance = (initialDate) => {
    const ui = useAttendanceUI(initialDate);
    const records = useAttendanceRecords(ui.selectedDate, ui.searchQuery, ui.statusFilter);
    const stats = useAttendanceStats(records.attendances);
    const actions = useAttendanceActions({
        selectedDate: ui.selectedDate,
        editingRecord: ui.editingRecord,
        setEditingRecord: ui.setEditingRecord,
        checkInTime: ui.checkInTime,
        setCheckInTime: ui.setCheckInTime,
        checkOutTime: ui.checkOutTime,
        setCheckOutTime: ui.setCheckOutTime,
        recordStatus: ui.recordStatus,
        setRecordStatus: ui.setRecordStatus,
        setIsModalOpen: ui.setIsModalOpen,
        loadAttendances: records.loadAttendances
    });

    return {
        ...ui,
        ...records,
        stats,
        ...actions
    };
};
