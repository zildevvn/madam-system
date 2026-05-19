import { createSlice, createAsyncThunk, createSelector, isAnyOf } from '@reduxjs/toolkit';
import tableService from '../../services/tableService';
import { updateItemStatusAsync, checkoutOrderAsync, fetchActiveOrderAsync } from './orderSlice';

export const fetchTables = createAsyncThunk('table/fetchTables', async (type = null) => {
  const response = await tableService.getAllTables(type);
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
    // [WHY] Optimistically removes a completed order from the active orders list immediately.
    // Prevents "ghost" duplicates from lingering on the UI before the WebSocket confirmation arrives.
    optimisticallyCompleteOrder: (state, action) => {
      const orderId = action.payload;
      state.allIds.forEach(id => {
        const table = state.byId[id];
        if (table?.active_order?.id === orderId) {
          table.active_order = null;
        }
        if (table?.active_orders) {
          table.active_orders = table.active_orders.filter(o => o.id !== orderId);
        }
      });
    },
    markOrderAsPrinted: (state, action) => {
      const { orderId, siblingOrderIds = [] } = action.payload;
      const allTargetIds = [orderId, ...siblingOrderIds].map(id => Number(id));

      state.allIds.forEach(id => {
        const table = state.byId[id];
        if (table?.active_order && allTargetIds.includes(table.active_order.id)) {
          table.active_order.is_printed = true;
          table.active_order.print_count = (Number(table.active_order.print_count) || 0) + 1;
        }
        if (table?.active_orders) {
          table.active_orders.forEach(o => {
            if (allTargetIds.includes(o.id)) {
              o.is_printed = true;
              o.print_count = (Number(o.print_count) || 0) + 1;
            }
          });
        }
      });
    },
    updateTableFromSocket: (state, action) => {
      const { id, status, active_order, active_orders } = action.payload;
      if (state.byId[id]) {
        if (status) state.byId[id].status = status;
        if (active_order !== undefined) state.byId[id].active_order = active_order;
        if (active_orders !== undefined) state.byId[id].active_orders = active_orders;
      }
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

export const { setActiveTab, patchItemsStatus, optimisticallyCompleteOrder, updateTableFromSocket, markOrderAsPrinted } = tableSlice.actions;

// Selectors
const selectTablesState = state => state.table;

export const selectAllTables = createSelector(
  [selectTablesState],
  (tableState) => tableState.allIds.map(id => tableState.byId[id])
);

/**
 * [HELPER] Builds a mapping of table IDs to their logical group keys.
 * Handles both standard merges and group reservations.
 */
const getGroupMapping = (tables) => {
  const mapping = {};
  tables.forEach(t => {
    const rawPlural = t.active_orders || t.activeOrders;
    const rawSingular = t.active_order || t.activeOrder;
    const orders = rawPlural || (rawSingular ? [rawSingular] : []);

    orders.forEach(order => {
      if (!order) return;

      // Case A: Merged Tables string
      if (order.merged_tables) {
        const groupKey = order.merged_tables;
        groupKey.split('-').forEach(id => {
          if (id) mapping[id.toString()] = groupKey;
        });
      }

      // Case B: Group Reservation IDs
      if (order.reservation?.type === 'group' && Array.isArray(order.reservation.table_ids)) {
        const groupKey = order.reservation.table_ids
          .map(id => id.toString())
          .sort((a, b) => parseInt(a) - parseInt(b))
          .join('-');
        order.reservation.table_ids.forEach(id => {
          if (id) mapping[id.toString()] = groupKey;
        });
      }
    });
  });
  return mapping;
};

export const selectBusyTablesCount = createSelector(
  [selectAllTables],
  (tables) => {
    const groupMapping = getGroupMapping(tables);
    return tables.filter(t => !!t.active_order || !!groupMapping[t.id.toString()]).length;
  }
);

export const selectEmptyTablesCount = createSelector(
  [selectAllTables, selectBusyTablesCount],
  (tables, busyCount) => tables.length - busyCount
);

export const selectBusyTables = createSelector(
  [selectAllTables],
  (tables) => {
    const tableIdToGroupKey = getGroupMapping(tables);
    const consolidatedGroups = new Set();

    return tables.filter(t => {
      // [RULE] A table belongs in 'Busy Tables' list if it has an active order.
      if (!t.active_order) {
        return false;
      }

      const groupKey = tableIdToGroupKey[t.id.toString()] || t.id.toString();

      // [RULE] If in a group, only show the 'primary' table (first ID in sorted group key)
      if (groupKey.includes('-')) {
        const primaryId = groupKey.split('-')[0];
        if (t.id.toString() !== primaryId) return false;
      }

      if (consolidatedGroups.has(groupKey)) return false;
      consolidatedGroups.add(groupKey);
      return true;
    }).map(t => {
      // [WHY] Attach a descriptive tableName that resolves IDs to numeric labels
      const groupKey = tableIdToGroupKey[t.id.toString()] || t.id.toString();
      if (groupKey.includes('-')) {
        const labels = groupKey.split('-').map(id => {
          const tableObj = tables.find(allT => allT.id.toString() === id.toString());
          return tableObj?.name?.replace(/[^0-9]/g, '') || id;
        }).filter(Boolean);
        return { ...t, tableName: labels.join('-') };
      }
      return { ...t, tableName: t.name?.replace(/[^0-9]/g, '') || t.id.toString() };
    });
  }
);

export default tableSlice.reducer;
