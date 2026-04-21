import { regionsApi } from "@/api/regions.api";

import type { Region } from "@/interfaces/entities/Region.interface";

export type RegionLoaderData = {
  regions: Region[];
  regionsError: string;
};

export const getRegions = async (): Promise<RegionLoaderData> => {
  const regions = await regionsApi.getRegions();
  return { regions, regionsError: "" };
};
