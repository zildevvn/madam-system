import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import orderApi from '../../services/orderApi';

export const fetchActiveOrderAsync = createAsyncThunk('order/fetchActiveOrder', async (tableId) => {
  const data = await orderApi.getActiveOrder(tableId);
  return data.data;
});

export const createOrderAsync = createAsyncThunk('order/createOrder', async (createData) => {
  const response = await orderApi.createOrder(createData);
  return response.data;
});

export const checkoutOrderAsync = createAsyncThunk('order/checkout', async ({ orderId, items, mergedTables = null, orderNote = null, guestCount = null }) => {
  const data = await orderApi.checkoutOrder(orderId, items, mergedTables, orderNote, guestCount);
  return data.data;
});

export const cancelOrderAsync = createAsyncThunk('order/cancelOrder', async (orderId) => {
  const data = await orderApi.cancelOrder(orderId);
  return data.data;
});

export const updateOrderTableAsync = createAsyncThunk('order/updateTable', async ({ orderId, tableId }) => {
  const data = await orderApi.updateOrderTable(orderId, tableId);
  return data.data;
});

export const updateOrderNoteAsync = createAsyncThunk('order/updateNote', async ({ orderId, note }) => {
  const data = await orderApi.updateOrderNote(orderId, note);
  return data.data;
});

export const updateGuestCountAsync = createAsyncThunk('order/updateGuestCount', async ({ orderId, count }) => {
  const data = await orderApi.updateGuestCount(orderId, count);
  return data.data;
});

export const updateItemStatusAsync = createAsyncThunk('order/updateItemStatus', async ({ itemId, status }) => {
  const data = await orderApi.updateItemStatus(itemId, status);
  return data.data;
});

const initialState = {
  items: {
    byId: {},
    allIds: []
  },
  orderType: 'dine-in',
  tableId: null,
  mergedTables: null,
  activeOrderId: null,
  orderStatus: 'draft',
  isModified: false,
  originalItems: {}, // Snapshot of items [id]: { quantity, note, type }
  orderNote: '',     // Order-level staff note, displayed on the bill page
  guestCount: 1,    // Number of guests for the order
  status: 'idle',
};

const orderSlice = createSlice({
  name: 'order',
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const item = action.payload;
      if (state.items.byId[item.id]) {
        state.items.byId[item.id].quantity += 1;
      } else {
        state.items.byId[item.id] = { ...item, quantity: 1 };
        state.items.allIds.push(item.id);
      }
      state.isModified = true;
    },
    removeFromCart: (state, action) => {
      const id = action.payload;
      delete state.items.byId[id];
      state.items.allIds = state.items.allIds.filter(itemId => itemId !== id);
      state.isModified = true;
    },
    updateQuantity: (state, action) => {
      const { id, quantity } = action.payload;
      if (state.items.byId[id]) {
        if (state.items.byId[id].quantity !== quantity) {
          state.items.byId[id].quantity = quantity;
          state.isModified = true;
        }
        if (state.items.byId[id].quantity <= 0) {
          delete state.items.byId[id];
          state.items.allIds = state.items.allIds.filter(itemId => itemId !== id);
          state.isModified = true;
        }
      }
    },
    updateItemNote: (state, action) => {
      const { id, note } = action.payload;
      if (state.items.byId[id]) {
        state.items.byId[id].note = note;
        state.isModified = true;
      }
    },
    setOrderType: (state, action) => {
      state.orderType = action.payload;
    },
    setTableId: (state, action) => {
      state.tableId = action.payload;
    },
    setOrderNote: (state, action) => {
      state.orderNote = action.payload;
    },
    setGuestCount: (state, action) => {
      state.guestCount = action.payload;
      state.isModified = true;
    },
    clearCart: (state) => {
      state.items = { byId: {}, allIds: [] };
      state.isModified = true;
    },
    startNewOrder: (state, action) => {
      state.tableId = action.payload; // the table id
      state.activeOrderId = null; // explicitly null since it's uncreated
      state.orderStatus = 'draft';
      state.isModified = true;
      state.items = { byId: {}, allIds: [] };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchActiveOrderAsync.fulfilled, (state, action) => {
        const order = action.payload;
        if (order) {
          state.activeOrderId = order.id;
          state.orderStatus = order.status;
          state.orderType = order.order_type;
          state.tableId = order.table_id;
          state.mergedTables = order.merged_tables;
          state.orderNote = order.order_note || '';
          state.guestCount = order.guest_count || 1;
          state.isModified = false;
          state.items.byId = {};
          state.items.allIds = [];
          if (order.items) {
            order.items.forEach(orderItem => {
              const product = orderItem.product;
              if (product) {
                const itemData = { ...product, quantity: Number(orderItem.quantity), note: orderItem.note || '' };
                state.items.byId[product.id] = itemData;
                state.originalItems[product.id] = { quantity: Number(orderItem.quantity), note: orderItem.note || '', type: product.type };
                if (!state.items.allIds.includes(product.id)) {
                  state.items.allIds.push(product.id);
                }
              }
            });
          }

        } else {
          // No active order found for table
          state.activeOrderId = null;
          state.orderNote = '';
          state.guestCount = 1;
          state.isModified = false;
          state.items = { byId: {}, allIds: [] };
        }
      })
      .addCase(createOrderAsync.fulfilled, (state, action) => {
        const order = action.payload;
        if (order) {
          state.activeOrderId = order.id;
          state.orderStatus = order.status;
          state.guestCount = order.guest_count || 1;
          state.isModified = false;
        }
      })
      .addCase(checkoutOrderAsync.fulfilled, (state) => {
        state.items = { byId: {}, allIds: [] };
        state.activeOrderId = null;
        state.orderStatus = null;
        state.isModified = false;
      })
      .addCase(cancelOrderAsync.fulfilled, (state) => {
        state.items = { byId: {}, allIds: [] };
        state.activeOrderId = null;
        state.orderStatus = null;
        state.isModified = false;
      })
      .addCase(updateOrderTableAsync.fulfilled, (state, action) => {
        const order = action.payload;
        if (order) {
          state.activeOrderId = order.id;
          state.orderStatus = order.status;
          state.orderType = order.order_type;
          state.tableId = order.table_id;
          state.mergedTables = order.merged_tables;
          state.guestCount = order.guest_count || 1;
          state.isModified = false;
          state.items.byId = {};
          state.items.allIds = [];
          if (order.items) {
            order.items.forEach(orderItem => {
              const product = orderItem.product;
              if (product) {
                const itemData = { ...product, quantity: Number(orderItem.quantity), note: orderItem.note || '' };
                state.items.byId[product.id] = itemData;
                state.originalItems[product.id] = { quantity: Number(orderItem.quantity), note: orderItem.note || '', type: product.type };
                if (!state.items.allIds.includes(product.id)) {
                  state.items.allIds.push(product.id);
                }
              }
            });
          }
        }
      });
  },
});

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  updateItemNote,
  setOrderType,
  setTableId,
  setOrderNote,
  setGuestCount,
  clearCart,
  startNewOrder
} = orderSlice.actions;

// Selectors
const selectOrderState = state => state.order;

export const selectSelectedItems = createSelector(
  [selectOrderState],
  (orderState) => orderState.items.allIds.map(id => orderState.items.byId[id])
);

export const selectOriginalItems = createSelector(
  [selectOrderState],
  (orderState) => orderState.originalItems
);

export default orderSlice.reducer;
