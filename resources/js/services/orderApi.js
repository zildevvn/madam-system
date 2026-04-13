import axios from 'axios';

const orderApi = {
  getActiveOrder: async (tableId) => {
    const response = await axios.get(`/api/tables/${tableId}/active-order`);
    return response.data;
  },
  createOrder: async (data) => {
    const response = await axios.post('/api/orders', data);
    return response.data;
  },
  checkoutOrder: async (orderId, items, mergedTables = null, tableId = null) => {
    const response = await axios.post(`/api/orders/${orderId}/checkout`, {
      items,
      merged_tables: mergedTables,
      table_id: tableId, // [WHY] Passed when paying extras for a single table inside a shared group order.
                         // Scopes orphan cleanup on the backend to avoid deleting sibling tables' items.
    });
    return response.data;
  },
  cancelOrder: async (orderId) => {
    const response = await axios.delete(`/api/orders/${orderId}`);
    return response.data;
  },
  updateOrderTable: async (orderId, tableId) => {
    const response = await axios.put(`/api/orders/${orderId}/table`, { table_id: tableId });
    return response.data;
  },
  updateItemStatus: async (itemId, status) => {
    const response = await axios.put(`/api/order-items/${itemId}/status`, { status });
    return response.data;
  },
  completeOrder: async (orderId, paymentMethod, discountType = null, discountValue = 0) => {
    const response = await axios.post(`/api/orders/${orderId}/complete`, {
      payment_method: paymentMethod,
      discount_type: discountType,
      discount_value: discountValue
    });
    return response.data;
  },
  printDrinks: async (orderId, title) => {
    const response = await axios.post(`/api/orders/${orderId}/print-drinks`, { title });
    return response.data;
  }
};

export default orderApi;
