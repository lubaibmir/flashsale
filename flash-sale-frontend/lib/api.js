
import axios from 'axios';

const API_BASE = 'http://localhost:3003/api';

const getUserId = () => {
    let id = localStorage.getItem('mock_user_id');
    if (!id) {
        id = 'user_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('mock_user_id', id);
    }
    return id;
};

const api = axios.create({
    baseURL: API_BASE,
});

api.interceptors.request.use(config => {
    config.headers['x-user-id'] = getUserId();
    return config;
});

export const fetchProducts = () => api.get('/products');
export const fetchProduct = (id) => api.get(`/product/${id}`);
export const checkout = (data) => api.post('/checkout', data);
export const fetchMyOrders = () => api.get('/my-orders');
export const startSale = (productId) => api.post('/start-sale', { productId });
export const fetchAllOrders = () => api.get('/orders');
export const seedInventory = (productId, quantity) => api.post('/seed-inventory', { productId, quantity });

export { getUserId };