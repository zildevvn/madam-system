import axios from 'axios';

/**
 * orderExportApi
 * [WHY] Centralizes all order-export data fetching to maintain Rule 101 (API Layer).
 */
const orderExportApi = {
    /**
     * getOrders
     * [WHY] Fetches filtered orders for the preview table.
     */
    getOrders: async (params, config = {}) => {
        const response = await axios.get('/api/order-export', { params, ...config });
        return response.data;
    },

    /**
     * getCashiers
     * [WHY] Fetches list of cashiers who have completed at least one order.
     */
    getCashiers: async (config = {}) => {
        const response = await axios.get('/api/order-export/cashiers', config);
        return response.data;
    },

    /**
     * buildExportUrl
     * [WHY] Constructs the CSV download URL with all active filter params.
     * Uses native browser download via window.location — avoids Blob memory limits for large files.
     */
    buildExportUrl: (params) => {
        const url = new URL('/api/order-export/export', window.location.origin);
        Object.entries(params).forEach(([k, v]) => {
            if (v !== '' && v !== null && v !== undefined) {
                url.searchParams.set(k, v);
            }
        });
        return url.toString();
    }
};

export default orderExportApi;
