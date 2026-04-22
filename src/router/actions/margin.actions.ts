import { marginApi } from "@/api/margin.api";

import type { CreateMarginRequest } from "@/interfaces/api/requests/CreateMarginRequest.interface";

type UpdateMarginRequest = Partial<
  Pick<
    CreateMarginRequest,
    "spending_threshold" | "seniority_months" | "frequency_per_month"
  >
>;

export const createMargin = async (
  data: CreateMarginRequest,
): Promise<{ message: string }> => marginApi.create(data);

export const updateMargin = async (
  marginId: string,
  data: UpdateMarginRequest,
): Promise<{ message: string }> => marginApi.update(marginId, data);

export const deleteMargin = async (
  marginId: string,
): Promise<{ message: string }> => marginApi.delete(marginId);
