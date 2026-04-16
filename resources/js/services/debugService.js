import axios from 'axios';

/**
 * debugService: Service for system diagnostics and testing.
 */
const debugService = {
    /**
     * testPrinterApi: Triggers a test print job to check connection.
     */
    testPrinterApi: async () => {
        const response = await axios.get('/api/debug/printer');
        return response.data;
    },

    /**
     * testBroadcastApi: Triggers a test event broadcast to check Echo/Pusher connection.
     */
    testBroadcastApi: async () => {
        const response = await axios.get('/api/debug/broadcast');
        return response.data;
    }
};

export default debugService;
