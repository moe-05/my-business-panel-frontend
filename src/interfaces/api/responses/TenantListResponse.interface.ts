import type { Tenant } from "@/interfaces/entities/Tenant.interface";

export interface TenantListResponse {
  tenants: Tenant[];
  total: number;
  page: number;
  limit: number;
}
