import { haciendaApi } from "@/api/hacienda.api";

import type { HaciendaConfigUpdate } from "@/interfaces/api/requests/HaciendaConfigUpdate.interface";

export const saveHaciendaConfig = async (
  data: HaciendaConfigUpdate,
): Promise<{ tenant_hacienda_config_id: string }> => haciendaApi.save(data);

export const deactivateHaciendaConfig = async (
  tenantId: string,
): Promise<{ deactivated: boolean }> => haciendaApi.deactivate(tenantId);
