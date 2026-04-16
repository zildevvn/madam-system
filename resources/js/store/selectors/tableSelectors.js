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
      // Support both active_order and plural active_orders (casing normalized)
      const rawPlural = t.active_orders || t.activeOrders;
      const rawSingular = t.active_order || t.activeOrder;
      const allActiveOrders = rawPlural || (rawSingular ? [rawSingular] : []);

      allActiveOrders.forEach(order => {
        if (!order) return;

        // [WHY] Case A: Link via explicit merged_tables string (Staff Order manual merge)
        if (order.merged_tables && typeof order.merged_tables === 'string') {
          const groupKey = order.merged_tables;
          const involvedIds = groupKey.split('-');
          involvedIds.forEach(id => {
            if (id) tableIdToGroupKey[id.toString()] = groupKey;
          });
        } 
        
        // [WHY] Case B: Link via Group Reservation table_ids (Backoffice seated)
        // This ensures that even follower tables without their own 'merged_tables' string
        // are correctly identified as busy and grouped.
        if (order.reservation && order.reservation.type === 'group' && Array.isArray(order.reservation.table_ids)) {
          const groupKey = order.reservation.table_ids
            .map(id => id.toString())
            .sort((a, b) => parseInt(a) - parseInt(b))
            .join('-');
          
          order.reservation.table_ids.forEach(id => {
            if (id) tableIdToGroupKey[id.toString()] = groupKey;
          });
        }
      });
    });
    return tableIdToGroupKey;
  }
);
