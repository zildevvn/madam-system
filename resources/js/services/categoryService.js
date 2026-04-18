import axios from 'axios';

const categoryService = {
    getCategories: async () => {
        const response = await axios.get('/api/categories');
        return response.data;
    },
    createCategory: async (data) => {
        const response = await axios.post('/api/categories', data);
        return response.data;
    },
    updateCategory: async (id, data) => {
        const response = await axios.put(`/api/categories/${id}`, data);
        return response.data;
    },
    deleteCategory: async (id) => {
        const response = await axios.delete(`/api/categories/${id}`);
        return response.data;
    }
};

export default categoryService;
