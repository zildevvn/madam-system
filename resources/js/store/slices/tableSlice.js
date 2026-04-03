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
  (tables) => {
    const mergedInIds = new Set();
    tables.forEach(t => {
      if (t.active_order && t.active_order.merged_tables) {
        const ids = t.active_order.merged_tables.split('-');
        ids.forEach(id => mergedInIds.add(id.toString()));
      }
    });

    return tables.filter(t => !!t.active_order || mergedInIds.has(t.id.toString())).length;
  }
);

export const selectEmptyTablesCount = createSelector(
  [selectAllTables, selectBusyTablesCount],
  (tables, busyCount) => tables.length - busyCount
);

export const selectBusyTables = createSelector(
  [selectAllTables],
  (tables) => {
    // Collect all merged table groups and filter tables
    const tableIdToGroupKey = {};
    const consolidatedGroups = new Set();

    tables.forEach(t => {
      if (t.active_order && t.active_order.merged_tables) {
        const groupKey = t.active_order.merged_tables;
        const ids = groupKey.split('-');
        ids.forEach(id => {
          tableIdToGroupKey[id] = groupKey;
        });
      }
    });

    return tables.filter(t => {
      if (!t.active_order) {
          // If table has no order but is part of a merge, it's busy but consolidated (hidden in list)
          return false;
      }
      const groupKey = tableIdToGroupKey[t.id.toString()] || t.id.toString();
      if (groupKey.includes('-')) {
          const primaryId = groupKey.split('-')[0];
          if (t.id.toString() !== primaryId) return false;
      }
      if (consolidatedGroups.has(groupKey)) return false;
      consolidatedGroups.add(groupKey);
      return true;
    });
  }
);

export default tableSlice.reducer;
