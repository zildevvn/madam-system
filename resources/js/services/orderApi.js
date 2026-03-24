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
  }
};

export default orderApi;
