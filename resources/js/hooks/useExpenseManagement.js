import { useEffect, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchExpensesAsync,
    createExpenseAsync,
    updateExpenseAsync,
    deleteExpenseAsync,
    selectAllExpenses,
    selectExpenseStatus,
    selectExpenseProcessing,
    selectExpenseError,
    clearExpenseError
} from '../store/slices/expenseSlice';

/**
 * Custom hook to manage expenses via Redux Toolkit.
 * Decouples Component UI from state management logic.
 */
export const useExpenseManagement = () => {
    const dispatch = useDispatch();
    const user = useSelector((state) => state.auth?.user);

    // Redux Selectors
    const expenses = useSelector(selectAllExpenses);
    const status = useSelector(selectExpenseStatus);
    const processing = useSelector(selectExpenseProcessing);
    const error = useSelector(selectExpenseError);

    // Initialization: Fetch expenses on mount
    useEffect(() => {
        if (status === 'idle') {
            dispatch(fetchExpensesAsync());
        }
    }, [status, dispatch]);

    /**
     * Add a new expense
     */
    const addExpense = useCallback(async (expenseData) => {
        if (!user?.id) {
            console.error('User not authenticated');
            return false;
        }

        const dataWithUser = {
            ...expenseData,
            user_id: user.id
        };

        const result = await dispatch(createExpenseAsync(dataWithUser));
        return createExpenseAsync.fulfilled.match(result);
    }, [dispatch, user]);

    /**
     * Update an existing expense
     */
    const updateExpense = useCallback(async (id, data) => {
        const result = await dispatch(updateExpenseAsync({ id, data }));
        return updateExpenseAsync.fulfilled.match(result);
    }, [dispatch]);

    /**
     * Delete an expense
     */
    const deleteExpense = useCallback(async (id) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa chi tiết chi tiêu này?')) {
            const result = await dispatch(deleteExpenseAsync(id));
            return deleteExpenseAsync.fulfilled.match(result);
        }
        return false;
    }, [dispatch]);

    /**
     * Predefined Expense Categories
     * Memoized to prevent unnecessary re-renders.
     */
    const categories = useMemo(() => ({
        fixed: [
            { value: 'rent', label: 'Tiền thuê mặt bằng' },
            { value: 'salary', label: 'Lương nhân viên' },
            { value: 'utilities', label: 'Điện & Nước' },
            { value: 'internet', label: 'Wi-Fi & Cáp' },
            { value: 'tax', label: 'Thuế & Phí' },
            { value: 'other_fixed', label: 'Khác (Cố định)' },
        ],
        variable: [
            { value: 'ingredients', label: 'Nguyên liệu thực phẩm' },
            { value: 'drinks', label: 'Đồ uống & Bar' },
            { value: 'marketing', label: 'Marketing / QC' },
            { value: 'maintenance', label: 'Bảo trì / Sửa chữa' },
            { value: 'supplies', label: 'Đồ dùng tiêu hao' },
            { value: 'other_variable', label: 'Khác (Biến đổi)' },
        ]
    }), []);

    /**
     * Get all labels for display
     */
    const getAllCategories = useCallback(() => {
        return [...categories.fixed, ...categories.variable];
    }, [categories]);

    return {
        expenses,
        loading: status === 'loading',
        processing,
        error,
        addExpense,
        updateExpense,
        deleteExpense,
        categories,
        getAllCategories,
        clearError: () => dispatch(clearExpenseError())
    };
};
