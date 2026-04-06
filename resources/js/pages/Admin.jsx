import React, { useEffect, useState } from 'react';
import { getUsersApi, updateUserRoleApi } from '../services/userService';
import { useAppSelector } from '../store/hooks';

export default function Admin() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(null);
    const { user: currentUser } = useAppSelector(state => state.auth);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await getUsersApi();
            setUsers(response.data || []);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        try {
            setUpdating(userId);
            await updateUserRoleApi(userId, newRole);
            await fetchUsers(); // Refresh list
        } catch (error) {
            console.error('Failed to update role:', error);
            alert('Failed to update role');
        } finally {
            setUpdating(null);
        }
    };

    const roles = [
        { value: 'admin', label: 'Admin' },
        { value: 'order_staff', label: 'Order Staff' },
        { value: 'kitchen', label: 'Kitchen' },
        { value: 'bar', label: 'Bar' },
        { value: 'cashier', label: 'Cashier' }
    ];

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

                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-50">
                        <h2 className="text-xl font-bold text-gray-800">Quản lý nhân sự</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50/50">
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Nhân viên</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Vai trò hiện tại</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Thay đổi quyền</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {users.map((u) => (
                                    <tr key={u.id} className="hover:bg-gray-50/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold">
                                                    {u.name.charAt(0)}
                                                </div>
                                                <div className="font-bold text-gray-800">{u.name} {u.id === currentUser?.id && '(Tôi)'}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">{u.email}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-tighter ${
                                                u.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                                u.role === 'cashier' ? 'bg-blue-100 text-blue-700' :
                                                'bg-gray-100 text-gray-600'
                                            }`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <select
                                                disabled={updating === u.id || u.id === currentUser?.id}
                                                className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-orange-500 outline-none transition-all disabled:opacity-50"
                                                value={u.role}
                                                onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                            >
                                                {roles.map(r => (
                                                    <option key={r.value} value={r.value}>{r.label}</option>
                                                ))}
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
