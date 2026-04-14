import { createSelector } from '@reduxjs/toolkit';

const selectTablesState = state => state.table;

export const selectTables = createSelector(
  [selectTablesState],
  (tableState) => tableState.allIds.map(id => tableState.byId[id])
);

export const selectActiveTables = createSelector(
  [selectTables],
  (tables) => tables.filter(t => !!t.active_order)
);

export const selectTableIdToGroupKey = createSelector(
  [selectTables],
  (tables) => {
    const tableIdToGroupKey = {};
    tables.forEach(t => {
      // [FIX] Support both active_order and plural active_orders (casing normalized)
      const rawPlural = t.active_orders || t.activeOrders;
      const rawSingular = t.active_order || t.activeOrder;
      const allActiveOrders = rawPlural || (rawSingular ? [rawSingular] : []);

      allActiveOrders.forEach(order => {
        if (order && order.merged_tables && typeof order.merged_tables === 'string') {
          const groupKey = order.merged_tables;
          const involvedIds = groupKey.split('-');
          involvedIds.forEach(id => {
            if (id) tableIdToGroupKey[id.toString()] = groupKey;
          });
        }
      });
    });
    return tableIdToGroupKey;
  }
);
