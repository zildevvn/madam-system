import axios from 'axios';

const API_URL = '/api/expenses';

export const getExpensesApi = () => {
    return axios.get(API_URL);
};

export const createExpenseApi = (data) => {
    return axios.post(API_URL, data);
};

export const updateExpenseApi = (id, data) => {
    return axios.put(`${API_URL}/${id}`, data);
};

export const deleteExpenseApi = (id) => {
    return axios.delete(`${API_URL}/${id}`);
};
