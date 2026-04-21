import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import expenseApi from '../../services/expenseApi';

// Async Thunks
export const fetchExpensesAsync = createAsyncThunk(
    'expense/fetchExpenses',
    async (_, { rejectWithValue }) => {
        try {
            const response = await expenseApi.getExpenses();
            return response.data; // Expected format: Array of expenses
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch expenses');
        }
    }
);

export const createExpenseAsync = createAsyncThunk(
    'expense/createExpense',
    async (expenseData, { rejectWithValue }) => {
        try {
            const response = await expenseApi.createExpense(expenseData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to create expense');
        }
    }
);

export const updateExpenseAsync = createAsyncThunk(
    'expense/updateExpense',
    async ({ id, data }, { rejectWithValue }) => {
        try {
            const response = await expenseApi.updateExpense(id, data);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to update expense');
        }
    }
);

export const deleteExpenseAsync = createAsyncThunk(
    'expense/deleteExpense',
    async (id, { rejectWithValue }) => {
        try {
            await expenseApi.deleteExpense(id);
            return id;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to delete expense');
        }
    }
);

const initialState = {
    byId: {},
    allIds: [],
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    processing: false,
    error: null,
};

const expenseSlice = createSlice({
    name: 'expense',
    initialState,
    reducers: {
        clearExpenseError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch Expenses
            .addCase(fetchExpensesAsync.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(fetchExpensesAsync.fulfilled, (state, action) => {
                state.status = 'succeeded';
                const expenses = action.payload;
                state.byId = {};
                state.allIds = [];
                expenses.forEach(expense => {
                    state.byId[expense.id] = expense;
                    state.allIds.push(expense.id);
                });
            })
            .addCase(fetchExpensesAsync.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })

            // Create Expense
            .addCase(createExpenseAsync.pending, (state) => {
                state.processing = true;
                state.error = null;
            })
            .addCase(createExpenseAsync.fulfilled, (state, action) => {
                state.processing = false;
                const expense = action.payload;
                state.byId[expense.id] = expense;
                state.allIds.unshift(expense.id); // Add to beginning as it's ordered by date desc
            })
            .addCase(createExpenseAsync.rejected, (state, action) => {
                state.processing = false;
                state.error = action.payload;
            })

            // Update Expense
            .addCase(updateExpenseAsync.pending, (state) => {
                state.processing = true;
                state.error = null;
            })
            .addCase(updateExpenseAsync.fulfilled, (state, action) => {
                state.processing = false;
                const expense = action.payload;
                state.byId[expense.id] = expense;
            })
            .addCase(updateExpenseAsync.rejected, (state, action) => {
                state.processing = false;
                state.error = action.payload;
            })

            // Delete Expense
            .addCase(deleteExpenseAsync.pending, (state) => {
                state.processing = true;
                state.error = null;
            })
            .addCase(deleteExpenseAsync.fulfilled, (state, action) => {
                state.processing = false;
                const id = action.payload;
                delete state.byId[id];
                state.allIds = state.allIds.filter(expenseId => expenseId !== id);
            })
            .addCase(deleteExpenseAsync.rejected, (state, action) => {
                state.processing = false;
                state.error = action.payload;
            });
    }
});

export const { clearExpenseError } = expenseSlice.actions;

// Selectors
const selectExpenseState = state => state.expense;

export const selectAllExpenses = createSelector(
    [selectExpenseState],
    (expenseState) => expenseState.allIds.map(id => expenseState.byId[id])
);

export const selectExpenseStatus = (state) => state.expense.status;
export const selectExpenseProcessing = (state) => state.expense.processing;
export const selectExpenseError = (state) => state.expense.error;

export default expenseSlice.reducer;
