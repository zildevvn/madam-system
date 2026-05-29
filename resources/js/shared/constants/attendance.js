export const ATTENDANCE_STATUS = {
    ALL: 'all',
    NOT_CHECKED_IN: 'not_checked_in',
    WORKING: 'working',
    CHECKED_OUT: 'checked_out',
    MISSING_CHECKOUT: 'missing_checkout',
    OFF_DAY: 'off_day',
    PENDING: 'pending',
    REJECTED: 'rejected',
    CHECKOUT_PENDING: 'checkout_pending',
    CHECKOUT_REJECTED: 'checkout_rejected'
};

export const ATTENDANCE_STATUS_LABELS = {
    [ATTENDANCE_STATUS.ALL]: 'Tất cả',
    [ATTENDANCE_STATUS.NOT_CHECKED_IN]: 'Chưa Check-in',
    [ATTENDANCE_STATUS.WORKING]: 'Đang làm',
    [ATTENDANCE_STATUS.CHECKED_OUT]: 'Đã check-out',
    [ATTENDANCE_STATUS.MISSING_CHECKOUT]: 'Thiếu checkout',
    [ATTENDANCE_STATUS.OFF_DAY]: 'Nghỉ/Off',
    [ATTENDANCE_STATUS.PENDING]: 'Chờ duyệt check-in',
    [ATTENDANCE_STATUS.REJECTED]: 'Từ chối check-in',
    [ATTENDANCE_STATUS.CHECKOUT_PENDING]: 'Chờ duyệt ra ca',
    [ATTENDANCE_STATUS.CHECKOUT_REJECTED]: 'Từ chối ra ca'
};
