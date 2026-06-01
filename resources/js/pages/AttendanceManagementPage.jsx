import React, { useState } from 'react';
import { useAttendance } from '../hooks/useAttendance';
import AttendanceStats from '../components/attendance/AttendanceStats';
import AttendanceTable from '../components/attendance/AttendanceTable';
import AttendanceEditModal from '../components/attendance/AttendanceEditModal';
import Icon from '../components/shared/Icon';
import ConfirmDialog from '../components/shared/ConfirmDialog';
import { ATTENDANCE_STATUS, ATTENDANCE_STATUS_LABELS } from '../shared/constants/attendance';

const getInitialDate = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * AttendanceManagementPage Component
 * [WHY] Serves as the main orchestrator for the Attendance module.
 */
export default function AttendanceManagementPage() {
    const [rejectPending, setRejectPending] = useState(null); // { id, name }
    const {
        selectedDate,
        setSelectedDate,
        attendances,
        loading,
        searchQuery,
        setSearchQuery,
        statusFilter,
        setStatusFilter,
        isModalOpen,
        setIsModalOpen,
        editingRecord,
        checkInTime,
        setCheckInTime,
        checkOutTime,
        setCheckOutTime,
        recordStatus,
        setRecordStatus,
        submitting,
        handleQuickCheckIn,
        handleQuickCheckOut,
        openEditModal,
        handleSave,
        handleResetRecord,
        handleApproveRequest,
        handleRejectRequest,
        filteredRecords,
        changeDate,
        stats,
        allPendingRequests
    } = useAttendance(getInitialDate());

    return (
        <>
            <div className="space-y-6 mx-auto max-w-7xl px-3 sm:px-5 lg:px-6 py-4 sm:py-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Header Banner */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h4 className="text-slate-900 tracking-tight uppercase font-black">QUẢN LÝ CHẤM CÔNG</h4>
                    </div>

                    {/* Date Navigator Banner */}
                    <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-xl border border-slate-100 shadow-sm self-start">
                        <button
                            onClick={() => changeDate(-1)}
                            className="p-1 text-slate-500 hover:bg-slate-50 rounded-lg transition-all flex items-center justify-center border-none cursor-pointer"
                        >
                            <Icon name="chevronLeft" className="w-4 h-4 text-slate-500" size={16} />
                        </button>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="bg-transparent text-xs font-black text-slate-800 text-center outline-none border-none focus:ring-0 select-none py-0.5 px-1.5 cursor-pointer"
                        />
                        <button
                            onClick={() => changeDate(1)}
                            className="p-1 text-slate-500 hover:bg-slate-50 rounded-lg transition-all flex items-center justify-center border-none cursor-pointer"
                        >
                            <Icon name="chevronRight" className="w-4 h-4 text-slate-500" size={16} />
                        </button>
                    </div>
                </div>

                {/* Pending Requests Banner */}
                {allPendingRequests.length > 0 && (
                    <div className="bg-amber-50/40 rounded-md px-2 py-3 sm:p-5  space-y-2 animate-in slide-in-from-top-4 duration-500">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="flex h-2.5 w-2.5 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                                </span>
                                <h6 className="text-amber-800 uppercase tracking-wider">Yêu cầu chờ duyệt ({allPendingRequests.length})</h6>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {allPendingRequests.map(req => (
                                /* 
                                 * [WHY] Composite key prevents collisions because a single attendance_id 
                                 * can contain multiple concurrent request types (e.g. pending check-in and check-out).
                                 */
                                <div key={`${req.attendance_id}-${req.type}`} className="bg-white px-2 py-3 md:p-3 rounded-md border border-slate-100 flex items-center justify-between gap-3 shadow-xs">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="w-9 h-9 rounded-xl bg-slate-100 overflow-hidden border border-slate-200/50 flex items-center justify-center font-bold text-slate-400 uppercase text-xs flex-shrink-0">
                                            {req.employee_avatar ? (
                                                <img src={req.employee_avatar} alt="" className="w-full h-full object-cover" />
                                            ) : req.employee_name.substring(0, 2)}
                                        </div>
                                        <div className="min-w-0">
                                            <h6 className="text-xs font-black text-slate-800 uppercase truncate leading-none flex items-center gap-1.5">
                                                {req.employee_name}
                                                <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider ${req.type === 'check_in'
                                                    ? 'bg-amber-100 text-amber-800'
                                                    : 'bg-indigo-100 text-indigo-800'
                                                    }`}>
                                                    {req.type === 'check_in' ? 'Check-in' : 'Ra ca'}
                                                </span>
                                            </h6>
                                            <span className="text-[7.5px] text-slate-400 font-bold mt-1 inline-block leading-none">
                                                {req.type === 'check_in'
                                                    ? `Yêu cầu check-in lúc: ${req.check_in ? req.check_in.substring(0, 5) : '--:--'}`
                                                    : `Yêu cầu ra ca`
                                                }
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                        <button
                                            onClick={() => setRejectPending({ id: req.attendance_id, name: req.employee_name })}
                                            className="px-2 py-1.5 bg-slate-100 hover:bg-red-50 hover:text-red-600 rounded-lg text-[9px] font-black uppercase text-slate-500 transition-colors border-none cursor-pointer"
                                        >
                                            Từ chối
                                        </button>
                                        <button
                                            onClick={() => handleApproveRequest(req.attendance_id, req.employee_name)}
                                            className={`px-2 py-1.5 text-white rounded-lg text-[9px] font-black uppercase transition-colors border-none cursor-pointer shadow-xs ${req.type === 'check_in'
                                                ? 'bg-amber-500 hover:bg-amber-600'
                                                : 'bg-indigo-600 hover:bg-indigo-700'
                                                }`}
                                        >
                                            Duyệt
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Statistics Cards */}
                <AttendanceStats stats={stats} />

                {/* Filter Panel */}
                <div className="bg-white p-4 rounded-[16px] border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="relative w-full sm:max-w-xs">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                            <Icon name="search" size={16} className="w-4 h-4 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Tìm nhân viên..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 font-bold focus:outline-none focus:border-orange-500 transition-colors"
                        />
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
                        {[
                            ATTENDANCE_STATUS.ALL,
                            ATTENDANCE_STATUS.NOT_CHECKED_IN,
                            ATTENDANCE_STATUS.WORKING,
                            ATTENDANCE_STATUS.CHECKED_OUT,
                            ATTENDANCE_STATUS.MISSING_CHECKOUT,
                            ATTENDANCE_STATUS.OFF_DAY
                        ].map((status) => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${statusFilter === status
                                    ? 'bg-slate-900 text-white shadow-md'
                                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                    }`}
                            >
                                {ATTENDANCE_STATUS_LABELS[status]}
                            </button>
                        ))}
                    </div>
                </div>

                {/* List & Cards Content */}
                {loading ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-3">
                        <Icon name="spinner" size={32} className="w-8 h-8 text-orange-500 animate-spin" />
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Đang tải dữ liệu chấm công...</span>
                    </div>
                ) : filteredRecords.length > 0 ? (
                    <AttendanceTable
                        records={filteredRecords}
                        handleQuickCheckIn={handleQuickCheckIn}
                        handleQuickCheckOut={handleQuickCheckOut}
                        openEditModal={openEditModal}
                    />
                ) : (
                    <div className="py-20 flex flex-col items-center justify-center gap-2 text-center bg-white rounded-3xl border border-slate-100 shadow-sm">
                        <Icon name="alert" size={40} className="w-10 h-10 text-slate-300" />
                        <h5 className="text-sm font-black text-slate-700 uppercase tracking-tight mt-1">Không tìm thấy nhân viên nào</h5>
                        <p className="text-xs text-slate-400">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm khác.</p>
                    </div>
                )}
            </div>


            {/* Editing popover/modal */}
            <AttendanceEditModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                editingRecord={editingRecord}
                selectedDate={selectedDate}
                checkInTime={checkInTime}
                setCheckInTime={setCheckInTime}
                checkOutTime={checkOutTime}
                setCheckOutTime={setCheckOutTime}
                recordStatus={recordStatus}
                setRecordStatus={setRecordStatus}
                submitting={submitting}
                handleSave={handleSave}
                handleResetRecord={handleResetRecord}
            />

            <ConfirmDialog
                isOpen={!!rejectPending}
                title="Từ chối yêu cầu"
                message={`Bạn có chắc muốn từ chối yêu cầu của ${rejectPending?.name}?`}
                confirmText="Từ chối"
                cancelText="Hủy"
                type="danger"
                onConfirm={() => {
                    handleRejectRequest(rejectPending.id, rejectPending.name);
                    setRejectPending(null);
                }}
                onCancel={() => setRejectPending(null)}
            />
        </>
    );
}
