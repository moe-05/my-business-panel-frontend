import { contractApi } from "@/api";
import type { UpdateContractPayload } from "@/interfaces/entities/Employee.interface";

export const updateContract = async (
  contractId: string,
  data: UpdateContractPayload,
): Promise<void> => contractApi.update(contractId, data);
