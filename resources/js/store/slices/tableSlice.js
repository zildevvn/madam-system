import { createSlice, createAsyncThunk, createSelector, isAnyOf } from '@reduxjs/toolkit';
import tableService from '../../services/tableService';
import { updateItemStatusAsync, checkoutOrderAsync, fetchActiveOrderAsync } from './orderSlice';

export const fetchTables = createAsyncThunk('table/fetchTables', async () => {
  const response = await tableService.getAllTables();
  return response.data; // The backend now wraps the payload in { data: [...], message: ... }
});

const initialState = {
  byId: {},
  allIds: [],
  status: 'idle',
  error: null,
  activeTab: 'tables',
  // Tracks tables that have pending optimistic patches.
  // fetchTables.fulfilled will not overwrite these tables to avoid race conditions.
  pendingTableIds: {},  // { [tableId]: pendingCount }
};

const tableSlice = createSlice({
  name: 'table',
  initialState,
  reducers: {
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },
    // Optimistic item status patch: updates specific items in-place before API confirms.
    // Also registers the table as 'pending' to guard against stale fetchTables overwrites.
    // [WHY] Global search across all tables is required to correctly update merged/combined views.
    patchItemsStatus: (state, action) => {
      const { tableId, itemIds, status } = action.payload;
      
      // 1. Register the primary table as pending to guard against race conditions
      state.pendingTableIds[tableId] = (state.pendingTableIds[tableId] || 0) + 1;
      
      // 2. Surgical update: iterate through all tables to find and update matching item IDs.
      //    This ensures that in a merged group, items belonging to "follower" tables are also updated.
      state.allIds.forEach(id => {
        const table = state.byId[id];
        if (table?.active_order?.items) {
          table.active_order.items.forEach(item => {
            if (itemIds.includes(item.id)) {
              item.status = status;
            }
          });
        }
      });
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
          // Skip tables that have in-flight optimistic patches.
          // Their confirmed data will arrive via updateItemStatusAsync.fulfilled addMatcher.
          if (state.pendingTableIds[table.id] > 0) return;
          state.byId[table.id] = table;
        });
        state.allIds = tables.map(table => table.id);
      })
      .addCase(fetchTables.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      // When a full table fetch comes in, update all tables.
      // Use a surgical merge: update each table but preserve any in-flight local patches.
      // NOTE: This is fine because fetchTables is called AFTER the server has committed the change.
      // Sync item status updates directly to the table slice (immediate, no re-fetch needed)
      .addMatcher(
        isAnyOf(updateItemStatusAsync.fulfilled),
        (state, action) => {
          const order = action.payload;
          if (!order || !order.table_id) return;
          const tableId = order.table_id;
          if (!state.byId[tableId]) return;

          // Clear one pending count for this table
          if (state.pendingTableIds[tableId] > 0) {
            state.pendingTableIds[tableId] -= 1;
          }

          const existingOrder = state.byId[tableId].active_order;
          if (!existingOrder) {
            state.byId[tableId].active_order = order;
            return;
          }
          // Surgical patch with server-confirmed statuses
          if (order.items && existingOrder.items) {
            order.items.forEach(updatedItem => {
              const idx = existingOrder.items.findIndex(i => i.id === updatedItem.id);
              if (idx !== -1) {
                existingOrder.items[idx] = updatedItem;
              } else {
                existingOrder.items.push(updatedItem);
              }
            });
          }
        }
      )
      .addMatcher(
        isAnyOf(updateItemStatusAsync.rejected),
        (state, action) => {
          // On failure, clear the pending guard.
          // Bills.jsx will dispatch a revert patchItemsStatus separately.
          const tableId = action.meta?.arg?.tableId;
          if (tableId && state.pendingTableIds[tableId] > 0) {
            state.pendingTableIds[tableId] -= 1;
          }
        }
      )
      .addMatcher(
        isAnyOf(checkoutOrderAsync.fulfilled, fetchActiveOrderAsync.fulfilled),
        (state, action) => {
          const order = action.payload;
          if (order && order.table_id && state.byId[order.table_id]) {
            state.byId[order.table_id].active_order = order;
            if (action.type === checkoutOrderAsync.fulfilled.type) {
              state.byId[order.table_id].status = 'busy';
            }
          }
        }
      );
  },
});

export const { setActiveTab, patchItemsStatus } = tableSlice.actions;

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
