import axios from 'axios';

// Connect directly to Flask backend at 127.0.0.1:5000 to avoid Node.js IPv6 ::1 proxy mismatch on Windows
const API_BASE = 'http://127.0.0.1:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' }
});

export const dashboardAPI = {
  getData: (params) => api.get('/dashboard', { params }),
};

export const recordsAPI = {
  getAll: (params) => api.get('/food-records', { params }),
  getOne: (id) => api.get(`/food-records/${id}`),
  create: (data) => api.post('/food-records', data),
  update: (id, data) => api.put(`/food-records/${id}`, data),
  delete: (id) => api.delete(`/food-records/${id}`),
};

export const analyticsAPI = {
  getWaste: (params) => api.get('/analytics/waste', { params }),
  getCategory: (params) => api.get('/analytics/category', { params }),
  getMeal: (params) => api.get('/analytics/meal', { params }),
  getTrends: (params) => api.get('/analytics/trends', { params }),
};

export const predictionAPI = {
  predict: (data) => api.post('/predict', data),
  getMetrics: () => api.get('/predict/metrics'),
  getItems: () => api.get('/predict/items'),
};

export const recommendationAPI = {
  getAll: (params) => api.get('/recommendations', { params }),
  getPreparation: () => api.get('/recommendations/preparation'),
};

export const sparkAPI = {
  process: () => api.post('/spark/process'),
  getStatus: () => api.get('/spark/status'),
  getResults: () => api.get('/spark/results'),
};

export const reportAPI = {
  download: (params) => api.get('/reports', { params, responseType: 'blob' }),
};

export default api;
