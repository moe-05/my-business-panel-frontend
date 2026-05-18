/**
 * Error lanzado cuando ocurre un 401 (Unauthorized)
 * Usado para manejar redirecciones a login de forma centralizada
 */
export class UnauthorizedError extends Error {
  public readonly isUnauthorized = true;

  constructor(message: string = "Sesión expirada") {
    super(message);
    this.name = "UnauthorizedError";

    // Mantener la cadena de prototipos correcta para instanceof
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}
