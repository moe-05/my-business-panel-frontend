import { redirect } from "react-router-dom";
import { UnauthorizedError } from "@/api/errors/UnauthorizedError";

/**
 * Wrapper para loaders que llaman a authApi.getCurrentUser().
 * Si ocurre UnauthorizedError, redirige automáticamente a /auth/login.
 * Para otros errores, los propaga normalmente para que React Router los maneje.
 */
export async function withAuthCheck<T>(loaderFn: () => Promise<T>): Promise<T> {
  try {
    return await loaderFn();
  } catch (error) {
    // Si es UnauthorizedError (sesión expirada), redirige a login
    if (error instanceof UnauthorizedError) {
      throw redirect("/auth/login");
    }
    // Re-lanzar otros errores para que React Router los maneje
    throw error;
  }
}
