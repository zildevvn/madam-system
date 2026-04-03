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
      if (t.active_order && t.active_order.merged_tables) {
        const groupKey = t.active_order.merged_tables;
        const involvedIds = groupKey.split('-');
        involvedIds.forEach(id => {
          tableIdToGroupKey[id] = groupKey;
        });
      }
    });
    return tableIdToGroupKey;
  }
);
