import { regionsApi } from "@/api";

import type { RegionResponse } from "@/interfaces/entities/Region.interface";

export type SetupTenantPageLoaderData = {
  regions: RegionResponse[];
  regionsError: string;
};

export const getSetupTenantData =
  async (): Promise<SetupTenantPageLoaderData> => {
    const regions: RegionResponse[] = await regionsApi.getRegions();
    return { regions, regionsError: "" };
  };
