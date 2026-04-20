import React from 'react';

const AdminPersonnelList = ({ users, fetchUsers, updating, currentUser, roles, handleRoleChange }) => {
    return (
        <div className="2xl:col-span-3 bg-white rounded-[40px] sm:rounded-[56px] shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 sm:p-10 border-b border-slate-50 flex items-center justify-between gap-6">
                <div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">Danh sách Nhân sự</h2>
                    <p className="text-slate-400 text-[10px] sm:text-xs mt-1 leading-relaxed">Phân quyền tài khoản.</p>
                </div>
                <button onClick={fetchUsers} className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 flex items-center justify-center rounded-xl sm:rounded-2xl bg-slate-50 text-orange-500 hover:bg-orange-500 hover:text-white transition-all shadow-sm border-none active:scale-90">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                </button>
            </div>
            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left min-w-[500px]">
                    <thead>
                        <tr className="bg-slate-50/50">
                            <th className="px-6 sm:px-10 py-4 sm:py-6 text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest">Nhân viên</th>
                            <th className="px-6 sm:px-10 py-4 sm:py-6 text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Quyền truy cập</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {users.map((u) => (
                            <tr key={u.id} className="group hover:bg-slate-50/40 transition-all">
                                <td className="px-6 sm:px-10 py-4 sm:py-6 whitespace-nowrap">
                                    <div className="flex items-center gap-4 sm:gap-5">
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-[22px] bg-slate-100 flex items-center justify-center text-xs sm:text-sm font-black text-slate-500 uppercase ring-1 sm:ring-2 ring-slate-100 group-hover:ring-orange-200 transition-all flex-shrink-0 relative">
                                            {u.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                            <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border border-white scale-0 group-hover:scale-100 transition-transform duration-300"></div>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm sm:text-base font-black text-slate-900 group-hover:text-orange-600 transition-colors truncate max-w-[150px] sm:max-w-[200px]">{u.name}</span>
                                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 whitespace-nowrap">ID :: 0{u.id}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 sm:px-10 py-4 sm:py-6 text-right whitespace-nowrap">
                                    <div className="relative inline-block group/select">
                                        <select
                                            disabled={updating === u.id || u.id === currentUser?.id}
                                            className="bg-slate-100 border-none rounded-xl sm:rounded-2xl pl-4 pr-9 py-2.5 text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-slate-700 cursor-pointer focus:ring-4 focus:ring-orange-500/10 transition-all disabled:opacity-50 appearance-none min-w-[120px] sm:min-w-[140px]"
                                            value={u.role}
                                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                        >
                                            {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                        </select>
                                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminPersonnelList;
