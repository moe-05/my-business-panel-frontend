import { haciendaApi } from "@/api/hacienda.api";

import type { HaciendaConfigStatus } from "@/interfaces/api/responses/HaciendaConfigStatus.interface";

export const getHaciendaStatus = async (
  tenantId: string,
): Promise<HaciendaConfigStatus> => haciendaApi.getStatus(tenantId);
