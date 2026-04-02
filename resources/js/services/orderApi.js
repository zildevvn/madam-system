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
  checkoutOrder: async (orderId, items) => {
    const response = await axios.post(`/api/orders/${orderId}/checkout`, { items });
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
  }
};

export default orderApi;
