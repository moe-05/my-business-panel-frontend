import { subscriptionApi } from "@/api/subscription.api";

import type { NewSubscriptionRequest } from "@/interfaces/api/requests/NewSubscriptionRequest";
import type { NewSubscriptionResponse } from "@/interfaces/api/responses/NewSubscriptionResponse";

export const createSubscription = async (
  data: NewSubscriptionRequest,
): Promise<NewSubscriptionResponse> => subscriptionApi.create(data);
