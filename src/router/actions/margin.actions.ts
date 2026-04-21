import { marginApi } from "@/api/margin.api";

import type { CreateMarginRequest } from "@/interfaces/api/requests/CreateMarginRequest.interface";
import type { Margin } from "@/interfaces/entities/Margin.interface";

export const createMargin = async (
  data: CreateMarginRequest,
): Promise<Margin> => marginApi.create(data);

export const updateMargin = async (
  marginId: string,
  marginPercentage: number,
): Promise<Margin> => marginApi.update(marginId, marginPercentage);

export const deleteMargin = async (
  marginId: string,
): Promise<{ message: string }> => marginApi.delete(marginId);
