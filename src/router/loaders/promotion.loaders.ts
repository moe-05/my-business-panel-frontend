import { authApi } from "@/api/auth.api";
import { promotionApi } from "@/api/promotion.api";
import { segmentApi } from "@/api/segment.api";

import type {
  Promotion,
  PromotionType,
} from "@/interfaces/entities/Promotion.interface";
import type { Segment } from "@/interfaces/entities/Segment.interface";

export interface PromotionsPageLoaderData {
  promotions: Promotion[];
  promotionTypes: PromotionType[];
  segments: Segment[];
  tenantId: string;
}

export const getPromotionsPageData =
  async (): Promise<PromotionsPageLoaderData> => {
    const currentUser = await authApi.getCurrentUser();
    const tenantId = currentUser?.tenant?.tenant_id ?? "";

    const [promotions, promotionTypes, segments] = await Promise.all([
      tenantId
        ? promotionApi.getByTenant(tenantId).catch(() => [])
        : Promise.resolve<Promotion[]>([]),
      promotionApi.getTypes().catch(() => []),
      segmentApi.getAll().catch(() => []),
    ]);

    return { promotions, promotionTypes, segments, tenantId };
  };

export const getPromotionsByTenant = (tenantId: string): Promise<Promotion[]> =>
  promotionApi.getByTenant(tenantId);

export const getPromotionTypes = (): Promise<PromotionType[]> =>
  promotionApi.getTypes();
