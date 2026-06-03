import axios from 'axios';

const partnerCompanyService = {
  getAllPartnerCompanies: async (params = {}) => {
    const response = await axios.get('/api/partner-companies', { params });
    return response.data;
  },
  createPartnerCompany: async (data) => {
    const response = await axios.post('/api/partner-companies', data);
    return response.data;
  },
  updatePartnerCompany: async (id, data) => {
    const response = await axios.put(`/api/partner-companies/${id}`, data);
    return response.data;
  },
  deletePartnerCompany: async (id) => {
    const response = await axios.delete(`/api/partner-companies/${id}`);
    return response.data;
  }
};

export default partnerCompanyService;
