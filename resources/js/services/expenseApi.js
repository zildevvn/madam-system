import axios from 'axios';

/**
 * Expense Management API
 * Following project conventions for naming and structure.
 */
const expenseApi = {
    /**
     * Fetch all expenses
     */
    getExpenses: async () => {
        const response = await axios.get('/api/expenses');
        return response.data;
    },

    /**
     * Create a new expense
     */
    createExpense: async (expenseData) => {
        const response = await axios.post('/api/expenses', expenseData);
        return response.data;
    },

    /**
     * Update an existing expense
     */
    updateExpense: async (id, expenseData) => {
        const response = await axios.put(`/api/expenses/${id}`, expenseData);
        return response.data;
    },

    /**
     * Delete an expense
     */
    deleteExpense: async (id) => {
        const response = await axios.delete(`/api/expenses/${id}`);
        return response.data;
    }
};

export default expenseApi;
