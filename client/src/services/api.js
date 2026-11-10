import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add Authorization Token Header to requests
api.interceptors.request.use(
  (config) => {
    const adminToken = localStorage.getItem('adminToken');
    const userToken = localStorage.getItem('token');

    // Prefer adminToken for admin endpoints, fallback to userToken
    if (config.url && config.url.includes('/admin')) {
      const activeToken = adminToken || userToken;
      if (activeToken) {
        config.headers.Authorization = `Bearer ${activeToken}`;
      }
    } else {
      const activeToken = userToken || adminToken;
      if (activeToken) {
        config.headers.Authorization = `Bearer ${activeToken}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Global Response Interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (error.config && error.config.url && error.config.url.includes('/admin')) {
        localStorage.removeItem('adminToken');
      } else {
        localStorage.removeItem('token');
      }
    }
    return Promise.reject(error.response?.data || { message: error.message });
  }
);

export default api;
