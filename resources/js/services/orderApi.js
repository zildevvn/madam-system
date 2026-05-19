import axios from 'axios';

/**
 * orderApi
 * [WHY] Centralized API service for Order resource.
 * [RULE] Follows a consistent Action-based REST contract.
 */
const orderApi = {
    // --- QUERIES ---
    fetchActiveOrder: async (tableId) => {
        const response = await axios.get(`/api/tables/${tableId}/active-order`);
        return response.data;
    },
    fetchHistory: async (limit = 20, config = {}) => {
        const response = await axios.get(`/api/orders/history?limit=${limit}`, config);
        return response.data;
    },

    // --- LIFECYCLE ---
    create: async (data) => {
        const response = await axios.post('/api/orders', data);
        return response.data;
    },
    cancel: async (orderId, data = {}) => {
        const response = await axios.delete(`/api/orders/${orderId}`, { data });
        return response.data;
    },

    // --- WORKFLOW ACTIONS ---
    checkout: async (orderId, payload) => {
        const response = await axios.post(`/api/orders/${orderId}/checkout`, payload);
        return response.data;
    },
    complete: async (orderId, payload) => {
        const response = await axios.post(`/api/orders/${orderId}/complete`, payload);
        return response.data;
    },
    reopen: async (orderId) => {
        const response = await axios.post(`/api/orders/${orderId}/reopen`);
        return response.data;
    },
    split: async (orderId, items) => {
        const response = await axios.post(`/api/orders/${orderId}/split`, { items });
        return response.data;
    },

    // --- FIELD UPDATES ---
    updateTable: async (orderId, tableId) => {
        const response = await axios.put(`/api/orders/${orderId}/table`, { table_id: tableId });
        return response.data;
    },
    updateNote: async (orderId, note) => {
        const response = await axios.patch(`/api/orders/${orderId}/note`, { order_note: note });
        return response.data;
    },
    updateGuestCount: async (orderId, count) => {
        const response = await axios.patch(`/api/orders/${orderId}/guest-count`, { guest_count: count });
        return response.data;
    },
    updatePayment: async (orderId, data) => {
        const response = await axios.patch(`/api/orders/${orderId}/payment`, data);
        return response.data;
    },

    // --- SUB-RESOURCES ---
    updateItemStatus: async (itemId, status) => {
        const response = await axios.put(`/api/order-items/${itemId}/status`, { status });
        return response.data;
    },

    // --- SYSTEM ---
    print: async (orderId, title) => {
        const response = await axios.post(`/api/orders/${orderId}/print-drinks`, { title });
        return response.data;
    }
};

export default orderApi;
