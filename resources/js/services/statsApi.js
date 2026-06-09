import axios from 'axios';

/**
 * Stats API
 * [WHY] Centralizes all statistical data fetching to maintain Rule 101 (API Layer).
 */
const statsApi = {
    /**
     * getRevenueReport
     * [WHY] Fetches aggregated revenue and expense data.
     */
    getRevenueReport: async (params) => {
        const response = await axios.get('/api/stats/revenue-report', { params });
        return response.data;
    },

    /**
     * getItemStats
     * [WHY] Fetches product-specific performance metrics.
     */
    getItemStats: async (params) => {
        const response = await axios.get('/api/stats/item-stats', { params });
        return response.data;
    },

    /**
     * getEmployeePerformance
     * [WHY] Fetches employee and seller performance statistics.
     */
    getEmployeePerformance: async (params) => {
        const response = await axios.get('/api/stats/employee-performance', { params });
        return response.data;
    },

    /**
     * getReservationStats
     * [WHY] Fetches monthly reservation stats, top companies, and company comparisons.
     */
    getReservationStats: async (params) => {
        const response = await axios.get('/api/stats/reservation-stats', { params });
        return response.data;
    },

    /**
     * getTodayRevenue
     * [WHY] Fetches today's revenue stats.
     */
    getTodayRevenue: async (config = {}) => {
        const response = await axios.get('/api/stats/today-revenue', config);
        return response.data;
    }
};

export default statsApi;
