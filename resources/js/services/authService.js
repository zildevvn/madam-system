import axios from 'axios';

export const loginApi = async (credentials) => {
    const response = await axios.post('/api/login', credentials, {
        headers: {
            'Content-Type': 'application/json'
        }
    });
    return response.data;
};
