import axios from 'axios';

// Cliente axios para endpoints públicos (sin credenciales/cookies)
const publicApi = axios.create({
  baseURL: 'http://localhost:3000/api/v1',
  withCredentials: false, // No enviar cookies/JWT para endpoints públicos
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor: normaliza errores
publicApi.interceptors.response.use(
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

export default publicApi;
