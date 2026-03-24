import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: {
    byId: {},
    allIds: []
  },
  orderType: 'dine-in',
  tableId: null,
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
    },
    removeFromCart: (state, action) => {
      const id = action.payload;
      delete state.items.byId[id];
      state.items.allIds = state.items.allIds.filter(itemId => itemId !== id);
    },
    updateQuantity: (state, action) => {
      const { id, quantity } = action.payload;
      if (state.items.byId[id]) {
        state.items.byId[id].quantity = quantity;
        if (state.items.byId[id].quantity <= 0) {
          delete state.items.byId[id];
          state.items.allIds = state.items.allIds.filter(itemId => itemId !== id);
        }
      }
    },
    setOrderType: (state, action) => {
      state.orderType = action.payload;
    },
    setTableId: (state, action) => {
      state.tableId = action.payload;
    },
    clearCart: (state) => {
      state.items = { byId: {}, allIds: [] };
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  setOrderType,
  setTableId,
  clearCart
} = orderSlice.actions;

export default orderSlice.reducer;
