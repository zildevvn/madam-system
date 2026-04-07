import axios from 'axios';

const productService = {
    getProducts: async () => {
        const response = await axios.get('/api/products');
        return response.data;
    }
};

export default productService;
