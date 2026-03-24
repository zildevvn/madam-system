import axios from 'axios';

const tableService = {
  getAllTables: async () => {
    const response = await axios.get('/api/tables');
    return response.data;
  },
  lockTable: async (id) => {
    const response = await axios.post(`/api/tables/${id}/lock`);
    return response.data;
  },
  confirmOrder: async (id) => {
    const response = await axios.post(`/api/tables/${id}/confirm-order`);
    return response.data;
  },
  unlockTable: async (id) => {
    const response = await axios.post(`/api/tables/${id}/unlock`);
    return response.data;
  }
};

export default tableService;
