import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api/v1',
  withCredentials: true, // JWT llega como httpOnly cookie
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor: normaliza errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message: string =
      error.response?.data?.message ??
      error.response?.data?.error ??
      error.message ??
      'Error inesperado';
    return Promise.reject(new Error(message));
  },
);

export default api;
