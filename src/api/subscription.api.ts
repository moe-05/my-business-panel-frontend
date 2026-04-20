import { url } from ".";

import type { ApiResponse } from "@/interfaces/api/ApiResponse.interface";
import type { NewSubscriptionRequest } from "@/interfaces/api/requests/NewSubscriptionRequest.interface";
import type { NewSubscriptionResponse } from "@/interfaces/api/responses/NewSubscriptionResponse.interface";

export const subscriptionApi = {
  async create(data: NewSubscriptionRequest): Promise<NewSubscriptionResponse> {
    try {
      const response = await fetch(`${url}/subscription`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData: ApiResponse<null> = await response.json();
        throw new Error(errorData.message || "Failed to create subscription");
      }

      const json = await response.json();
      return json.data.data;
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to create subscription",
      );
    }
  },
};
