import type { UserSession } from "./UserSession.interface";

export interface LoginResponse {
  message: string;
  user: UserSession;
}
