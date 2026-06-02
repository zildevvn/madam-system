import React from 'react';
import Icon from '../shared/Icon';
import { ATTENDANCE_STATUS } from '../../shared/constants/attendance';

const ATTENDANCE_STATUS_CONFIG = {
    [ATTENDANCE_STATUS.NOT_CHECKED_IN]: {
        title: 'BẮT ĐẦU CA LÀM VIỆC',
        description: 'Chào mừng bạn! Vui lòng gửi yêu cầu check-in để mở khoá hệ thống order của Madam System.',
        iconName: 'clock',
        iconClass: 'text-amber-500',
        iconBgClass: 'bg-amber-50 border-amber-100',
        actionType: 'check_in',
    },
    [ATTENDANCE_STATUS.PENDING]: {
        title: 'YÊU CẦU CHỜ DUYỆT',
        description: 'Yêu cầu check-in của bạn đã được gửi lên hệ thống quản lý. Vui lòng chờ Manager hoặc Admin phê duyệt ca của bạn.',
        iconName: 'clock',
        iconClass: 'text-amber-500 animate-pulse',
        iconBgClass: 'bg-amber-50 border-amber-100',
        actionType: ATTENDANCE_STATUS.PENDING,
    },
    [ATTENDANCE_STATUS.REJECTED]: {
        title: 'YÊU CẦU BỊ TỪ CHỐI',
        description: 'Yêu cầu check-in hôm nay của bạn đã bị từ chối hoặc bị huỷ. Vui lòng liên hệ quản lý hoặc gửi lại yêu cầu mới.',
        iconName: 'xCircle',
        iconClass: 'text-red-500',
        iconBgClass: 'bg-red-50 border-red-100',
        actionType: 'retry_check_in',
    },
    [ATTENDANCE_STATUS.CHECKED_OUT]: {
        title: 'CA LÀM VIỆC ĐÃ KẾT THÚC',
        description: 'Hôm nay bạn đã hoàn thành xuất sắc ca làm việc của mình! Hẹn gặp lại bạn vào ngày mai.',
        iconName: 'checkCircle',
        iconClass: 'text-emerald-500',
        iconBgClass: 'bg-emerald-50 border-emerald-100',
        actionType: 'none',
    }
};

/**
 * AttendanceBlockScreen Component
 * [WHY] A completely stateless presentational component that renders the mandatory 
 * check-in/block screen overlay with elegant styles and animations.
 */
export default function AttendanceBlockScreen({
    attendanceStatus,
    requesting,
    onRequestCheckIn,
    onRefreshStatus,
    onLogout
}) {
    const config = ATTENDANCE_STATUS_CONFIG[attendanceStatus] || ATTENDANCE_STATUS_CONFIG[ATTENDANCE_STATUS.NOT_CHECKED_IN];

    return (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
            <div className="bg-white rounded-[16px] border border-slate-100 shadow-2xl px-2 py-4 sm:p-8 max-w-md w-full text-center space-y-3 md:space-y-6 animate-in zoom-in-95 duration-300">
                {/* Status Icon */}
                <div className={`w-12 h-12 rounded-3xl ${config.iconBgClass} flex items-center justify-center mx-auto shadow-sm border`}>
                    <Icon name={config.iconName} size={22} className={config.iconClass} />
                </div>

                {/* Title & Desc */}
                <div className="space-y-2">
                    <h5 className="font-black text-slate-800 uppercase tracking-tight">
                        {config.title}
                    </h5>

                    <p className="text-[12px] text-slate-400 leading-relaxed px-4">
                        {config.description}
                    </p>
                </div>

                {/* Actions */}
                <div className="pt-2">
                    {config.actionType === 'check_in' && (
                        <button
                            onClick={onRequestCheckIn}
                            disabled={requesting}
                            className="w-full py-3.5 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase hover:bg-slate-800 transition-colors disabled:opacity-50 shadow-lg active:scale-95 duration-150 border-none cursor-pointer"
                        >
                            {requesting ? 'Đang gửi...' : 'Gửi yêu cầu Check-in'}
                        </button>
                    )}

                    {config.actionType === ATTENDANCE_STATUS.PENDING && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-center gap-2 text-xs font-bold text-amber-600 bg-amber-50 py-3 rounded-2xl border border-amber-100/50">
                                <Icon name="spinner" className="w-4 h-4 text-amber-600 animate-spin" size={16} />
                                Đang kết nối & chờ phản hồi...
                            </div>
                            <button
                                onClick={onRefreshStatus}
                                className="text-xs font-black text-slate-500 hover:text-slate-800 uppercase tracking-wider bg-transparent border-none cursor-pointer"
                            >
                                Tải lại trạng thái
                            </button>
                        </div>
                    )}

                    {config.actionType === 'retry_check_in' && (
                        <button
                            onClick={onRequestCheckIn}
                            disabled={requesting}
                            className="w-full py-3.5 bg-red-600 text-white rounded-2xl text-xs font-black uppercase hover:bg-red-700 transition-colors disabled:opacity-50 shadow-lg active:scale-95 duration-150 border-none cursor-pointer"
                        >
                            {requesting ? 'Đang gửi...' : 'Gửi lại yêu cầu Check-in'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
