import { authApi } from "@/api/auth.api";
import { branchApi } from "@/api/branch.api";
import { customerApi } from "@/api/customer.api";
import { productApi } from "@/api/product.api";
import { saleApi } from "@/api/sale.api";

import type { Branch } from "@/interfaces/entities/Branch.interface";
import type { Product } from "@/interfaces/entities/Product.interface";
import type { Customer } from "@/interfaces/entities/Customer.interface";
import type { CurrentUserResponse } from "@/interfaces/api/responses/CurrentUserResponse.interface";
import type { PaginatedResponse } from "@/interfaces/api/responses/PaginatedResponse.interface";
import type {
  SaleCondition,
  SaleListItem,
} from "@/interfaces/entities/Sale.interface";

export const SALES_PAGE_LIMIT = 100;

export interface CreateSalePageLoaderData {
  currentUser: CurrentUserResponse | null;
  branches: Branch[];
  saleConditions: SaleCondition[];
  initialProducts: Product[];
  initialCustomers: Customer[];
}

export const getCreateSalePageData =
  async (): Promise<CreateSalePageLoaderData> => {
    const currentUser = await authApi.getCurrentUser();
    const tenantId = currentUser?.tenant?.tenant_id;

    const [branchesRes, conditionsRes, productsRes, customersRes] =
      await Promise.all([
        tenantId
          ? branchApi.listByTenant(tenantId, 1, 200)
          : Promise.resolve({ branches: [], total: 0, page: 1, limit: 200 }),
        saleApi.getSaleConditions().catch(() => []),
        tenantId
          ? productApi.listByTenant(tenantId, 1, 100)
          : Promise.resolve({ products: [], total: 0, page: 1, limit: 100 }),
        tenantId
          ? customerApi.listByTenant(tenantId, 1, 100)
          : Promise.resolve({
              customers: [],
              total: 0,
              page: 1,
              limit: 100,
            }),
      ]);

    return {
      currentUser,
      branches: branchesRes.branches ?? [],
      saleConditions: conditionsRes ?? [],
      initialProducts: productsRes.products ?? [],
      initialCustomers: customersRes.customers ?? [],
    };
  };

export interface SalesHistoryPageLoaderData {
  currentUser: CurrentUserResponse | null;
  branches: Branch[];
  initialSales: PaginatedResponse<SaleListItem>;
  initialBranchId: string;
}

export const getSalesHistoryPageData =
  async (): Promise<SalesHistoryPageLoaderData> => {
    const currentUser = await authApi.getCurrentUser();
    const tenantId = currentUser?.tenant?.tenant_id;

    const branchesRes = tenantId
      ? await branchApi.listByTenant(tenantId, 1, 200)
      : { branches: [], total: 0, page: 1, limit: 200 };

    const branches = branchesRes.branches ?? [];
    const initialBranchId = branches[0]?.branch_id ?? "";

    const initialSales = initialBranchId
      ? await saleApi
          .listByBranch(initialBranchId, 1, SALES_PAGE_LIMIT)
          .catch(
            (): PaginatedResponse<SaleListItem> => ({
              results: [],
              total: 0,
              page: 1,
              limit: SALES_PAGE_LIMIT,
            }),
          )
      : ({
          results: [],
          total: 0,
          page: 1,
          limit: SALES_PAGE_LIMIT,
        } as PaginatedResponse<SaleListItem>);

    return { currentUser, branches, initialSales, initialBranchId };
  };

export const getSalesByBranch = async (
  branchId: string,
  page = 1,
  limit = SALES_PAGE_LIMIT,
): Promise<PaginatedResponse<SaleListItem>> =>
  saleApi.listByBranch(branchId, page, limit);
