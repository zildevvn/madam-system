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
    }
};

export default statsApi;
