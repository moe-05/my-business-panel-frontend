import type { TenantInfoResponse } from "../api/responses/TenantInfoResponse.interface";
import type { Role } from "./Role.interface";

export interface User {
  user_id: string;
  email: string;
  role_id: number;
  role?: Role;
  tenant_id: string;
  tenant?: TenantInfoResponse;
  first_name?: string;
  last_name?: string;
  created_at: string;
  updated_at: string;
}
