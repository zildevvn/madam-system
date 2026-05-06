import axios from 'axios';

export const getSystemMessagesApi = async (userId) => {
    const response = await axios.get('/api/system-messages', {
        params: { user_id: userId }
    });
    return response.data;
};

export const createSystemMessageApi = async (messageData) => {
    const response = await axios.post('/api/system-messages', messageData);
    return response.data;
};

export const markSystemMessageAsReadApi = async (messageId, userId) => {
    const response = await axios.post(`/api/system-messages/${messageId}/read`, {
        user_id: userId
    });
    return response.data;
};
