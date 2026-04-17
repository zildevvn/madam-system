import axios from 'axios';

export const reservationApi = {
    getAll: async (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.type && params.type !== 'all') queryParams.append('type', params.type);
        if (params.date) queryParams.append('date', params.date);
        if (params.month) queryParams.append('month', params.month);

        const queryString = queryParams.toString();
        const url = queryString ? `/api/reservations?${queryString}` : '/api/reservations';
        const response = await axios.get(url);
        return response.data;
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
