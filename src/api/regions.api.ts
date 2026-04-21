import { url } from ".";
import type { Region } from "@/interfaces/entities/Region.interface";

export const regionsApi = {
  getRegions: async (): Promise<Region[]> => {
    const response = await fetch(`${url}/region`, {
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
