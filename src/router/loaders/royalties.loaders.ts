import { authApi } from "@/api/auth.api";
import { productGroupApi } from "@/api/productGroup.api";
import { royaltyApi } from "@/api/royalty.api";
import type { TenantProductGroup } from "@/interfaces/entities/ProductGroup.interface";
import type { RoyaltyRule } from "@/interfaces/entities/Royalty.interface";

export interface RoyaltiesPageLoaderData {
  rules: RoyaltyRule[];
  productGroups: TenantProductGroup[];
  tenantId: string;
}

export const getRoyaltiesPageData = async (): Promise<RoyaltiesPageLoaderData> => {
  const user = await authApi.getCurrentUser();
  const tenantId = user?.tenant?.tenant_id ?? "";

  const [rules, productGroups] = await Promise.all([
    tenantId ? royaltyApi.listRules(tenantId) : Promise.resolve([]),
    tenantId ? productGroupApi.listByTenant(tenantId) : Promise.resolve([]),
  ]);

  return { rules, productGroups, tenantId };
};
