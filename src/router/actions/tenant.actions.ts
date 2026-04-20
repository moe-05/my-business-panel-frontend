import { tenantApi } from "@/api/tenant.api";

import type { NewTenantRequest } from "@/interfaces/api/requests/NewTenantRequest.interface";
import type { Tenant } from "@/interfaces/entities/Tenant.interface";

export const createTenant = async (data: NewTenantRequest): Promise<Tenant> =>
  tenantApi.create(data);
