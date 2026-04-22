import { customerApi } from "@/api/customer.api";
import { authApi } from "@/api/auth.api";
import { segmentApi } from "@/api/segment.api";
import { tenantApi } from "@/api/tenant.api";

import type { Customer } from "@/interfaces/entities/Customer.interface";
import type { CustomersListResponse } from "@/interfaces/api/responses/CustomersListResponse.interface";
import type { Segment } from "@/interfaces/entities/Segment.interface";
import type { Tenant } from "@/interfaces/entities/Tenant.interface";

export const CUSTOMERS_PAGE_LIMIT = 20;

export type CustomersPageLoaderData = {
  initialCustomers: CustomersListResponse;
  segments: Segment[];
  tenants: Tenant[];
};

export const getCustomersPageData =
  async (): Promise<CustomersPageLoaderData> => {
    const currentUser = await authApi.getCurrentUser();
    const isSuperAdmin = currentUser?.role.role_id === 1;
    const tenantId = currentUser?.tenant.tenant_id;

    const [initialCustomers, segments] = await Promise.all([
      isSuperAdmin
        ? customerApi.listAll(1, CUSTOMERS_PAGE_LIMIT)
        : tenantId
          ? customerApi.listByTenant(tenantId, 1, CUSTOMERS_PAGE_LIMIT)
          : {
              customers: [],
              total: 0,
              page: 1,
              limit: CUSTOMERS_PAGE_LIMIT,
            },
      segmentApi.getAll(),
    ]);

    let tenants: Tenant[] = [];
    if (isSuperAdmin) {
      const tenantsResult = await tenantApi.getAll(1, 200);
      tenants = tenantsResult.tenants;
    }

    return { initialCustomers, segments, tenants };
  };

export const getAllCustomers = async (
  page = 1,
  limit = CUSTOMERS_PAGE_LIMIT,
): Promise<CustomersListResponse> => customerApi.listAll(page, limit);

export const getCustomersByTenant = async (
  tenantId: string,
  page = 1,
  limit = CUSTOMERS_PAGE_LIMIT,
): Promise<CustomersListResponse> =>
  customerApi.listByTenant(tenantId, page, limit);

export const getCustomerById = async (customerId: string): Promise<Customer> =>
  customerApi.getById(customerId);

export const getCustomerByDocNumber = async (
  docNumber: string,
): Promise<Customer> => customerApi.getByDocNumber(docNumber);

export const searchCustomers = async (
  tenantId: string,
  query: string,
  page = 1,
  limit = CUSTOMERS_PAGE_LIMIT,
): Promise<CustomersListResponse> =>
  customerApi.search(tenantId, query, page, limit);

export const getCustomersBySegment = async (
  tenantId: string,
  segmentId: string,
  page = 1,
  limit = CUSTOMERS_PAGE_LIMIT,
): Promise<CustomersListResponse> =>
  customerApi.filterBySegment(tenantId, segmentId, page, limit);
