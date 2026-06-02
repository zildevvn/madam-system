import axios from 'axios';

/**
 * Attendance API Service
 * [WHY] Handles all backend communications relating to the attendance module.
 */
export const attendanceApi = {
    getAttendances: (date, config = {}) => axios.get(`/api/attendances?date=${date}`, config).then(res => res.data),
    saveAttendance: (payload) => axios.post('/api/attendances', payload).then(res => res.data),
    deleteAttendance: (id) => axios.delete(`/api/attendances/${id}`).then(res => res.data),
    approveRequest: (id) => axios.post(`/api/attendances/${id}/approve`).then(res => res.data),
    rejectRequest: (id) => axios.post(`/api/attendances/${id}/reject`).then(res => res.data),
    requestCheckout: () => axios.post('/api/attendances/request-checkout').then(res => res.data),
    requestCheckIn: () => axios.post('/api/attendances/request-checkin').then(res => res.data),
};
