import axios from 'axios';

export const getUsersApi = async () => {
    const response = await axios.get('/api/users');
    return response.data;
};

export const createUserApi = async (userData) => {
    const response = await axios.post('/api/users', userData);
    return response.data;
};

export const updateUserApi = async (id, userData) => {
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
