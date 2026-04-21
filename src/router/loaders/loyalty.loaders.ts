import { loyaltyApi } from "@/api/loyalty.api";

import type { LoyaltyProgram } from "@/interfaces/entities/LoyaltyProgram.interface";

export const getLoyaltyProgramsByTenant = async (
  tenantId: string,
): Promise<LoyaltyProgram[]> => loyaltyApi.getByTenant(tenantId);
