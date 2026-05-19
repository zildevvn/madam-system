import axios from 'axios';

export const getUsersApi = async (options = {}) => {
    const response = await axios.get('/api/users', { signal: options.signal });
    return response.data;
};

const buildFormData = (data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
        if (data[key] === null || data[key] === undefined) {
            return;
        }
        if (data[key] instanceof FileList) {
            if (data[key].length > 0) {
                formData.append(key, data[key][0]);
            }
        } else if (data[key] instanceof File) {
            formData.append(key, data[key]);
        } else {
            formData.append(key, data[key]);
        }
    });
    return formData;
};

export const createUserApi = async (userData) => {
    const hasFiles = Object.values(userData).some(val => val instanceof File || val instanceof FileList);
    if (hasFiles) {
        const formData = buildFormData(userData);
        const response = await axios.post('/api/users', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    }
    const response = await axios.post('/api/users', userData);
    return response.data;
};

export const updateUserApi = async (id, userData) => {
    const hasFiles = Object.values(userData).some(val => val instanceof File || val instanceof FileList);
    if (hasFiles) {
        const formData = buildFormData(userData);
        formData.append('_method', 'PUT');
        const response = await axios.post(`/api/users/${id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
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

export const getDayOffsApi = async (userId) => {
    const response = await axios.get(`/api/users/${userId}/day-offs`);
    return response.data;
};

export const storeDayOffApi = async (userId, dayOffData) => {
    const response = await axios.post(`/api/users/${userId}/day-offs`, dayOffData);
    return response.data;
};

export const deleteDayOffApi = async (id) => {
    const response = await axios.delete(`/api/day-offs/${id}`);
    return response.data;
};
