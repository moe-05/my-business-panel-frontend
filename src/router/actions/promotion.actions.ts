import { promotionApi } from "@/api/promotion.api";

import type { CreatePromotionRequest } from "@/interfaces/api/requests/CreatePromotionRequest.interface";
import type { UpdatePromotionRequest } from "@/interfaces/api/requests/UpdatePromotionRequest.interface";

export const createPromotion = (
  data: CreatePromotionRequest,
): Promise<{ message: string }> => promotionApi.create(data);

export const updatePromotion = (
  promotionId: string,
  data: UpdatePromotionRequest,
): Promise<{ message: string }> => promotionApi.update(promotionId, data);

export const deletePromotion = (
  promotionId: string,
): Promise<{ message: string }> => promotionApi.delete(promotionId);
