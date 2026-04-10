import axios from 'axios';

export const reservationApi = {
    getAll: async () => {
        const response = await axios.get('/api/reservations');
        return response.data; // Expected format: { data: [...], message: '...', errors: null }
    },
    getById: async (id) => {
        const response = await axios.get(`/api/reservations/${id}`);
        return response.data;
    },
    create: async (payload) => {
        const response = await axios.post('/api/reservations', payload);
        return response.data;
    },
    update: async (id, payload) => {
        const response = await axios.put(`/api/reservations/${id}`, payload);
        return response.data;
    },
    confirm: async (id, payload) => {
        const response = await axios.post(`/api/reservations/${id}/confirm`, payload);
        return response.data;
    },
    getBill: async (id) => {
        const response = await axios.get(`/api/reservations/${id}/bill`);
        return response.data;
    }
};
