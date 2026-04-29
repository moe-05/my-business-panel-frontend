import type { Role } from "@/interfaces/entities/Role.interface";
import type { TenantInfoResponse } from "./TenantInfoResponse.interface";

export interface CurrentUserResponse {
  user_id: string;
  email: string;
  role: Role;
  tenant: TenantInfoResponse;
}
