import axios from 'axios';

// Backend runs on port 5002 as configured in backend/.env
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Inject stored JWT token in request headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('trendbite_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercept 401 errors to clean session data
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('trendbite_token');
      localStorage.removeItem('trendbite_user');
      // If unauthorized, redirect to login page (unless we're already on auth pages)
      const path = window.location.pathname;
      if (path !== '/login' && path !== '/signup' && path !== '/forgot-password') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
