import api from "./api";
import type { ApiResponse } from "@/interfaces/api/ApiResponse.interface";
import type {
  AccountListParams,
  AccountPayableOverview,
  AccountReceivableOverview,
  AccountsOverviewData,
  PayablePayment,
  ReceivableCollection,
} from "@/interfaces/entities/Finances.interface";

export const financesApi = {
  async getAccountsOverview(): Promise<AccountsOverviewData> {
    const response =
      await api.get<ApiResponse<AccountsOverviewData>>("/finances/accounts");
    return response.data.data;
  },

  async getPayables(
    params: AccountListParams,
  ): Promise<AccountPayableOverview[]> {
    const response = await api.get<ApiResponse<AccountPayableOverview[]>>(
      "/finances/accounts/payables",
      { params },
    );
    return response.data.data;
  },

  async getReceivables(
    params: AccountListParams,
  ): Promise<AccountReceivableOverview[]> {
    const response = await api.get<ApiResponse<AccountReceivableOverview[]>>(
      "/finances/accounts/receivables",
      { params },
    );
    return response.data.data;
  },

  async getPayablePayments(payableId: string): Promise<PayablePayment[]> {
    const response = await api.get<ApiResponse<PayablePayment[]>>(
      `/finances/accounts/payable/${payableId}/payments`,
    );
    return response.data.data;
  },

  async getReceivableCollections(
    receivableId: string,
  ): Promise<ReceivableCollection[]> {
    const response = await api.get<ApiResponse<ReceivableCollection[]>>(
      `/finances/accounts/receivable/${receivableId}/collections`,
    );
    return response.data.data;
  },
};
