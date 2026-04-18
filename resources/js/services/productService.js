import axios from 'axios';

const productService = {
    getProducts: async () => {
        const response = await axios.get('/api/products');
        return response.data;
    },
    createProduct: async (data) => {
        const response = await axios.post('/api/products', data);
        return response.data;
    },
    updateProduct: async (id, data) => {
        const response = await axios.put(`/api/products/${id}`, data);
        return response.data;
    },
    deleteProduct: async (id) => {
        const response = await axios.delete(`/api/products/${id}`);
        return response.data;
    }
};

export default productService;
