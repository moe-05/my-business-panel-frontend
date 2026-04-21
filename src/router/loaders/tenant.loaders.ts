import { tenantApi } from "@/api/tenant.api";

import type { Tenant } from "@/interfaces/entities/Tenant.interface";
import type { TenantListResponse } from "@/interfaces/api/responses/TenantListResponse.interface";
import type { UsersListResponse } from "@/interfaces/api/responses/UsersListResponse.interface";

export const getTenants = async (
  page = 1,
  limit = 20,
): Promise<TenantListResponse> => tenantApi.getAll(page, limit);

export const getTenantById = async (tenantId: string): Promise<Tenant> =>
  tenantApi.getById(tenantId);

export const getTenantUsers = async (
  tenantId: string,
  page = 1,
  limit = 20,
): Promise<UsersListResponse> => tenantApi.getTenantUsers(tenantId, page, limit);

export const searchTenants = async (
  query: string,
  page = 1,
  limit = 20,
): Promise<TenantListResponse> => tenantApi.search(query, page, limit);
