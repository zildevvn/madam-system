import React from 'react';
import { useAdminLogic } from '../hooks/useAdminLogic';

export default function Admin() {
    const {
        users,
        loading,
        updating,
        currentUser,
        testingPrinter,
        testingWS,
        logs,
        setLogs,
        testPrinter,
        testWebsocket,
        fetchUsers,
        handleRoleChange,
        roles
    } = useAdminLogic();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    return (
        <div className="md-admin-page min-h-screen bg-gray-50 p-4 lg:p-8">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Quản trị hệ thống</h1>
                    <p className="text-gray-500">Quản lý người dùng, phân quyền và giám sát hoạt động.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                        <div className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Tổng nhân viên</div>
                        <div className="text-3xl font-black text-gray-900">{users.length}</div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                        <div className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Vai trò Admin</div>
                        <div className="text-3xl font-black text-orange-500">{users.filter(u => u.role === 'admin').length}</div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                        <div className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Phiên làm việc</div>
                        <div className="text-3xl font-black text-blue-500">Hoạt động</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-800">Quản lý nhân sự</h2>
                            <button onClick={fetchUsers} className="text-orange-500 hover:text-orange-600">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-gray-50/50">
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Nhân viên</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Quyền</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {users.map((u) => (
                                        <tr key={u.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold">{u.name.charAt(0)}</div>
                                                    <span className="text-sm font-bold text-gray-700">{u.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <select
                                                    disabled={updating === u.id || u.id === currentUser?.id}
                                                    className="bg-gray-50 border-none rounded-lg px-2 py-1 text-xs font-bold"
                                                    value={u.role}
                                                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                                >
                                                    {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-gray-50 bg-gray-900">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                Hệ thống & Kết nối
                            </h2>
                        </div>
                        
                        <div className="p-6 space-y-6 flex-1 bg-gray-950 font-mono text-sm leading-relaxed">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between group">
                                    <div className="flex flex-col">
                                        <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Thermal Printer</span>
                                        <span className="text-white text-xs">PRINTER_DRINK (Port 9100)</span>
                                    </div>
                                    <button 
                                        onClick={testPrinter}
                                        disabled={testingPrinter}
                                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                                    >
                                        {testingPrinter ? 'Checking...' : 'Test Connection'}
                                    </button>
                                </div>

                                <div className="flex items-center justify-between group">
                                    <div className="flex flex-col">
                                        <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">WebSocket (Pusher)</span>
                                        <span className="text-white text-xs">system-diagnostics channel</span>
                                    </div>
                                    <button 
                                        onClick={testWebsocket}
                                        disabled={testingWS}
                                        className="px-4 py-2 bg-orange-500/80 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                                    >
                                        {testingWS ? 'Sending...' : 'Test Broadcast'}
                                    </button>
                                </div>
                            </div>

                            <div className="mt-8 border-t border-white/5 pt-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Logs</span>
                                    <button onClick={() => setLogs([])} className="text-gray-600 hover:text-gray-400 text-[10px] font-bold">Clear</button>
                                </div>
                                <div className="bg-black/40 rounded-xl p-4 h-48 overflow-y-auto space-y-1.5 custom-scrollbar selection:bg-orange-500/30">
                                    {logs.length === 0 && <div className="text-gray-700 italic">No events recorded. Waiting for diagnostics...</div>}
                                    {logs.map((log, idx) => (
                                        <div key={idx} className={`text-[11px] ${log.type === 'error' ? 'text-red-400' : log.type === 'success' ? 'text-green-400' : 'text-blue-400'}`}>
                                            <span className="text-gray-600 mr-2">[{log.time}]</span>
                                            <span className="font-bold mr-1">{log.prefix}:</span>
                                            {log.message}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
