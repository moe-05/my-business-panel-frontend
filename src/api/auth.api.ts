import { url } from ".";

import type { ApiResponse } from "@/interfaces/api/ApiResponse.interface";
import type { LoginRequest } from "@/interfaces/api/requests/LoginRequest.interface";
import type { ChangePasswordRequest } from "@/interfaces/api/requests/ChangePasswordRequest.interface";
import type { LoginResponse } from "@/interfaces/api/responses/LoginResponse.interface";
import type { CurrentUserResponse } from "@/interfaces/api/responses/CurrentUserResponse.interface";

export const authApi = {
  async login(data: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await fetch(`${url}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      const json: ApiResponse<LoginResponse> = await response.json();

      if (!response.ok) {
        throw new Error(json.message || "Error al iniciar sesión");
      }

      return json.data;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Error al iniciar sesión",
      );
    }
  },

  async logout(): Promise<void> {
    try {
      await fetch(`${url}/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Error al cerrar sesión",
      );
    }
  },

  async getCurrentUser(): Promise<CurrentUserResponse> {
    try {
      const response = await fetch(`${url}/user`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      const json: ApiResponse<CurrentUserResponse> = await response.json();
      return json.data;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Error al obtener el usuario",
      );
    }
  },

  async changePassword(
    data: ChangePasswordRequest,
  ): Promise<{ message: string }> {
    try {
      const response = await fetch(`${url}/auth/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          current_password: data.currentPassword,
          new_password: data.newPassword,
        }),
      });

      const json: ApiResponse<{ message: string }> = await response.json();
      return json.data;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Error al cambiar contraseña",
      );
    }
  },

};
