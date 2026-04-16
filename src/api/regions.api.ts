import { url } from ".";
import type { IRegion } from "./interfaces/IRegion";

export const regionsApi = {
  getRegions: async (): Promise<IRegion[]> => {
    const response = await fetch(`${url}/regions`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) throw new Error("Failed to fetch regions");
    const json = await response.json();
    return json.data;
  },
};
