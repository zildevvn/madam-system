import { configureStore } from '@reduxjs/toolkit';
import tableReducer from './slices/tableSlice';
import productReducer from './slices/productSlice';
import orderReducer from './slices/orderSlice';
import authReducer from './slices/authSlice';
import reservationReducer from './slices/reservationSlice';
import expenseReducer from './slices/expenseSlice';

export const store = configureStore({
  reducer: {
    table: tableReducer,
    product: productReducer,
    order: orderReducer,
    auth: authReducer,
    reservation: reservationReducer,
    expense: expenseReducer,
  },
});

export default store;
