/**
 * Attendance Utilities
 * [WHY] Pure formatting and status functions separate from react state.
 */

export const calculateLiveHours = (checkInTime, checkOutTime) => {
    if (!checkInTime || !checkOutTime) return null;
    try {
        const [h1, m1] = checkInTime.split(':').map(Number);
        const [h2, m2] = checkOutTime.split(':').map(Number);
        let diffMins = (h2 * 60 + m2) - (h1 * 60 + m1);
        if (diffMins < 0) {
            // Overnight shift handling
            diffMins += 24 * 60;
        }
        return (diffMins / 60).toFixed(2);
    } catch (e) {
        return null;
    }
};

export const getStatusStyle = (status) => {
    switch (status) {
        case 'working':
            return {
                bg: 'bg-amber-50 border-amber-200 text-amber-700',
                label: 'Đang làm việc',
                bullet: 'bg-amber-500'
            };
        case 'checkout_pending':
            return {
                bg: 'bg-indigo-50 border-indigo-200 text-indigo-700',
                label: 'Chờ duyệt ra ca',
                bullet: 'bg-indigo-500'
            };
        case 'checkout_rejected':
            return {
                bg: 'bg-rose-50 border-rose-200 text-rose-700',
                label: 'Từ chối ra ca',
                bullet: 'bg-rose-500'
            };
        case 'checked_out':
            return {
                bg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
                label: 'Đã check-out',
                bullet: 'bg-emerald-500'
            };
        case 'missing_checkout':
            return {
                bg: 'bg-red-50 border-red-200 text-red-700',
                label: 'Thiếu check-out',
                bullet: 'bg-red-500'
            };
        case 'off_day':
            return {
                bg: 'bg-slate-100 border-slate-200 text-slate-600',
                label: 'Nghỉ phép/Off',
                bullet: 'bg-slate-400'
            };
        case 'not_checked_in':
        default:
            return {
                bg: 'bg-sky-50 border-sky-200 text-sky-700',
                label: 'Chưa check-in',
                bullet: 'bg-sky-400'
            };
    }
};
