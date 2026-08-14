import axios from 'axios';
window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
window.axios.defaults.withCredentials = true;

window.axios.interceptors.request.use((config) => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
        try {
            const user = JSON.parse(storedUser);
            if (user && user.token) {
                config.headers['Authorization'] = 'Bearer ' + user.token;
            }
        } catch (e) {
            console.error('Failed to parse user from localStorage', e);
        }
    }
    return config;
});

// Automatically logout when backend rejects the session token (password changed elsewhere)
window.axios.interceptors.response.use(
    response => response,
    error => {
        if (error.response && error.response.status === 401) {
            const storedUser = localStorage.getItem('user');
            if (storedUser && window.location.pathname !== '/login') {
                localStorage.removeItem('user');
                if (window.Echo) {
                    window.Echo.disconnect();
                }
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

window.Echo = new Echo({
    broadcaster: 'pusher',
    key: import.meta.env.VITE_PUSHER_APP_KEY,
    cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER,
    forceTLS: true,
    enabledTransports: ['ws', 'wss'],
});

