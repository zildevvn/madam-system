import React from 'react';
import { getStatusStyle } from '../../shared/utils/attendanceUtils';
import Icon from '../shared/Icon';
import { ATTENDANCE_STATUS } from '../../shared/constants/attendance';

/**
 * AttendanceTable Component
 * [WHY] Displays attendance data in responsive table layout for desktop and cards layout for mobile.
 */
export default function AttendanceTable({
    records,
    handleQuickCheckIn,
    handleQuickCheckOut,
    openEditModal
}) {
    return (
        <>
            {/* Desktop/Tablet Table layout */}
            <div className="hidden md:block bg-white rounded-md border border-slate-100 shadow-sm overflow-hidden animate-in fade-in duration-300">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="py-4 px-6 text-[10px] font-black text-slate-600 uppercase tracking-wider">Nhân viên</th>
                            <th className="py-4 px-6 text-[10px] font-black text-slate-600 uppercase tracking-wider">Lịch làm việc</th>
                            <th className="py-4 px-6 text-[10px] font-black text-slate-600 uppercase tracking-wider text-center">Giờ vào</th>
                            <th className="py-4 px-6 text-[10px] font-black text-slate-600 uppercase tracking-wider text-center">Giờ ra</th>
                            <th className="py-4 px-6 text-[10px] font-black text-slate-600 uppercase tracking-wider text-center">Tổng giờ</th>
                            <th className="py-4 px-6 text-[10px] font-black text-slate-600 uppercase tracking-wider">Trạng thái</th>
                            <th className="py-4 px-6 text-[10px] font-black text-slate-600 uppercase tracking-wider text-right">Thao tác</th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                        {records.map((rec) => {
                            const st = getStatusStyle(rec.status);
                            return (
                                <tr key={rec.employee_id} className="hover:bg-slate-50/20 transition-colors">
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-md bg-slate-100 overflow-hidden border border-slate-200/50 flex-shrink-0 flex items-center justify-center font-bold text-slate-400 uppercase">
                                                {rec.employee_avatar ? (
                                                    <img src={rec.employee_avatar} alt="" className="w-full h-full object-cover" />
                                                ) : rec.employee_name.substring(0, 2)}
                                            </div>
                                            <h6 className="text-slate-800 leading-none ">{rec.employee_name}</h6>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6">
                                        {rec.on_leave ? (
                                            <span className="text-[10px] font-black text-red-600 bg-red-50 border border-red-100 px-2 py-1 rounded-lg uppercase tracking-wide leading-none">Nghỉ phép</span>
                                        ) : rec.scheduled_shift ? (
                                            <span className="text-[10px] font-black text-slate-600 bg-slate-100 px-2 py-1 rounded-lg uppercase tracking-wide leading-none">{rec.scheduled_shift}</span>
                                        ) : (
                                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-wide leading-none">Không có lịch</span>
                                        )}
                                    </td>
                                    <td className="py-4 px-6 text-center text-sm font-bold text-slate-700">
                                        {rec.check_in ? rec.check_in.substring(0, 5) : '--:--'}
                                    </td>
                                    <td className="py-4 px-6 text-center text-sm font-bold text-slate-700">
                                        {rec.check_out ? rec.check_out.substring(0, 5) : '--:--'}
                                    </td>
                                    <td className="py-4 px-6 text-center text-sm font-black text-slate-800">
                                        {rec.total_hours > 0 ? `${rec.total_hours}h` : '0h'}
                                    </td>
                                    <td className="py-4 px-6">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-wider ${st.bg}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${st.bullet}`} />
                                            {st.label}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6 text-right">
                                        <div className="flex items-center justify-end gap-1.5">
                                            {rec.status === ATTENDANCE_STATUS.NOT_CHECKED_IN && (
                                                <button
                                                    onClick={() => handleQuickCheckIn(rec)}
                                                    className="px-2.5 py-1.5 bg-amber-500 text-white rounded-xl text-[9px] font-black uppercase hover:bg-amber-600 transition-colors shadow-sm active:scale-95 duration-150"
                                                >
                                                    Vào Ca
                                                </button>
                                            )}
                                            {rec.status === ATTENDANCE_STATUS.WORKING && (
                                                <button
                                                    onClick={() => handleQuickCheckOut(rec)}
                                                    className="px-2.5 py-1.5 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase hover:bg-emerald-700 transition-colors shadow-sm active:scale-95 duration-150"
                                                >
                                                    Ra Ca
                                                </button>
                                            )}
                                            <button
                                                onClick={() => openEditModal(rec)}
                                                className="p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 rounded-xl transition-all"
                                                title="Sửa bản ghi"
                                            >
                                                <Icon name="pencil" className="w-4 h-4 text-slate-500 hover:text-slate-800" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {/* Mobile cards layout */}
            <div className="md:hidden space-y-2 animate-in fade-in duration-300">
                {records.map((rec) => {
                    const st = getStatusStyle(rec.status);
                    return (
                        <div key={rec.employee_id} className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-2.5 hover:shadow-md transition-all duration-200">
                            {/* Card Header: Avatar, Name, Role & Status Tag */}
                            <div className="flex items-center justify-between gap-2.5">
                                <div className="flex items-center gap-2 min-w-0">
                                    <div className="w-7 h-7 rounded-md bg-slate-100 overflow-hidden border border-slate-200/50 flex-shrink-0 flex items-center justify-center font-bold text-slate-400 text-xs uppercase">
                                        {rec.employee_avatar ? (
                                            <img src={rec.employee_avatar} alt="" className="w-full h-full object-cover" />
                                        ) : rec.employee_name.substring(0, 2)}
                                    </div>

                                    <h5 className="!text-[11px] text-slate-800  tracking-tight truncate leading-none">{rec.employee_name}</h5>
                                </div>

                                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[7.5px] font-black uppercase tracking-wider flex-shrink-0 leading-none ${st.bg}`}>
                                    <span className={`w-1 h-1 rounded-full ${st.bullet}`} />
                                    {st.label}
                                </span>
                            </div>

                            {/* Details row: In/Out, Shift & Total hours in compact high-density layout */}
                            <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 bg-slate-50 rounded-xl border border-slate-200/30 text-[9px] font-bold text-slate-500">
                                <div className="flex items-center gap-1">
                                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[7.5px]">Lịch:</span>
                                    {rec.on_leave ? (
                                        <span className="text-red-650 font-black uppercase text-[7.5px]">Nghỉ phép</span>
                                    ) : rec.scheduled_shift ? (
                                        <span className="text-slate-700 font-black uppercase text-[7.5px]">{rec.scheduled_shift}</span>
                                    ) : (
                                        <span className="text-slate-400 font-black uppercase text-[7.5px]">N/A</span>
                                    )}
                                </div>
                                <div className="h-2.5 w-[1px] bg-slate-200" />
                                <div className="flex items-center gap-1">
                                    <span className="text-slate-400 uppercase tracking-wider text-[7.5px]">Vào:</span>
                                    <span className="text-slate-700 font-extrabold">{rec.check_in ? rec.check_in.substring(0, 5) : '--:--'}</span>
                                </div>
                                <div className="h-2.5 w-[1px] bg-slate-200" />
                                <div className="flex items-center gap-1">
                                    <span className="text-slate-400 uppercase tracking-wider text-[7.5px]">Ra:</span>
                                    <span className="text-slate-700 font-extrabold">{rec.check_out ? rec.check_out.substring(0, 5) : '--:--'}</span>
                                </div>
                                <div className="h-2.5 w-[1px] bg-slate-200" />
                                <div className="flex items-center gap-1">
                                    <span className="text-slate-400 uppercase tracking-wider text-[7.5px]">Tổng:</span>
                                    <span className="text-slate-800 font-black">{rec.total_hours > 0 ? `${rec.total_hours}h` : '0h'}</span>
                                </div>
                            </div>

                            {/* Card Footer: Quick Actions */}
                            <div className="flex items-center justify-end gap-1.5">
                                {rec.status === ATTENDANCE_STATUS.NOT_CHECKED_IN && (
                                    <button
                                        onClick={() => handleQuickCheckIn(rec)}
                                        className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[8.5px] font-black uppercase transition-colors shadow-sm active:scale-95 border-none cursor-pointer"
                                    >
                                        Vào Ca
                                    </button>
                                )}
                                {rec.status === ATTENDANCE_STATUS.WORKING && (
                                    <button
                                        onClick={() => handleQuickCheckOut(rec)}
                                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[8.5px] font-black uppercase transition-colors shadow-sm active:scale-95 border-none cursor-pointer"
                                    >
                                        Ra Ca
                                    </button>
                                )}
                                <button
                                    onClick={() => openEditModal(rec)}
                                    className="w-7 h-7 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 rounded-lg flex items-center justify-center border-none cursor-pointer"
                                    title="Sửa bản ghi"
                                >
                                    <Icon name="pencil" className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </>
    );
}
