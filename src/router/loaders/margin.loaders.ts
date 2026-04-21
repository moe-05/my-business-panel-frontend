import { marginApi } from "@/api/margin.api";

import type { Margin } from "@/interfaces/entities/Margin.interface";
import type { MarginsListResponse } from "@/interfaces/api/responses/MarginsListResponse.interface";

export const getMarginsByTenant = async (tenantId: string): Promise<Margin[]> =>
  marginApi.listByTenant(tenantId);

export const getMarginsList = async (
  tenantId: string,
): Promise<MarginsListResponse> => marginApi.list(tenantId);
