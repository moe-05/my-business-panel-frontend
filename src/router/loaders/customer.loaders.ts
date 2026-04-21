import { customerApi } from "@/api/customer.api";

import type { Customer } from "@/interfaces/entities/Customer.interface";
import type { CustomersListResponse } from "@/interfaces/api/responses/CustomersListResponse.interface";

export const getAllCustomers = async (
  page = 1,
  limit = 100,
): Promise<CustomersListResponse> => customerApi.listAll(page, limit);

export const getCustomersByTenant = async (
  tenantId: string,
  page = 1,
  limit = 100,
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
  limit = 100,
): Promise<CustomersListResponse> =>
  customerApi.search(tenantId, query, page, limit);

export const getCustomersBySegment = async (
  tenantId: string,
  segmentId: string,
  page = 1,
  limit = 100,
): Promise<CustomersListResponse> =>
  customerApi.filterBySegment(tenantId, segmentId, page, limit);
