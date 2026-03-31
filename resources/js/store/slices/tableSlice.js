import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import tableService from '../../services/tableService';

export const fetchTables = createAsyncThunk('table/fetchTables', async () => {
  const response = await tableService.getAllTables();
  return response.data; // The backend now wraps the payload in { data: [...], message: ... }
});

const initialState = {
  byId: {},
  allIds: [],
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
  activeTab: 'tables', // 'tables' | 'orders'
};

const tableSlice = createSlice({
  name: 'table',
  initialState,
  reducers: {
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTables.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchTables.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const tables = action.payload;
        tables.forEach(table => {
            state.byId[table.id] = table;
        });
        state.allIds = tables.map(table => table.id);
      })
      .addCase(fetchTables.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  },
});

export const { setActiveTab } = tableSlice.actions;

// Selectors
const selectTablesState = state => state.table;

export const selectAllTables = createSelector(
  [selectTablesState],
  (tableState) => tableState.allIds.map(id => tableState.byId[id])
);

export const selectBusyTablesCount = createSelector(
  [selectAllTables],
  (tables) => tables.filter(t => !!t.active_order).length
);

export const selectEmptyTablesCount = createSelector(
  [selectAllTables],
  (tables) => tables.filter(t => !t.active_order).length
);

export const selectBusyTables = createSelector(
  [selectAllTables],
  (tables) => tables.filter(t => !!t.active_order)
);

export default tableSlice.reducer;
