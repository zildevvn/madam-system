import axios from 'axios';

export const getUsersApi = async (options = {}) => {
    const response = await axios.get('/api/users', { signal: options.signal });
    return response.data;
};

export const getUserByIdApi = async (id) => {
    const response = await axios.get(`/api/users/${id}`);
    return response.data;
};

export const createUserApi = async (userData) => {
    const response = await axios.post('/api/users', userData);
    return response.data;
};

export const updateUserApi = async (id, userData) => {
    if (userData instanceof FormData) {
        userData.append('_method', 'PUT');
        const response = await axios.post(`/api/users/${id}`, userData);
        return response.data;
    }
    const response = await axios.put(`/api/users/${id}`, userData);
    return response.data;
};

export const deleteUserApi = async (id) => {
    const response = await axios.delete(`/api/users/${id}`);
    return response.data;
};

export const updateUserRoleApi = async (id, role) => {
    const response = await axios.put(`/api/users/${id}/role`, { role });
    return response.data;
};
