import { loyaltyApi } from "@/api/loyalty.api";

import type { CreateLoyaltyProgramRequest } from "@/interfaces/api/requests/CreateLoyaltyProgramRequest.interface";
import type { UpdateLoyaltyProgramRequest } from "@/interfaces/api/requests/UpdateLoyaltyProgramRequest.interface";

export const createLoyaltyProgram = async (
  data: CreateLoyaltyProgramRequest,
): Promise<{ message: string }> => loyaltyApi.create(data);

export const updateLoyaltyProgram = async (
  programId: string,
  data: UpdateLoyaltyProgramRequest,
): Promise<{ message: string }> => loyaltyApi.update(programId, data);

export const deleteLoyaltyProgram = async (
  programId: string,
): Promise<{ message: string }> => loyaltyApi.delete(programId);
