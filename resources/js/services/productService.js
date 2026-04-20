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
        // [WHY] Laravel has issues parsing multipart/form-data with PUT request.
        // We use POST with _method=PUT to bypass this.
        if (data instanceof FormData) {
            data.append('_method', 'PUT');
            const response = await axios.post(`/api/products/${id}`, data);
            return response.data;
        }
        
        const response = await axios.put(`/api/products/${id}`, data);
        return response.data;
    },
    deleteProduct: async (id) => {
        const response = await axios.delete(`/api/products/${id}`);
        return response.data;
    }
};

export default productService;
