import axios from 'axios';

export const getUsersApi = async () => {
    const response = await axios.get('/api/users');
    return response.data;
};

export const updateUserRoleApi = async (id, role) => {
    const response = await axios.put(`/api/users/${id}/role`, { role });
    return response.data;
};
