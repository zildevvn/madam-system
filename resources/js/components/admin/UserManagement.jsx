import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserManagement } from '../../hooks/useUserManagement';
import Icon from '../shared/Icon';

const UserManagement = ({ currentUser }) => {
    const navigate = useNavigate();
    const {
        users,
        loading,
        processing,
        error,
        deleteUser,
        changeRole,
        roles
    } = useUserManagement();

    const [searchTerm, setSearchTerm] = useState('');

    const handleAddUser = () => {
        navigate('/admin/personnel/create');
    };

    const handleEditUser = (user) => {
        navigate(`/admin/personnel/edit/${user.id}`);
    };

    const handleViewUser = (user) => {
        navigate(`/admin/personnel/${user.id}`);
    };

    const filteredUsers = users.filter(u =>
        (u.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (u.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    if (loading && users.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[40px] border border-gray-100 shadow-sm animate-pulse">
                <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-orange-500 animate-spin mb-4"></div>
                <p className="text-slate-400 font-bold text-[11px] tracking-widest uppercase">Đang tải danh sách nhân sự...</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 lg:space-y-6">
            {/* Optimized Header / Actions Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-orange-500 transition-colors">
                        <Icon name="search" size={20} className="w-5 h-5" />
                    </div>
                    <input
                        type="text"
                        placeholder="Tìm kiếm nhân sự..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="mdt-btn !w-full !bg-white !pl-12 !pr-4 !py-3 placeholder:text-slate-300 focus:outline-none !text-slate-900"
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-300 hover:text-slate-500 transition-colors"
                        >
                            <Icon name="close" size={16} className="w-4 h-4" />
                        </button>
                    )}
                </div>

                <button
                    onClick={handleAddUser}
                    className="mdt-btn flex items-center justify-center group self-stretch md:self-auto cursor-pointer"
                >
                    <Icon name="plus" size={20} className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                    <span>Thêm nhân sự mới</span>
                </button>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-5 rounded-3xl text-[11px] font-black uppercase tracking-widest border border-red-100 flex items-center gap-4 animate-in shake duration-500">
                    <Icon name="alert" size={20} className="w-5 h-5 flex-shrink-0" />
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
                            {filteredUsers.map((u) => (
                                <tr key={u.id} className="group hover:bg-slate-50/40 transition-all">
                                    <td className="px-10 py-5 whitespace-nowrap">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-[22px] bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center text-sm font-black text-slate-500 uppercase transition-all group-hover:scale-105 group-hover:shadow-md ring-1 ring-slate-100 overflow-hidden">
                                                {u.photo ? (
                                                    <img src={`/storage/${u.photo}`} alt="avatar" className="w-full h-full object-cover" />
                                                ) : (
                                                    u.name.split(' ').map(n => n[0]).join('').slice(0, 2)
                                                )}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-base font-black text-slate-900 group-hover:text-orange-600 transition-colors truncate max-w-[200px] uppercase tracking-tight">{u.name}</span>
                                                    {u.status === 'inactive' && (
                                                        <span className="px-1.5 py-0.5 rounded bg-red-50 text-red-500 text-[8px] font-black uppercase tracking-wider">Nghỉ</span>
                                                    )}
                                                </div>
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
                                                <Icon name="chevronDown" size={14} className="w-3.5 h-3.5" strokeWidth={3} />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-5 text-right whitespace-nowrap">
                                        <div className="flex items-center justify-end gap-3">
                                            <button
                                                onClick={() => handleViewUser(u)}
                                                className="btn-view-user w-11 h-11 flex items-center justify-center rounded-2xl bg-white text-slate-400 hover:text-orange-500 hover:shadow-xl hover:shadow-orange-500/10 hover:border-orange-100 border border-transparent transition-all shadow-sm active:scale-90 cursor-pointer"
                                                title="Xem chi tiết"
                                            >
                                                <Icon name="eye" size={20} className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleEditUser(u)}
                                                className="btn-edit-user w-11 h-11 flex items-center justify-center rounded-2xl bg-white text-slate-400 hover:text-orange-500 hover:shadow-xl hover:shadow-orange-500/10 hover:border-orange-100 border border-transparent transition-all shadow-sm active:scale-90 cursor-pointer"
                                                title="Sửa thông tin"
                                            >
                                                <Icon name="pencil" size={20} className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => deleteUser(u.id)}
                                                disabled={u.id === currentUser?.id}
                                                className="w-11 h-11 flex items-center justify-center rounded-2xl bg-white text-slate-400 hover:text-red-500 hover:shadow-xl hover:shadow-red-500/10 hover:border-red-100 border border-transparent transition-all shadow-sm active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                                                title="Xóa nhân sự"
                                            >
                                                <Icon name="trash" size={20} className="w-5 h-5" />
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
                {filteredUsers.map((u) => (
                    <div key={u.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-12 h-12 rounded-[20px] bg-slate-100 flex items-center justify-center text-sm font-black text-slate-500 uppercase ring-4 ring-slate-50 overflow-hidden flex-shrink-0">
                                    {u.photo ? (
                                        <img src={`/storage/${u.photo}`} alt="avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        u.name.split(' ').map(n => n[0]).join('').slice(0, 2)
                                    )}
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="text-sm font-black text-slate-900 uppercase tracking-tight truncate max-w-[150px]">{u.name}</span>
                                        {u.status === 'inactive' && (
                                            <span className="px-1.5 py-0.5 rounded bg-red-50 text-red-500 text-[8px] font-black uppercase tracking-wider">Nghỉ</span>
                                        )}
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-medium truncate max-w-[180px] lowercase">{u.email}</span>
                                </div>
                            </div>
                            
                            {/* Delete button placed on top right */}
                            <button
                                onClick={() => deleteUser(u.id)}
                                disabled={u.id === currentUser?.id}
                                className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 active:scale-95 transition-all outline-none disabled:opacity-30 border-none cursor-pointer flex-shrink-0"
                                title="Xóa nhân sự"
                            >
                                <Icon name="trash" size={16} className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Divider */}
                        <div className="border-t border-dashed border-slate-100"></div>

                        {/* Actions Row */}
                        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
                            <div className="flex-1 min-w-[140px] relative group/select">
                                <select
                                    disabled={processing || u.id === currentUser?.id}
                                    className="w-full bg-slate-50 hover:bg-slate-100 border-none rounded-xl pl-4 pr-9 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-700 appearance-none focus:ring-4 focus:ring-orange-500/10 transition-all disabled:opacity-50 cursor-pointer"
                                    value={u.role}
                                    onChange={(e) => changeRole(u.id, e.target.value)}
                                >
                                    {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                    <Icon name="chevronDown" size={14} className="w-3.5 h-3.5" strokeWidth={3} />
                                </div>
                            </div>

                            <div className="flex gap-2 w-full sm:w-auto">
                                <button
                                    onClick={() => handleViewUser(u)}
                                    className="btn-view-user flex-1 sm:flex-none px-4 py-2.5 flex items-center justify-center gap-2 rounded-xl bg-orange-50 hover:bg-orange-500 text-orange-600 hover:text-white active:scale-95 transition-all border-none font-black text-[10px] uppercase tracking-wider cursor-pointer"
                                    title="Xem chi tiết"
                                >
                                    <Icon name="eye" size={16} className="w-4 h-4" />
                                    <span>Xem</span>
                                </button>
                                <button
                                    onClick={() => handleEditUser(u)}
                                    className="btn-edit-user flex-1 sm:flex-none px-4 py-2.5 flex items-center justify-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 active:scale-95 transition-all border-none font-black text-[10px] uppercase tracking-wider cursor-pointer"
                                    title="Sửa thông tin"
                                >
                                    <Icon name="pencil" size={16} className="w-4 h-4" />
                                    <span>Sửa</span>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredUsers.length === 0 && (
                <div className="py-20 flex flex-col items-center justify-center bg-white rounded-[32px] border border-slate-100 shadow-sm animate-in zoom-in-95 duration-500 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-[24px] flex items-center justify-center text-slate-250 mb-4">
                        <Icon name="users" size={32} className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-slate-400 font-black text-[11px] uppercase tracking-[0.2em]">Không tìm thấy nhân sự nào</p>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
