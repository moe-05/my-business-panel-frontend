import axios from "axios";
import { UnauthorizedError } from "./errors/UnauthorizedError";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1",
  withCredentials: true, // JWT llega como httpOnly cookie
  headers: {
    "Content-Type": "application/json",
  },
});

// Response interceptor: normaliza errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si es un 401, lanzar UnauthorizedError para que AuthContext lo maneje
    if (error.response?.status === 401) {
      return Promise.reject(new UnauthorizedError("Sesión expirada"));
    }

    const message: string =
      error.response?.data?.message ??
      error.response?.data?.error ??
      error.message ??
      "Error inesperado";
    return Promise.reject(new Error(message));
  },
);

export default api;
