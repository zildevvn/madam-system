import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import orderApi from '../../services/orderApi';

export const fetchActiveOrderAsync = createAsyncThunk('order/fetchActiveOrder', async (tableId) => {
  const data = await orderApi.fetchActiveOrder(tableId);
  return data.data;
});

export const createOrderAsync = createAsyncThunk('order/createOrder', async (createData) => {
  const response = await orderApi.create(createData);
  return response.data;
});

export const checkoutOrderAsync = createAsyncThunk('order/checkout', async ({ orderId, items, mergedTables = null, orderNote = null, guestCount = null, userId = null }) => {
  const data = await orderApi.checkout(orderId, {
    items,
    merged_tables: mergedTables,
    order_note: orderNote,
    guest_count: guestCount,
    user_id: userId
  });
  return data.data;
});

export const cancelOrderAsync = createAsyncThunk('order/cancelOrder', async (orderId) => {
  const data = await orderApi.cancel(orderId);
  return data.data;
});

export const updateOrderTableAsync = createAsyncThunk('order/updateTable', async ({ orderId, tableId }) => {
  const data = await orderApi.updateTable(orderId, tableId);
  return data.data;
});

export const updateOrderNoteAsync = createAsyncThunk('order/updateNote', async ({ orderId, note }) => {
  const data = await orderApi.updateNote(orderId, note);
  return data.data;
});

export const updateGuestCountAsync = createAsyncThunk('order/updateGuestCount', async ({ orderId, count }) => {
  const data = await orderApi.updateGuestCount(orderId, count);
  return data.data;
});

export const updateItemStatusAsync = createAsyncThunk('order/updateItemStatus', async ({ itemId, status, quantity = null }) => {
  const data = await orderApi.updateItemStatus(itemId, status, quantity);
  return data.data;
});

export const splitOrderAsync = createAsyncThunk('order/split', async ({ orderId, items }) => {
  const data = await orderApi.split(orderId, items);
  return data.data;
});

const processChildOrders = (state, order) => {
  const childOrders = order.child_orders || order.childOrders;
  if (childOrders) {
    childOrders.forEach(childOrder => {
      const childItems = childOrder.items;
      if (childItems) {
        childItems.forEach(orderItem => {
          const product = orderItem.product;
          const uniqueKey = `split-${orderItem.id}`;
          const itemData = product
            ? { 
                ...product, 
                id: uniqueKey,
                product_id: product.id,
                order_item_id: orderItem.id,
                quantity: Number(orderItem.quantity), 
                note: orderItem.note || '',
                discount: orderItem.discount || 0,
                discountType: orderItem.discount_type || 'fixed',
                isSplit: true,
                splitOrderName: `Đơn #${childOrder.id}`
              }
            : {
                id: uniqueKey,
                product_id: null,
                order_item_id: orderItem.id,
                name: orderItem.name || 'Custom Item',
                price: Number(orderItem.price),
                type: orderItem.type || 'food',
                quantity: Number(orderItem.quantity),
                note: orderItem.note || '',
                discount: orderItem.discount || 0,
                discountType: orderItem.discount_type || 'fixed',
                isCustom: true,
                isSplit: true,
                splitOrderName: `Đơn #${childOrder.id}`
              };
          state.items.byId[uniqueKey] = itemData;
          if (!state.items.allIds.includes(uniqueKey)) {
            state.items.allIds.push(uniqueKey);
          }
        });
      }
    });
  }
};

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
    addCustomToCart: (state, action) => {
      const item = action.payload;
      state.items.byId[item.id] = item;
      state.items.allIds.push(item.id);
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
      state.isModified = true;
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
    updateOrderFromSocket: (state, action) => {
      const order = action.payload;
      // [WHY] Only update if this order belongs to the currently viewed table
      // or is the specific order we are already tracking.
      if (order && (order.id === state.activeOrderId || order.table_id === state.tableId)) {
        state.activeOrderId = order.id;
        state.orderStatus = order.status;
        state.orderType = order.order_type;
        state.tableId = order.table_id;
        state.mergedTables = order.merged_tables;
        
        // [BUGFIX] If the user has local unsaved modifications (like new items or typing a note),
        // we must NOT overwrite the state with the backend payload. Overwriting here
        // would wipe out newly added items when the debounced note-update triggers a socket event.
        if (!state.isModified) {
          state.orderNote = order.order_note || '';
          state.guestCount = order.guest_count || 1;
          state.isModified = false;
          
          // Surgical items update
          state.items.byId = {};
          state.items.allIds = [];
          state.originalItems = {};
          
          if (order.items) {
            order.items.forEach(orderItem => {
              const product = orderItem.product;
              const uniqueKey = `item-${orderItem.id}`;
              const itemData = product
                ? { 
                    ...product, 
                    id: uniqueKey,
                    product_id: product.id,
                    order_item_id: orderItem.id,
                    quantity: Number(orderItem.quantity), 
                    note: orderItem.note || '',
                    discount: orderItem.discount || 0,
                    discountType: orderItem.discount_type || 'fixed'
                  }
                : {
                    id: uniqueKey,
                    product_id: null,
                    order_item_id: orderItem.id,
                    name: orderItem.name || 'Custom Item',
                    price: Number(orderItem.price),
                    type: orderItem.type || 'food',
                    quantity: Number(orderItem.quantity),
                    note: orderItem.note || '',
                    discount: orderItem.discount || 0,
                    discountType: orderItem.discount_type || 'fixed',
                    isCustom: true
                  };
              state.items.byId[uniqueKey] = itemData;
              state.originalItems[uniqueKey] = { 
                quantity: Number(orderItem.quantity), 
                note: orderItem.note || '', 
                type: product ? product.type : (orderItem.type || 'food')
              };
              if (!state.items.allIds.includes(uniqueKey)) {
                state.items.allIds.push(uniqueKey);
              }
            });
          }

          processChildOrders(state, order);
        }
      }
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
          state.originalItems = {}; // Reset original items
          
          if (order.items) {
            order.items.forEach(orderItem => {
              const product = orderItem.product;
              const uniqueKey = `item-${orderItem.id}`;
              const itemData = product
                ? { 
                    ...product, 
                    id: uniqueKey,
                    product_id: product.id,
                    order_item_id: orderItem.id,
                    quantity: Number(orderItem.quantity), 
                    note: orderItem.note || '',
                    discount: orderItem.discount || 0,
                    discountType: orderItem.discount_type || 'fixed'
                  }
                : {
                    id: uniqueKey,
                    product_id: null,
                    order_item_id: orderItem.id,
                    name: orderItem.name || 'Custom Item',
                    price: Number(orderItem.price),
                    type: orderItem.type || 'food',
                    quantity: Number(orderItem.quantity),
                    note: orderItem.note || '',
                    discount: orderItem.discount || 0,
                    discountType: orderItem.discount_type || 'fixed',
                    isCustom: true
                  };
              
              state.items.byId[uniqueKey] = itemData;
              state.originalItems[uniqueKey] = { 
                quantity: Number(orderItem.quantity), 
                note: orderItem.note || '', 
                type: product ? product.type : (orderItem.type || 'food')
              };
              if (!state.items.allIds.includes(uniqueKey)) {
                state.items.allIds.push(uniqueKey);
              }
            });
          }

          processChildOrders(state, order);

        } else {
          // No active order found for table
          state.activeOrderId = null;
          state.orderNote = '';
          state.guestCount = 1;
          state.isModified = false;
          state.items = { byId: {}, allIds: [] };
          state.originalItems = {};
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
        state.originalItems = {};
      })
      .addCase(cancelOrderAsync.fulfilled, (state) => {
        state.items = { byId: {}, allIds: [] };
        state.activeOrderId = null;
        state.orderStatus = null;
        state.isModified = false;
        state.originalItems = {};
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
          state.originalItems = {};

          if (order.items) {
            order.items.forEach(orderItem => {
              const product = orderItem.product;
              const uniqueKey = `item-${orderItem.id}`;
              const itemData = product
                ? { 
                    ...product, 
                    id: uniqueKey,
                    product_id: product.id,
                    order_item_id: orderItem.id,
                    quantity: Number(orderItem.quantity), 
                    note: orderItem.note || '',
                    discount: orderItem.discount || 0,
                    discountType: orderItem.discount_type || 'fixed'
                  }
                : {
                    id: uniqueKey,
                    product_id: null,
                    order_item_id: orderItem.id,
                    name: orderItem.name || 'Custom Item',
                    price: Number(orderItem.price),
                    type: orderItem.type || 'food',
                    quantity: Number(orderItem.quantity),
                    note: orderItem.note || '',
                    discount: orderItem.discount || 0,
                    discountType: orderItem.discount_type || 'fixed',
                    isCustom: true
                  };
              state.items.byId[uniqueKey] = itemData;
              state.originalItems[uniqueKey] = { 
                quantity: Number(orderItem.quantity), 
                note: orderItem.note || '', 
                type: product ? product.type : (orderItem.type || 'food')
              };
              if (!state.items.allIds.includes(uniqueKey)) {
                state.items.allIds.push(uniqueKey);
              }
            });
          }

          processChildOrders(state, order);
        }
      })
      .addCase(splitOrderAsync.fulfilled, (state, action) => {
        const { source_order } = action.payload;
        if (source_order) {
          state.activeOrderId = source_order.id;
          state.orderStatus = source_order.status;
          state.isModified = false;
          state.items.byId = {};
          state.items.allIds = [];
          state.originalItems = {};

          if (source_order.items) {
            source_order.items.forEach(orderItem => {
              const product = orderItem.product;
              const uniqueKey = `item-${orderItem.id}`;
              const itemData = product
                ? { 
                    ...product, 
                    id: uniqueKey,
                    product_id: product.id,
                    order_item_id: orderItem.id,
                    quantity: Number(orderItem.quantity), 
                    note: orderItem.note || '',
                    discount: orderItem.discount || 0,
                    discountType: orderItem.discount_type || 'fixed'
                  }
                : {
                    id: uniqueKey,
                    product_id: null,
                    order_item_id: orderItem.id,
                    name: orderItem.name || 'Custom Item',
                    price: Number(orderItem.price),
                    type: orderItem.type || 'food',
                    quantity: Number(orderItem.quantity),
                    note: orderItem.note || '',
                    discount: orderItem.discount || 0,
                    discountType: orderItem.discount_type || 'fixed',
                    isCustom: true
                  };
              state.items.byId[uniqueKey] = itemData;
              state.originalItems[uniqueKey] = { 
                quantity: Number(orderItem.quantity), 
                note: orderItem.note || '', 
                type: product ? product.type : (orderItem.type || 'food')
              };
              if (!state.items.allIds.includes(uniqueKey)) {
                state.items.allIds.push(uniqueKey);
              }
            });
          }

          processChildOrders(state, source_order);
        }
      });
  },
});

export const {
  addToCart,
  addCustomToCart,
  removeFromCart,
  updateQuantity,
  updateItemNote,
  setOrderType,
  setTableId,
  setOrderNote,
  setGuestCount,
  clearCart,
  startNewOrder,
  updateOrderFromSocket
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
