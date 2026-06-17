import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import { createLeaveRequestApi, deleteLeaveRequestApi } from '../services/leaveService';
import { getTodayDateString, formatToLocalDateStr, isDateInRange } from '../shared/utils/dateUtils';

// [WHY] Decoupled hook for managing leave request submissions, input bounds, and approved overlap checks.
export const useLeaveRequests = (user, leaves, fetchProfileAndLeaves) => {
    const [showLeaveForm, setShowLeaveForm] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [leaveType, setLeaveType] = useState('paid');
    const [reason, setReason] = useState('');
    const [submittingLeave, setSubmittingLeave] = useState(false);

    useEffect(() => {
        const today = getTodayDateString();
        setStartDate(today);
        setEndDate(today);
    }, [user]);

    // [WHY] Check if a specific calendar date falls inside an approved leave range.
    const isDateOnLeave = (dateStr) => {
        return leaves.some(l => {
            const start = formatToLocalDateStr(l.start_date);
            const end = formatToLocalDateStr(l.end_date);
            return isDateInRange(dateStr, start, end) && 
                (l.status === 'approved' || l.status === 'pending_cancel' || l.status === 'rejected_cancel');
        });
    };

    const handleCreateLeave = async (e) => {
        e.preventDefault();

        if (dayjs(startDate).isAfter(dayjs(endDate))) {
            toast.error('Ngày bắt đầu không được lớn hơn ngày kết thúc');
            return;
        }

        if (!reason || !reason.trim()) {
            toast.error('Vui lòng nhập lý do nghỉ phép');
            return;
        }

        setSubmittingLeave(true);
        try {
            await createLeaveRequestApi({
                user_id: user.id,
                start_date: startDate,
                end_date: endDate,
                leave_type: leaveType,
                reason: reason
            });

            toast.success('Đăng ký xin nghỉ phép thành công!');
            setShowLeaveForm(false);
            setReason('');
            fetchProfileAndLeaves();
        } catch (err) {
            console.error('Failed to submit leave request:', err);
            const msg = err.response?.data?.message || 'Có lỗi xảy ra khi gửi yêu cầu';
            toast.error(msg);
        } finally {
            setSubmittingLeave(false);
        }
    };

    const handleCancelLeave = async (leave) => {
        const isApproved = leave.status === 'approved' || leave.status === 'rejected_cancel';
        const confirmMsg = isApproved 
            ? 'Bạn có chắc chắn muốn gửi yêu cầu HỦY nghỉ phép đã duyệt này? Yêu cầu cần Quản lý phê duyệt.'
            : 'Bạn có chắc chắn muốn hủy yêu cầu nghỉ phép này?';
        
        if (!window.confirm(confirmMsg)) return;

        try {
            await deleteLeaveRequestApi(leave.id);
            const successMsg = isApproved 
                ? 'Gửi yêu cầu hủy nghỉ phép thành công, vui lòng chờ duyệt!'
                : 'Hủy yêu cầu nghỉ phép thành công!';
            toast.success(successMsg);
            fetchProfileAndLeaves();
        } catch (err) {
            console.error('Failed to cancel leave request:', err);
            const msg = err.response?.data?.message || 'Có lỗi xảy ra khi hủy yêu cầu';
            toast.error(msg);
        }
    };

    return {
        showLeaveForm, setShowLeaveForm,
        startDate, setStartDate,
        endDate, setEndDate,
        leaveType, setLeaveType,
        reason, setReason,
        submittingLeave,
        isDateOnLeave,
        handleCreateLeave,
        handleCancelLeave
    };
};
