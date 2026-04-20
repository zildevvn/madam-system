import React, { useState } from 'react';
import { useUserManagement } from '../../hooks/useUserManagement';
import UserFormModal from './UserFormModal';

const UserManagement = ({ currentUser }) => {
    const {
        users,
        loading,
        processing,
        error,
        addUser,
        updateUser,
        deleteUser,
        changeRole,
        roles
    } = useUserManagement();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    const handleAddUser = () => {
        setEditingUser(null);
        setIsModalOpen(true);
    };

    const handleEditUser = (user) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const handleFormSubmit = async (data) => {
        const success = editingUser
            ? await updateUser(editingUser.id, data)
            : await addUser(data);

        if (success) {
            setIsModalOpen(false);
        }
    };

    if (loading && users.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[40px] border border-gray-100 shadow-sm animate-pulse">
                <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-orange-500 animate-spin mb-4"></div>
                <p className="text-slate-400 font-bold text-[11px] tracking-widest uppercase">Đang tải danh sách nhân sự...</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 lg:space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
            {/* Optimized Header / Actions Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <button
                    onClick={handleAddUser}
                    className="mdt-btn flex items-center justify-center group self-stretch md:self-auto"
                >
                    <svg className="w-5 h-5 group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                    <span>Thêm nhân sự mới</span>
                </button>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-5 rounded-3xl text-[11px] font-black uppercase tracking-widest border border-red-100 flex items-center gap-4 animate-in shake duration-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    {error}
                </div>
            )}

            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-[16px] shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">Thông tin nhân sự</th>
                                <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">Quyền hạn</th>
                                <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none text-right">Lựa chọn</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {users.map((u) => (
                                <tr key={u.id} className="group hover:bg-slate-50/40 transition-all">
                                    <td className="px-10 py-5 whitespace-nowrap">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-[22px] bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center text-sm font-black text-slate-500 uppercase transition-all group-hover:scale-105 group-hover:shadow-md ring-1 ring-slate-100">
                                                {u.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-base font-black text-slate-900 group-hover:text-orange-600 transition-colors truncate max-w-[240px] uppercase tracking-tight">{u.name}</span>
                                                <span className="text-[11px] text-slate-400 font-bold tracking-wide transition-colors group-hover:text-slate-500 truncate max-w-[240px]">{u.email}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-5 whitespace-nowrap">
                                        <div className="relative inline-block group/select">
                                            <select
                                                disabled={processing || u.id === currentUser?.id}
                                                className="bg-slate-100 border-none rounded-xl pl-5 pr-10 py-3 text-[11px] font-black uppercase tracking-widest text-slate-700 cursor-pointer focus:ring-4 focus:ring-orange-500/10 transition-all disabled:opacity-50 appearance-none min-w-[170px] shadow-sm hover:bg-slate-200"
                                                value={u.role}
                                                onChange={(e) => changeRole(u.id, e.target.value)}
                                            >
                                                {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover/select:text-orange-500 transition-colors">
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-5 text-right whitespace-nowrap">
                                        <div className="flex items-center justify-end gap-3">
                                            <button
                                                onClick={() => handleEditUser(u)}
                                                className="w-11 h-11 flex items-center justify-center rounded-2xl bg-white text-slate-400 hover:text-orange-500 hover:shadow-xl hover:shadow-orange-500/10 hover:border-orange-100 border border-transparent transition-all shadow-sm active:scale-90"
                                                title="Sửa thông tin"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                            </button>
                                            <button
                                                onClick={() => deleteUser(u.id)}
                                                disabled={u.id === currentUser?.id}
                                                className="w-11 h-11 flex items-center justify-center rounded-2xl bg-white text-slate-400 hover:text-red-500 hover:shadow-xl hover:shadow-red-500/10 hover:border-red-100 border border-transparent transition-all shadow-sm active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed"
                                                title="Xóa nhân sự"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile Card Grid View */}
            <div className="md:hidden space-y-3">
                {users.map((u) => (
                    <div key={u.id} className="bg-white px-2 py-3 rounded-[16px] shadow-sm border border-slate-100 flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-[26px] bg-slate-100 flex items-center justify-center text-base font-black text-slate-500 uppercase ring-4 ring-slate-50">
                                {u.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-lg font-black text-slate-900 truncate uppercase tracking-tighter">{u.name}</span>
                                <span className="text-xs text-slate-400 font-medium truncate lowercase">{u.email}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex-1 relative group/select">
                                <select
                                    disabled={processing || u.id === currentUser?.id}
                                    className="w-full bg-slate-50 border-none rounded-2xl pl-5 pr-10 py-3.5 text-[11px] font-black uppercase tracking-widest text-slate-700 appearance-none focus:ring-4 focus:ring-orange-500/10 transition-all disabled:opacity-50"
                                    value={u.role}
                                    onChange={(e) => changeRole(u.id, e.target.value)}
                                >
                                    {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleEditUser(u)}
                                    className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-100 text-slate-500 active:scale-95 transition-all outline-none"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                </button>
                                <button
                                    onClick={() => deleteUser(u.id)}
                                    disabled={u.id === currentUser?.id}
                                    className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-100 text-slate-400 active:scale-95 transition-all outline-none disabled:opacity-30"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {users.length === 0 && (
                <div className="py-20 flex flex-col items-center justify-center bg-white rounded-[32px] border border-slate-100 shadow-sm animate-in zoom-in-95 duration-500">
                    <div className="w-16 h-16 bg-slate-50 rounded-[24px] flex items-center justify-center text-slate-200 mb-4">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                    </div>
                    <p className="text-slate-400 font-black text-[11px] uppercase tracking-[0.2em]">Không tìm thấy nhân sự nào</p>
                </div>
            )}

            <UserFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleFormSubmit}
                user={editingUser}
                roles={roles}
                processing={processing}
            />
        </div>
    );
};

export default UserManagement;
