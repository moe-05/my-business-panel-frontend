import { cashRegisterApi } from "@/api/cashRegister.api";

import type {
  CashRegister,
  CashRegisterSession,
} from "@/interfaces/entities/CashRegister.interface";

export const createCashRegister = async (data: {
  branchId: string;
  registerName: string;
  isActive?: boolean;
}): Promise<CashRegister> =>
  cashRegisterApi.create(
    data.branchId,
    data.registerName,
    data.isActive ?? true,
  );

export const getCashRegistersByBranch = async (
  branchId: string,
): Promise<CashRegister[]> => cashRegisterApi.list(branchId);

export const getOpenCashSessionsByBranch = async (
  branchId: string,
): Promise<CashRegisterSession[]> =>
  cashRegisterApi.listSessions({
    branchId,
    isActive: true,
  });

export const startCashRegisterSession = async (
  cashRegisterId: string,
  openingAmount: number,
  openedAt?: string,
): Promise<CashRegisterSession> =>
  cashRegisterApi.startSession(cashRegisterId, openingAmount, openedAt);

export const closeCashRegisterSession = async (
  sessionId: string,
  closingAmount: number,
  closedAt?: string,
): Promise<CashRegisterSession> =>
  cashRegisterApi.closeSession(sessionId, closingAmount, closedAt);
