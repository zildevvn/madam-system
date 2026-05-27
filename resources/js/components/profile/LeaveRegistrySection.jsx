import React from 'react';
import dayjs from 'dayjs';
import { formatDateToVietnamese } from '../../shared/utils/dateUtils';

// [WHY] Component to handle user leave registration form and display past leave request timeline history.
const LeaveRegistrySection = ({
    leaves,
    showLeaveForm,
    setShowLeaveForm,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    leaveType,
    setLeaveType,
    reason,
    setReason,
    submittingLeave,
    handleCreateLeave
}) => {

    // [WHY] Retrieve translated and styled Vietnamese text for leave request status tags.
    const getStatusText = (status) => {
        switch (status) {
            case 'approved': return 'Đã duyệt';
            case 'rejected': return 'Từ chối';
            default: return 'Chờ duyệt';
        }
    };

    return (
        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-55">
                <h5 className="text-slate-400 uppercase tracking-widest text-[10px] sm:text-xs font-black">
                    Đăng ký & Lịch sử nghỉ phép
                </h5>
                <button
                    type="button"
                    onClick={() => setShowLeaveForm(!showLeaveForm)}
                    className="w-full sm:w-auto text-center px-3 py-2 bg-orange-50 text-orange-600 hover:bg-orange-500 hover:text-white rounded-lg font-black text-[9px] uppercase tracking-wider transition-all border-none cursor-pointer flex items-center justify-center"
                >
                    {showLeaveForm ? 'Đóng' : 'Đăng ký nghỉ'}
                </button>
            </div>

            {/* Leave Register Form */}
            {showLeaveForm && (
                <form onSubmit={handleCreateLeave} className="p-4 rounded-2xl bg-orange-50/30 border border-orange-100/50 space-y-3 animate-in slide-in-from-top-2 duration-200">
                    <div className="space-y-3">
                        <div>
                            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">Thời gian nghỉ</label>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="text-xs w-full bg-white border-none rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-orange-500/10 font-bold"
                                />
                                <span className="text-slate-400 text-[10px] font-black uppercase tracking-wider text-center block sm:inline py-0.5">đến</span>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="text-xs w-full bg-white border-none rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-orange-500/10 font-bold"
                                />
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">Lý do xin nghỉ</label>
                        <input
                            type="text"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Vd: Giải quyết việc gia đình..."
                            className="text-xs w-full bg-white border-none rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-orange-500/10 placeholder:text-slate-300"
                        />
                    </div>
                    <div className="flex justify-end pt-1 w-full">
                        <button
                            type="submit"
                            disabled={submittingLeave}
                            className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-orange-500 text-white rounded-lg font-black text-[9px] uppercase tracking-wider hover:bg-orange-600 transition-all border-none cursor-pointer flex items-center justify-center text-center"
                        >
                            {submittingLeave ? 'Đang gửi...' : 'Gửi đơn đăng ký'}
                        </button>
                    </div>
                </form>
            )}

            {/* Leaves list */}
            {leaves.length > 0 ? (
                <div className="space-y-3">
                    {leaves.map((leave) => {
                        const totalDays = dayjs(leave.end_date).diff(dayjs(leave.start_date), 'day') + 1;

                        // Custom colors & styles based on status
                        let statusBgColor = 'bg-amber-50/30 border-amber-100 hover:border-amber-200';
                        let statusBorderLeft = 'border-l-4 border-l-amber-500';
                        let badgeStyle = 'bg-amber-100 text-amber-800 border-amber-200/50';
                        let statusIcon = (
                            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0 shadow-sm shadow-amber-500/10">
                                <svg className="w-4 h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                        );

                        if (leave.status === 'approved') {
                            statusBgColor = 'bg-emerald-50/20 border-emerald-100 hover:border-emerald-200';
                            statusBorderLeft = 'border-l-4 border-l-emerald-500';
                            badgeStyle = 'bg-emerald-100 text-emerald-800 border-emerald-200/50';
                            statusIcon = (
                                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 shadow-sm shadow-emerald-500/10">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                                </div>
                            );
                        } else if (leave.status === 'rejected') {
                            statusBgColor = 'bg-red-50/20 border-red-100 hover:border-red-200';
                            statusBorderLeft = 'border-l-4 border-l-red-500';
                            badgeStyle = 'bg-red-100 text-red-800 border-red-200/50';
                            statusIcon = (
                                <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0 shadow-sm shadow-red-500/10">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                                </div>
                            );
                        }

                        return (
                            <div 
                                key={leave.id} 
                                className={`p-4 rounded-2xl border transition-all ${statusBgColor} ${statusBorderLeft} flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:shadow-md hover:shadow-slate-500/5`}
                            >
                                <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
                                    {statusIcon}
                                    <div className="space-y-0.5 min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            <span className="text-xs font-black text-slate-800 tracking-tight">
                                                {formatDateToVietnamese(leave.start_date)} - {formatDateToVietnamese(leave.end_date)}
                                            </span>
                                            <span className="text-[10px] text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200/50">
                                                {totalDays} ngày
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-600 font-medium truncate max-w-full sm:max-w-xs" title={leave.reason}>
                                            Lý do: <span className="text-slate-500 italic">{leave.reason || 'Không ghi lý do'}</span>
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 pt-2 sm:pt-0 border-t border-dashed border-slate-200/50 sm:border-none w-full sm:w-auto flex-shrink-0 text-right font-bold">
                                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${badgeStyle}`}>
                                        {getStatusText(leave.status)}
                                    </span>
                                    {leave.status !== 'pending' && leave.approver && (
                                        <span className="text-[8px] text-slate-400 font-bold flex items-center gap-1 mt-0 sm:mt-1.5">
                                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                            {leave.approver.name}
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <p className="text-xs text-slate-400 italic text-center py-4">Bạn chưa đăng ký yêu cầu nghỉ phép nào</p>
            )}
        </div>
    );
};

export default LeaveRegistrySection;
