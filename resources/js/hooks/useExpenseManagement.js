import { useState, useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import {
    getExpensesApi,
    createExpenseApi,
    updateExpenseApi,
    deleteExpenseApi
} from '../services/expenseService';

export const useExpenseManagement = () => {
    const { user } = useSelector(state => state.auth);
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState(null);

    const fetchExpenses = useCallback(async () => {
        try {
            setLoading(true);
            const response = await getExpensesApi();
            setExpenses(response.data.data || []);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch expenses:', err);
            setError('Không thể tải danh sách chi tiêu');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchExpenses();
    }, [fetchExpenses]);

    const addExpense = async (data) => {
        if (!user?.id) {
            toast.error('Vui lòng đăng nhập để thực hiện tác vụ này');
            return false;
        }

        try {
            setProcessing(true);
            await createExpenseApi({ ...data, user_id: user.id });
            await fetchExpenses();
            toast.success('Ghi nhận chi tiêu thành công');
            return true;
        } catch (err) {
            console.error('Failed to add expense:', err);
            toast.error(err.response?.data?.message || 'Không thể ghi nhận chi tiêu');
            return false;
        } finally {
            setProcessing(false);
        }
    };

    const updateExpense = async (id, data) => {
        if (!user?.id) {
            toast.error('Vui lòng đăng nhập để thực hiện tác vụ này');
            return false;
        }

        try {
            setProcessing(true);
            await updateExpenseApi(id, { ...data, user_id: user.id });
            await fetchExpenses();
            toast.success('Cập nhật chi tiêu thành công');
            return true;
        } catch (err) {
            console.error('Failed to update expense:', err);
            toast.error('Không thể cập nhật chi tiêu');
            return false;
        } finally {
            setProcessing(false);
        }
    };

    const deleteExpense = async (id) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa mục chi tiêu này?')) return;

        try {
            setProcessing(true);
            await deleteExpenseApi(id);
            await fetchExpenses();
            toast.success('Xóa chi tiêu thành công');
            return true;
        } catch (err) {
            console.error('Failed to delete expense:', err);
            toast.error('Không thể xóa chi tiêu');
            return false;
        } finally {
            setProcessing(false);
        }
    };

    const categories = {
        fixed: [
            { value: 'rent', label: 'Tiền thuê mặt bằng' },
            { value: 'salary', label: 'Lương nhân viên' },
            { value: 'utilities', label: 'Điện & Nước (Cố định)' },
            { value: 'wifi', label: 'Wi-Fi & Internet' },
            { value: 'other_fixed', label: 'Chi phí cố định khác' }
        ],
        variable: []
    };

    const getAllCategories = () => [...categories.fixed];

    return {
        expenses,
        loading,
        processing,
        error,
        fetchExpenses,
        addExpense,
        updateExpense,
        deleteExpense,
        categories,
        getAllCategories
    };
};
