import type { Role } from "@/interfaces/entities/Role.interface";
import type { TenantInfoResponse } from "./TenantInfoResponse.interface";

export interface CurrentUserResponse {
  email: string;
  role: Role;
  tenant: TenantInfoResponse;
}
