import { useState, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
    getUsersApi,
    createUserApi,
    updateUserApi,
    deleteUserApi,
    updateUserRoleApi
} from '../services/userService';

export const useUserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState(null);

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            const response = await getUsersApi();
            setUsers(response.data || []);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch users:', err);
            setError('Không thể tải danh sách nhân sự');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const addUser = async (userData) => {
        try {
            setProcessing(true);
            await createUserApi(userData);
            await fetchUsers();
            toast.success('Thêm nhân sự mới thành công');
            return true;
        } catch (err) {
            console.error('Failed to add user:', err);
            const msg = err.response?.data?.message || 'Không thể thêm nhân sự mới';
            setError(msg);
            toast.error(msg);
            return false;
        } finally {
            setProcessing(false);
        }
    };

    const updateUser = async (id, userData) => {
        try {
            setProcessing(true);
            await updateUserApi(id, userData);
            await fetchUsers();
            toast.success('Cập nhật thông tin thành công');
            return true;
        } catch (err) {
            console.error('Failed to update user:', err);
            const msg = err.response?.data?.message || 'Không thể cập nhật thông tin';
            setError(msg);
            toast.error(msg);
            return false;
        } finally {
            setProcessing(false);
        }
    };

    const deleteUser = async (id) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa nhân sự này?')) return;

        try {
            setProcessing(true);
            await deleteUserApi(id);
            await fetchUsers();
            toast.success('Xóa nhân sự thành công');
            return true;
        } catch (err) {
            console.error('Failed to delete user:', err);
            const msg = err.response?.data?.message || 'Không thể xóa nhân sự';
            setError(msg);
            toast.error(msg);
            return false;
        } finally {
            setProcessing(false);
        }
    };

    const changeRole = async (id, role) => {
        try {
            setProcessing(true);
            await updateUserRoleApi(id, role);
            await fetchUsers();
            toast.success('Thay đổi quyền truy cập thành công');
            return true;
        } catch (err) {
            console.error('Failed to change role:', err);
            toast.error('Không thể thay đổi quyền truy cập');
            return false;
        } finally {
            setProcessing(false);
        }
    };

    const roles = [
        { value: 'admin', label: 'Quản trị viên (Admin)' },
        { value: 'manager', label: 'Quản lý (Manager)' },
        { value: 'order_staff', label: 'Nhân viên Order' },
        { value: 'kitchen', label: 'Bếp (Kitchen)' },
        { value: 'bar', label: 'Bar' },
        { value: 'cashier', label: 'Thu ngân (Cashier)' },
        { value: 'bill', label: 'Nhân viên đọc Bill' },
        { value: 'seller', label: 'Bán hàng (Seller)' }
    ];

    return {
        users,
        loading,
        processing,
        error,
        fetchUsers,
        addUser,
        updateUser,
        deleteUser,
        changeRole,
        roles
    };
};
