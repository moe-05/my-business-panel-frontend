import type { IRegion } from "../../api/types/auth";
import { regionService } from "../../api/regionService";

export type SetupTenantPageLoaderData = {
  regions: IRegion[];
  regionsError: string;
};

export const getSetupTenantData =
  async (): Promise<SetupTenantPageLoaderData> => {
    try {
      const regions: IRegion[] = await regionService.getAll();
      return { regions, regionsError: "" };
    } catch {
      return {
        regions: [],
        regionsError:
          "No se pudieron cargar las regiones. Por favor, recarga la página.",
      };
    }
  };
