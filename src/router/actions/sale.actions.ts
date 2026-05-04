import { saleApi } from "@/api/sale.api";

import type { CreateSaleRequest } from "@/interfaces/api/requests/CreateSaleRequest.interface";
import type {
  CreateSaleResult,
  DigitalInvoiceInfo,
  ElectronicInvoiceInfo,
  SaleItemDetail,
} from "@/interfaces/entities/Sale.interface";

export const createFullSale = async (
  data: CreateSaleRequest,
): Promise<CreateSaleResult> => saleApi.createFullSale(data);

export const getDigitalInvoiceForSale = async (
  saleId: string,
): Promise<DigitalInvoiceInfo | null> => saleApi.getDigitalInvoice(saleId);

export const getElectronicInvoiceForSale = async (
  saleId: string,
): Promise<ElectronicInvoiceInfo | null> =>
  saleApi.getElectronicInvoiceForSale(saleId);

export const generateElectronicInvoiceForSale = async (
  saleId: string,
): Promise<ElectronicInvoiceInfo> =>
  saleApi.createElectronicInvoiceForSale(saleId);

export const getSaleItemsForSale = async (
  saleId: string,
): Promise<SaleItemDetail[]> => saleApi.getSaleItems(saleId);
