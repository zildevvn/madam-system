import axios from 'axios';

export const getLeaveRequestsApi = async (userId = null, options = {}) => {
    const url = userId ? `/api/leave-requests?user_id=${userId}` : '/api/leave-requests';
    const response = await axios.get(url, { signal: options.signal });
    return response.data;
};

export const createLeaveRequestApi = async (leaveData) => {
    const response = await axios.post('/api/leave-requests', leaveData);
    return response.data;
};

export const updateLeaveStatusApi = async (id, statusData) => {
    const response = await axios.put(`/api/leave-requests/${id}/status`, statusData);
    return response.data;
};

export const deleteLeaveRequestApi = async (id) => {
    const response = await axios.delete(`/api/leave-requests/${id}`);
    return response.data;
};
