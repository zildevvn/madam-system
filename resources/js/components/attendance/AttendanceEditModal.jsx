import React, { useState } from 'react';
import { calculateLiveHours } from '../../shared/utils/attendanceUtils';
import Icon from '../shared/Icon';
import ConfirmDialog from '../shared/ConfirmDialog';
import { ATTENDANCE_STATUS } from '../../shared/constants/attendance';

/**
 * AttendanceEditModal Component
 * [WHY] Premium popover/modal to manually input, modify or delete raw check times.
 */
export default function AttendanceEditModal({
    isOpen,
    onClose,
    editingRecord,
    selectedDate,
    checkInTime,
    setCheckInTime,
    checkOutTime,
    setCheckOutTime,
    recordStatus,
    setRecordStatus,
    submitting,
    handleSave,
    handleResetRecord
}) {
    if (!isOpen) return null;

    const [showConfirm, setShowConfirm] = useState(false);
    const liveHours = calculateLiveHours(checkInTime, checkOutTime);

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Modal Header */}
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Chỉnh sửa Chấm Công</span>
                        <h4 className="text-sm font-black text-slate-800 uppercase mt-0.5 tracking-tight">{editingRecord?.employee_name}</h4>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl transition-all"
                    >
                        <Icon name="close" className="w-5 h-5" />
                    </button>
                </div>

                {/* Modal Form */}
                <form onSubmit={handleSave}>
                    <div className="p-6 space-y-4">
                        {/* Date details */}
                        <div className="bg-slate-50/50 px-4 py-2.5 rounded-2xl border border-slate-100/50 flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Ngày làm việc:</span>
                            <span className="font-black text-slate-700">{selectedDate}</span>
                        </div>

                        {/* Status Selectors */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Trạng thái chấm công</label>
                            <div className="grid grid-cols-2 gap-1.5">
                                {[
                                    { val: ATTENDANCE_STATUS.WORKING, label: 'Đang làm' },
                                    { val: ATTENDANCE_STATUS.CHECKED_OUT, label: 'Đã check-out' },
                                    { val: ATTENDANCE_STATUS.MISSING_CHECKOUT, label: 'Thiếu checkout' },
                                    { val: ATTENDANCE_STATUS.OFF_DAY, label: 'Nghỉ/Off' }
                                ].map((item) => (
                                    <button
                                        key={item.val}
                                        type="button"
                                        onClick={() => setRecordStatus(item.val)}
                                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${recordStatus === item.val
                                            ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                            }`}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Custom Time Fields */}
                        {recordStatus !== ATTENDANCE_STATUS.OFF_DAY && (
                            <div className="grid grid-cols-2 gap-3 animate-in fade-in duration-200">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Giờ vào</label>
                                    <input
                                        type="time"
                                        value={checkInTime}
                                        onChange={(e) => setCheckInTime(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-slate-800"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Giờ ra</label>
                                    <input
                                        type="time"
                                        value={checkOutTime}
                                        onChange={(e) => setCheckOutTime(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-slate-800"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Calculated Live Hours */}
                        {recordStatus !== ATTENDANCE_STATUS.OFF_DAY && checkInTime && checkOutTime && (
                            <div className="bg-emerald-50 px-4 py-3 rounded-2xl border border-emerald-100/50 flex items-center justify-between text-xs animate-in zoom-in-95 duration-200">
                                <span className="font-bold text-emerald-600">Tổng thời gian tính toán:</span>
                                <span className="font-black text-emerald-800 text-sm">{liveHours} giờ</span>
                            </div>
                        )}
                    </div>

                    {/* Modal Actions */}
                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
                        {editingRecord?.attendance_id ? (
                            <button
                                type="button"
                                disabled={submitting}
                                onClick={() => setShowConfirm(true)}
                                className="text-red-500 hover:text-red-700 text-xs font-black uppercase tracking-wider border-none bg-transparent cursor-pointer"
                            >
                                Xoá/Đặt lại
                            </button>
                        ) : <div />}

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors border-none bg-transparent cursor-pointer"
                            >
                                Đóng
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black uppercase hover:bg-slate-800 transition-colors disabled:opacity-50 shadow-md border-none cursor-pointer"
                            >
                                Lưu lại
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            <ConfirmDialog
                isOpen={showConfirm}
                title="Đặt lại bản ghi"
                message={`Bạn muốn xoá bản ghi chấm công của ${editingRecord?.employee_name}?`}
                confirmText="Xoá/Đặt lại"
                cancelText="Hủy"
                type="danger"
                onConfirm={() => {
                    setShowConfirm(false);
                    handleResetRecord();
                }}
                onCancel={() => setShowConfirm(false)}
            />
        </div>
    );
}
