import { authApi } from "@/api/auth.api";
import { productGroupApi, productGroupTypeApi } from "@/api/productGroup.api";
import { royaltyApi } from "@/api/royalty.api";
import type {
  TenantProductGroup,
  TenantProductGroupType,
} from "@/interfaces/entities/ProductGroup.interface";
import type { RoyaltyRule } from "@/interfaces/entities/Royalty.interface";

export interface RoyaltiesPageLoaderData {
  rules: RoyaltyRule[];
  productGroups: TenantProductGroup[];
  productGroupTypes: TenantProductGroupType[];
  tenantId: string;
}

export const getRoyaltiesPageData = async (): Promise<RoyaltiesPageLoaderData> => {
  const user = await authApi.getCurrentUser();
  const tenantId = user?.tenant?.tenant_id ?? "";

  const [rules, productGroups, productGroupTypes] = await Promise.all([
    tenantId ? royaltyApi.listRules(tenantId) : Promise.resolve([]),
    tenantId ? productGroupApi.listByTenant(tenantId) : Promise.resolve([]),
    tenantId ? productGroupTypeApi.listByTenant(tenantId) : Promise.resolve([]),
  ]);

  return { rules, productGroups, productGroupTypes, tenantId };
};
