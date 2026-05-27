import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getUsersApi } from '../../services/userService';
import { getLeaveRequestsApi, createLeaveRequestApi, updateLeaveStatusApi, deleteLeaveRequestApi } from '../../services/leaveService';

const DayOffManager = ({ currentUser }) => {
    const [requests, setRequests] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form states
    const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [leaveType, setLeaveType] = useState('paid');
    const [reason, setReason] = useState('');

    // Fetch day off requests and list of active employees
    const fetchData = async () => {
        setLoading(true);
        try {
            const [reqRes, empRes] = await Promise.all([
                getLeaveRequestsApi(),
                getUsersApi()
            ]);
            setRequests(reqRes.data);
            
            // Only active users
            const activeEmps = empRes.data.filter(u => u.status !== 'inactive');
            setEmployees(activeEmps);

            if (activeEmps.length > 0) {
                setSelectedEmployeeId(activeEmps[0].id);
            }
        } catch (err) {
            console.error('Failed to load leave data:', err);
            toast.error('Không thể tải danh sách dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        
        // Reset date defaults
        const today = new Date().toISOString().split('T')[0];
        setStartDate(today);
        setEndDate(today);
    }, []);

    const handleCreateRequest = async (e) => {
        e.preventDefault();

        if (!selectedEmployeeId) {
            toast.error('Vui lòng chọn nhân sự');
            return;
        }

        if (new Date(startDate) > new Date(endDate)) {
            toast.error('Ngày bắt đầu không được lớn hơn ngày kết thúc');
            return;
        }

        setSubmitting(true);
        try {
            await createLeaveRequestApi({
                user_id: selectedEmployeeId,
                start_date: startDate,
                end_date: endDate,
                leave_type: leaveType,
                reason: reason
            });

            toast.success('Đăng ký nghỉ phép thành công!');
            setShowForm(false);
            setReason('');
            fetchData();
        } catch (err) {
            console.error('Failed to submit leave request:', err);
            const msg = err.response?.data?.message || 'Không thể đăng ký nghỉ phép';
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateStatus = async (id, status) => {
        try {
            await updateLeaveStatusApi(id, {
                status: status,
                approved_by: currentUser.id
            });
            toast.success(status === 'approved' ? 'Phê duyệt đơn thành công!' : 'Từ chối đơn thành công!');
            fetchData();
        } catch (err) {
            console.error('Failed to update leave status:', err);
            toast.error('Có lỗi xảy ra khi phê duyệt');
        }
    };

    const handleDeleteRequest = async (id) => {
        if (!window.confirm('Bạn có chắc chắn muốn hủy yêu cầu nghỉ phép này?')) return;

        try {
            await deleteLeaveRequestApi(id);
            toast.success('Hủy yêu cầu nghỉ phép thành công!');
            fetchData();
        } catch (err) {
            console.error('Failed to delete request:', err);
            toast.error('Có lỗi xảy ra khi hủy yêu cầu');
        }
    };

    const getLeaveTypeBadge = (type) => {
        switch (type) {
            case 'paid':
                return <span className="px-2 py-0.5 rounded bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-wider">Có lương</span>;
            case 'unpaid':
                return <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-wider">Không lương</span>;
            case 'sick':
                return <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-wider">Nghỉ ốm</span>;
            default:
                return <span className="px-2 py-0.5 rounded bg-orange-50 text-orange-600 text-[10px] font-black uppercase tracking-wider">Khác</span>;
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'approved':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                        Đã duyệt
                    </span>
                );
            case 'rejected':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                        Từ chối
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                        Chờ duyệt
                    </span>
                );
        }
    };

    const formatDateStr = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const calculateDays = (start, end) => {
        const s = new Date(start);
        const e = new Date(end);
        const diffTime = Math.abs(e - s);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return diffDays;
    };

    return (
        <div className="space-y-6">
            
            {/* Header Options */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">Yêu cầu nghỉ phép</h2>
                    <p className="text-slate-400 text-[10px] sm:text-xs mt-1 leading-relaxed">
                        Theo dõi lịch xin nghỉ, duyệt và từ chối ngày phép nhân viên.
                    </p>
                </div>

                <button
                    onClick={() => setShowForm(!showForm)}
                    className="mdt-btn flex items-center justify-center gap-2 group self-start sm:self-auto cursor-pointer"
                >
                    <svg className={`w-5 h-5 transition-transform ${showForm ? 'rotate-45' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                    </svg>
                    <span>{showForm ? 'Đóng form đăng ký' : 'Đăng ký nghỉ phép mới'}</span>
                </button>
            </div>

            {/* Leave Registration Form Panel */}
            {showForm && (
                <div className="bg-white rounded-[24px] p-6 shadow-sm border border-orange-100/50 animate-in slide-in-from-top-4 duration-300">
                    <form onSubmit={handleCreateRequest} className="space-y-4">
                        <h3 className="text-sm font-black uppercase tracking-wider text-orange-500 pb-2 border-b border-orange-50">
                            Điền thông tin đăng ký nghỉ phép
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Chọn nhân sự xin nghỉ <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <select
                                        value={selectedEmployeeId}
                                        onChange={(e) => setSelectedEmployeeId(e.target.value)}
                                        className="text-sm w-full bg-slate-50 border-none rounded-xl p-3 text-slate-900 font-bold appearance-none cursor-pointer focus:ring-4 focus:ring-orange-500/10 transition-all"
                                    >
                                        {employees.map(emp => (
                                            <option key={emp.id} value={emp.id}>{emp.name} ({emp.email})</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Khoảng thời gian nghỉ</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="text-sm w-full bg-slate-50 border-none rounded-xl p-3 text-slate-900 font-medium focus:ring-4 focus:ring-orange-500/10 transition-all"
                                    />
                                    <span className="text-slate-400 text-xs font-bold font-mono">đến</span>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="text-sm w-full bg-slate-50 border-none rounded-xl p-3 text-slate-900 font-medium focus:ring-4 focus:ring-orange-500/10 transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Lý do xin nghỉ phép</label>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                rows="3"
                                placeholder="Nhập lý do cụ thể xin nghỉ phép..."
                                className="text-sm w-full bg-slate-50 border-none rounded-xl p-3 text-slate-900 font-medium placeholder:text-slate-300 focus:ring-4 focus:ring-orange-500/10 transition-all"
                            />
                        </div>

                        <div className="flex items-center gap-3 justify-end pt-2 border-t border-slate-50">
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="px-5 py-2.5 bg-slate-100 text-slate-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95 border-none cursor-pointer"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-5 py-2.5 bg-orange-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 transition-all active:scale-95 disabled:opacity-50 border-none cursor-pointer flex items-center gap-2"
                            >
                                {submitting ? 'Đang gửi...' : 'Đăng ký'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* List and Review Grid */}
            {loading && requests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[40px] border border-slate-100 shadow-sm animate-pulse">
                    <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-orange-500 animate-spin mb-4"></div>
                    <p className="text-slate-400 font-bold text-xs tracking-widest uppercase">Đang tải thông tin nghỉ phép...</p>
                </div>
            ) : (
                <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left min-w-[700px]">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-6 py-4 text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest">Nhân sự xin nghỉ</th>
                                    <th className="px-6 py-4 text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest">Phạm vi ngày</th>
                                    <th className="px-6 py-4 text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest">Lý do xin nghỉ</th>
                                    <th className="px-6 py-4 text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest">Trạng thái</th>
                                    <th className="px-6 py-4 text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Lựa chọn</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {requests.map((req) => (
                                    <tr key={req.id} className="group hover:bg-slate-50/40 transition-all">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-[18px] bg-slate-100 flex items-center justify-center text-xs font-black text-slate-500 uppercase overflow-hidden">
                                                    {req.user?.photo ? (
                                                        <img src={`/storage/${req.user.photo}`} alt="avatar" className="w-full h-full object-cover" />
                                                    ) : (
                                                        req.user?.name.split(' ').map(n => n[0]).join('').slice(0, 2)
                                                    )}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-xs font-black text-slate-900 uppercase truncate max-w-[150px]">{req.user?.name}</span>
                                                    <span className="text-[9px] text-slate-400 font-bold">{req.user?.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-slate-800">
                                                    {formatDateStr(req.start_date)} - {formatDateStr(req.end_date)}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-bold mt-0.5">
                                                    Tổng cộng: {calculateDays(req.start_date, req.end_date)} ngày
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 max-w-[200px] truncate text-xs font-medium text-slate-600" title={req.reason}>
                                            {req.reason || <em className="text-slate-300">Không có lý do đính kèm</em>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(req.status)}
                                            {req.status !== 'pending' && req.approver && (
                                                <span className="text-[9px] text-slate-400 font-bold block mt-1">Duyệt bởi: {req.approver.name}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {req.status === 'pending' ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleUpdateStatus(req.id, 'approved')}
                                                            className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg font-black text-[9px] uppercase tracking-wider hover:bg-emerald-500 hover:text-white transition-all active:scale-95 border-none cursor-pointer"
                                                            title="Đồng ý xin nghỉ"
                                                        >
                                                            Duyệt
                                                        </button>
                                                        <button
                                                            onClick={() => handleUpdateStatus(req.id, 'rejected')}
                                                            className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg font-black text-[9px] uppercase tracking-wider hover:bg-red-500 hover:text-white transition-all active:scale-95 border-none cursor-pointer"
                                                            title="Từ chối xin nghỉ"
                                                        >
                                                            Từ chối
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        onClick={() => handleDeleteRequest(req.id)}
                                                        className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors border-none bg-transparent cursor-pointer"
                                                        title="Hủy đơn"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {requests.length === 0 && (
                        <div className="py-20 flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 bg-slate-50 rounded-[24px] flex items-center justify-center text-slate-200 mb-4">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <p className="text-slate-400 font-black text-[11px] uppercase tracking-[0.2em]">Chưa có yêu cầu nghỉ phép nào</p>
                        </div>
                    )}
                </div>
            )}

        </div>
    );
};

export default DayOffManager;
